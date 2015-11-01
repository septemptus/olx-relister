/* global chrome, ApiWrapper, console, msgParser, requester */
(function () {
    'use strict';

    var api = new ApiWrapper();

    chrome.runtime.onMessage.addListener(function (message) {
        var messages;

        function storeMessages(receivedMessages) {
            messages = receivedMessages;

            return receivedMessages;
        }

        function switchLabels() {
            return api.switchLabels(messages);
        }

        if (message === 'olx.run') {
            console.log('Starting process');

            api.getMessages()
                .then(storeMessages)
                .then(msgParser.getLinks)
                .then(requester.request)
                .then(switchLabels)
                .then(function () {
                    console.log('Task successful!');
                    chrome.runtime.sendMessage('olx.cycle-end');
                })
                .fail(function (e) {
                    console.error('Flow broken', e);
                    chrome.runtime.sendMessage('olx.cycle-failed');
                });
        }
    });
}());