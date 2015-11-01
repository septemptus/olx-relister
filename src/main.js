/* global chrome, ApiWrapper, console, msgParser, requester */
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
                .then(function () {
                    cycleInProgress = false;
                    console.log('Task successful!');
                    chrome.runtime.sendMessage('olx.cycle-end');
                })
                .fail(function (e) {
                    cycleInProgress = false;
                    console.error('Flow broken', e);
                    chrome.runtime.sendMessage('olx.cycle-failed');
                });
        }
    });
}());