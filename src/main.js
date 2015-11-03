/* global chrome, ApiWrapper, logStore, msgParser, requester, notificator, settings */
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

        if (message === 'olx.copy-logs') {
            document.oncopy = function (event) {
                event.clipboardData.setData('text', logStore.get());
                event.preventDefault();
            };

            document.execCommand('copy');
            document.oncopy = null;
            chrome.runtime.sendMessage('olx.logs-copied');
            return;
        }

        if (message === 'olx.run') {
            if (cycleInProgress) {
                logStore.error('Cycle not started, one is already in progress');
                chrome.runtime.sendMessage('olx.cycle-in-progress');
                return;
            }

            cycleInProgress = true;

            logStore.log('Starting process');

            api.getMessages()
                .then(storeMessages)
                .then(msgParser.getLinks)
                .then(requester.request)
                .then(switchLabels)
                .then(logLastSuccess)
                .then(function () {
                    cycleInProgress = false;
                    logStore.log('Task successful!');
                    notificator.notifySuccess();
                    chrome.runtime.sendMessage('olx.cycle-end');
                })
                .fail(function (e) {
                    cycleInProgress = false;
                    logStore.error('Flow broken', e);
                    notificator.notifyError(e);
                    chrome.runtime.sendMessage('olx.cycle-failed');
                });
        }
    });
}());