/* global chrome, ApiWrapper, console, msgParser, requester, notificator, settings */
(function () {
    'use strict';

    var cycleInProgress = false,
        api;

    chrome.runtime.onMessage.addListener(function (message) {
        var messages;

        api = api || new ApiWrapper();

        function storeMessages(receivedMessages) {
            messages = receivedMessages;

            return receivedMessages;
        }

        function switchLabels() {
            return api.switchLabels(messages);
        }

        function logLastSuccess() {
            return settings.save({
                lastSuccess: Date.now()
            });
        }

        if (message === 'olx.run') {
            if (cycleInProgress) {
                console.warn('Cycle not started, one is already in progress');
                chrome.runtime.sendMessage('olx.cycle-in-progress');
                return;
            }

            cycleInProgress = true;

            console.log('Starting process');

            api.getMessages()
                .then(storeMessages)
                .then(msgParser.getLinks)
                .then(requester.request)
                .then(switchLabels)
                .then(logLastSuccess)
                .then(function () {
                    cycleInProgress = false;
                    console.log('Task successful!');
                    notificator.notifySuccess();
                    chrome.runtime.sendMessage('olx.cycle-end');
                })
                .fail(function (e) {
                    cycleInProgress = false;
                    console.error('Flow broken', e);
                    notificator.notifyError(e);
                    chrome.runtime.sendMessage('olx.cycle-failed');
                });
        }
    });
}());