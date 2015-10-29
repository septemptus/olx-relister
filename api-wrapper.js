(function () {
	var INBOX_LABEL = 'INBOX',
		UNREAD_LABEL = 'UNREAD',
		clientId = '113558311566-o2ce28ic2rv5j5j2rvmmqebd6q7gq7cb.apps.googleusercontent.com',
		scope = 'https://www.googleapis.com/auth/gmail.modify',
		authorizationExpiryTime = null;
		
	function authorize(immediate) {
		var deferred = Q.defer();
		
		console.log('Authorizing ...');
		
		if (authorizationExpiryTime && authorizationExpiryTime.isAfter(moment())) {
			console.log('Authorization token still valid, skipping');
			return Q.when();
		}
		
		gapi.auth.authorize({
			immediate: immediate,
			client_id: clientId,
			scope: scope
		}, function (response) {
			if (response.error === 'immediate_failed') {
				console.log('Priviliges not set, prompting');
				authorize(false)
					.then(function (response) {
						console.log('Authorization successful');
						authorizationExpiryTime = moment(Number(response.expires_at) * 1000);
						deferred.resolve();
					})
					.fail(function () {
						console.error('Authorization error (with prompt)');
						deferred.reject('Non-immediate authorization failed');
					});
				return;
			}
			
			if (response.error) {
				console.error('Authorization error');
				deferred.reject('Immediate authorization failed');
				return;
			}
			
			console.log('Authorization successful');
			authorizationExpiryTime = moment(Number(response.expires_at) * 1000);
			deferred.resolve();
		});
					
		return deferred.promise;
	}

	function loadGmailApi() {
		var deferred = Q.defer();
		
		if (gapi.client.gmail) {
			return Q.when();
		}
		
		console.log('Loading GMail API');
		
		gapi.client.load('gmail', 'v1').then(deferred.resolve, deferred.reject);
		
		return deferred.promise;
	}

	function loadMessages() {
        return settings.load().then(function (settings) {
            var deferred = Q.defer(),
                listParameters = { userId: 'me' };

            if (settings.labelFrom) {
                listParameters.labelIds = settings.labelFrom;
            }

            console.log('Loading messages');

            gapi.client.gmail.users.messages.list(listParameters).then(deferred.resolve, deferred.reject);

            return deferred.promise;
        });
	}
	
	function parseMessages(response) {
        if (response.result && !response.result.messages) {
            console.log('No messages to parse');
            return Q.reject('No messages received');
        }

		return Q.all(response.result.messages.map(function (messageResponse) {
			var messageDeferred = Q.defer();
			
			console.log('Loading message');
			
			gapi.client.gmail.users.messages.get({ id: messageResponse.id, format: 'raw', userId: 'me' })
				.then(function (message) {
					console.log('Parsing message');
					messageDeferred.resolve({ id: messageResponse.id, msg: parseMessage(message) });
				}, messageDeferred.reject);
				
			return messageDeferred.promise;
		})).then(function (messages) {
			console.log('All messages parsed');
			
			return messages;
		});
	}
	
	function switchLabels(messages) {
        console.log('Switching labels');

        return Q.all(messages.map(function (message) {
                return switchLabel(message).then(function () {
                    console.log('Label switching successful');
                });
            })).then(function () {
                console.log('All labels switched');
            });
	}
	
	function parseMessage(message) {
		var body = JSON.parse(message.body);
								
		return atob(body.raw.replace(/-/g, '+').replace(/_/g, '/'));
	}
	
	function switchLabel(message) {
        return settings.load().then(function (settings) {
            var deferred = Q.defer(),
                labelsToRemove = [];

            if (!settings.labelFrom && !settings.labelTo && !settings.markAsRead && !settings.removeFromInbox) {
                console.log('No labels to switch');

                return Q.when();
            }

            if (settings.labelFrom) {
                labelsToRemove.push(settings.labelFrom);
            }

            if (settings.markAsRead) {
                labelsToRemove.push(UNREAD_LABEL);
            }

            if (settings.removeFromInbox) {
                labelsToRemove.push(INBOX_LABEL);
            }

            console.log('Switching labels, adding', settings.labelTo, ', removing', labelsToRemove);

            gapi.client.gmail.users.messages.modify({
                userId: 'me',
                id: message.id,
                addLabelIds: [settings.labelTo],
                removeLabelIds: labelsToRemove
            }).then(deferred.resolve, deferred.reject);

            return deferred.promise;
        });
	}

    function getLabels() {
        var deferred = Q.defer();

        console.log('Getting labels');

        loadGmailApi()
            .then(authorize.bind(null, true))
            .then(function () {
                gapi.client.gmail.users.labels.list({ userId: 'me' }).then(deferred.resolve, deferred.reject);
            });

        return deferred.promise;
    }

    function getLabel(labelId) {
        var deferred = Q.defer();

        console.log('Getting label name for', labelId);

        loadGmailApi()
            .then(authorize.bind(null, true))
            .then(function () {
                gapi.client.gmail.users.labels.get({ userId: 'me', id: labelId }).then(function (response) {
                    deferred.resolve(response.result.name);
                }, deferred.reject);
            });

        return deferred.promise;
    }
	
	function getMessages() {
		return loadGmailApi()
				.then(authorize.bind(null, true))
				.then(loadMessages)
				.then(parseMessages);
	}
	
	window.api = {
        getLabel: getLabel,
        getLabels: getLabels,
		switchLabels: switchLabels,
		getMessages: getMessages
	};
}());