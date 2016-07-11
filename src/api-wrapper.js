import settings from './settings';
import logStore from './log-store';
import Q from 'q';
import moment from 'moment';
import gapi from 'gapi';

function ApiWrapper() {
    const INBOX_LABEL = 'INBOX';
    const UNREAD_LABEL = 'UNREAD';
    const PROMPT_TIMEOUT = 30 * 1000;
    const CLIENT_ID = '113558311566-rcfi51rf2e1p5jbn6rcf5ur8m4bnft9m.apps.googleusercontent.com';
    const SCOPE = 'https://www.googleapis.com/auth/gmail.modify';

    let authorizationExpiryTime = null;
    let labelMap;

    function authorize(immediate) {
        let deferred = Q.defer();

        logStore.log('Authorizing ...');

        if (authorizationExpiryTime && authorizationExpiryTime.isAfter(moment())) {
            logStore.log('Authorization token still valid, skipping');
            return Q.when();
        }

        gapi.auth.authorize({
            immediate: immediate,
            client_id: CLIENT_ID,
            scope: SCOPE
        }, (response) => {
            let resolved = false;

            if (response.error === 'immediate_failed') {
                logStore.log('Privileges not set, prompting');
                authorize(false)
                    .then((response) => {
                        if (!resolved) {
                            logStore.log('Authorization successful');
                            authorizationExpiryTime = moment(Number(response.expires_at) * 1000);
                            deferred.resolve(response);
                            resolved = true;
                        }
                    })
                    .fail(() => {
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
        let deferred = Q.defer();

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
        return settings.load().then((settings) => {
            let deferred = Q.defer();
            let listParameters = {userId: 'me'};

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
            let messageDeferred = Q.defer();

            logStore.log('Loading message');

            gapi.client.gmail.users.messages.get({id: messageResponse.id, format: 'raw', userId: 'me'})
                .then((message) => {
                    logStore.log('Parsing message');
                    messageDeferred.resolve({id: messageResponse.id, msg: parseMessage(message)});
                }, messageDeferred.reject);

            return messageDeferred.promise;
        })).then((messages) => {
            logStore.log('All messages parsed');

            return messages;
        });
    }

    function switchLabels(messages) {
        logStore.log('Switching labels');

        return loadGmailApi()
            .then(authorize.bind(null, true))
            .then(() => {
                if (!labelMap) {
                    return getLabels();
                }
            })
            .then(settings.load.bind(settings))
            .then((settings) => {
                return Q.all(messages.map((message) => {
                    return switchLabel(message, settings).then(() => {
                        logStore.log('Label switching successful');
                    });
                }));
            }).then(() => {
                logStore.log('All labels switched');
            });
    }

    function parseMessage(message) {
        let body = JSON.parse(message.body);

        return atob(body.raw.replace(/-/g, '+').replace(/_/g, '/'));
    }

    function switchLabel(message, settings) {
        let deferred = Q.defer();
        let labelsToRemove = [];

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
        let deferred = Q.defer();

        logStore.log('Getting labels');

        gapi.client.gmail.users.labels.list({userId: 'me'}).then((response) => {
            let map = {};

            response.result.labels.forEach((label) => {
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

export default ApiWrapper;