/* global logStore, Q, moment, gapi, settings */
(function () {
    'use strict';

    function ApiWrapper() {
        var INBOX_LABEL = 'INBOX',
            UNREAD_LABEL = 'UNREAD',
            PROMPT_TIMEOUT = 30 * 1000,
            clientId = '113558311566-rcfi51rf2e1p5jbn6rcf5ur8m4bnft9m.apps.googleusercontent.com',
            scope = 'https://www.googleapis.com/auth/gmail.modify',
            authorizationExpiryTime = null,
            labelMap;

        function authorize(immediate) {
            var deferred = Q.defer();

            logStore.log('Authorizing ...');

            if (authorizationExpiryTime && authorizationExpiryTime.isAfter(moment())) {
                logStore.log('Authorization token still valid, skipping');
                return Q.when();
            }

            gapi.auth.authorize({
                immediate: immediate,
                client_id: clientId,
                scope: scope
            }, function (response) {
                var resolved = false;

                if (response.error === 'immediate_failed') {
                    logStore.log('Privileges not set, prompting');
                    authorize(false)
                        .then(function (response) {
                            if (!resolved) {
                                logStore.log('Authorization successful');
                                authorizationExpiryTime = moment(Number(response.expires_at) * 1000);
                                deferred.resolve(response);
                                resolved = true;
                            }
                        })
                        .fail(function () {
                            if (!resolved) {
                                logStore.error('Authorization error (with prompt)');
                                deferred.reject('Non-immediate authorization failed');
                                resolved = true;
                            }
                        });

                    setTimeout(function () {
                        if (!resolved) {
                            logStore.error('Privileges prompt failed, timed out');
                            deferred.reject('Privileges prompt failed, timed out');
                            resolved = true;
                        }
                    }, PROMPT_TIMEOUT);

                    return;
                }

                if (response.error) {
                    logStore.error('Authorization error');
                    deferred.reject('Immediate authorization failed');
                    return;
                }

                logStore.log('Authorization successful');
                authorizationExpiryTime = moment(Number(response.expires_at) * 1000);
                deferred.resolve(response);
            });

            return deferred.promise;
        }

        function loadGmailApi() {
            var deferred = Q.defer();

            if (gapi.client.gmail) {
                return Q.when();
            }

            logStore.log('Loading GMail API');

            gapi.client.load('gmail', 'v1').then(deferred.resolve, deferred.reject);

            return deferred.promise;
        }

        function verifyLabels(from, to) {
            if (from && !labelMap[from]) {
                throw 'Source label does not exist';
            }

            if (to && !labelMap[to]) {
                throw 'Target label does not exist';
            }
        }

        function loadMessages() {
            return settings.load().then(function (settings) {
                var deferred = Q.defer(),
                    listParameters = { userId: 'me' };

                verifyLabels(settings.labelFrom, settings.labelTo);

                if (settings.labelFrom) {
                    listParameters.labelIds = labelMap[settings.labelFrom];
                }

                logStore.log('Loading messages');

                gapi.client.gmail.users.messages.list(listParameters).then(deferred.resolve, deferred.reject);

                return deferred.promise;
            });
        }

        function parseMessages(response) {
            if (response.result && !response.result.messages) {
                logStore.log('No messages to parse');
                return Q.reject('No messages received');
            }

            return Q.all(response.result.messages.map(function (messageResponse) {
                var messageDeferred = Q.defer();

                logStore.log('Loading message');

                gapi.client.gmail.users.messages.get({ id: messageResponse.id, format: 'raw', userId: 'me' })
                    .then(function (message) {
                        logStore.log('Parsing message');
                        messageDeferred.resolve({ id: messageResponse.id, msg: parseMessage(message) });
                    }, messageDeferred.reject);

                return messageDeferred.promise;
            })).then(function (messages) {
                logStore.log('All messages parsed');

                return messages;
            });
        }

        function switchLabels(messages) {
            logStore.log('Switching labels');

            return loadGmailApi()
                .then(authorize.bind(null, true))
                .then(function () {
                    if (!labelMap) {
                        return getLabels();
                    }
                })
                .then(settings.load.bind(settings))
                .then(function (settings) {
                    return Q.all(messages.map(function (message) {
                        return switchLabel(message, settings).then(function () {
                            logStore.log('Label switching successful');
                        });
                    }));
                }).then(function () {
                    logStore.log('All labels switched');
                });
        }

        function parseMessage(message) {
            var body = JSON.parse(message.body);

            return atob(body.raw.replace(/-/g, '+').replace(/_/g, '/'));
        }

        function switchLabel(message, settings) {
            var deferred = Q.defer(),
                labelsToRemove = [];

            if (!settings.labelFrom && !settings.labelTo && !settings.markAsRead && !settings.removeFromInbox) {
                logStore.log('No labels to switch');

                return Q.when();
            }

            if (settings.labelFrom) {
                labelsToRemove.push(labelMap[settings.labelFrom]);
            }

            if (settings.markAsRead) {
                labelsToRemove.push(UNREAD_LABEL);
            }

            if (settings.removeFromInbox) {
                labelsToRemove.push(INBOX_LABEL);
            }

            logStore.log('Switching labels, adding', labelMap[settings.labelTo], ', removing', labelsToRemove);

            gapi.client.gmail.users.messages.modify({
                userId: 'me',
                id: message.id,
                addLabelIds: (settings.labelTo && [labelMap[settings.labelTo]]) || [],
                removeLabelIds: labelsToRemove
            }).then(deferred.resolve, deferred.reject);

            return deferred.promise;
        }

        function getLabels() {
            var deferred = Q.defer();

            logStore.log('Getting labels');

            gapi.client.gmail.users.labels.list({ userId: 'me' }).then(function (response) {
                var map = {};

                response.result.labels.forEach(function (label) {
                    map[label.name] = label.id;
                });

                labelMap = map;
                deferred.resolve(map);
            }, deferred.reject);

            return deferred.promise;
        }

        function getMessages() {
            return loadGmailApi()
                .then(authorize.bind(null, true))
                .then(getLabels)
                .then(loadMessages)
                .then(parseMessages);
        }

        return {
            switchLabels: switchLabels,
            getMessages: getMessages
        };
    }

    window.ApiWrapper = ApiWrapper;
}());