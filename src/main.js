/* global chrome, ApiWrapper, logStore, msgParser, requester, notificator, settings, timerManager */
(function () {
    'use strict';

    var cycleInProgress = false,
        api;

    function runCycle() {
        var messages;

        api = api || new ApiWrapper();

        function switchLabels() {
            return api.switchLabels(messages);
        }

        function logLastSuccess() {
            return settings.save({
                lastSuccess: Date.now()
            });
        }

        function storeMessages(receivedMessages) {
            messages = receivedMessages;

            return receivedMessages;
        }

        function setNewTimer() {
            return timerManager.setNew();
        }

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
            .then(setNewTimer)
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
                setNewTimer().then(function () {
                    chrome.runtime.sendMessage('olx.cycle-failed');
                });
            });
    }

    function copyLogs() {
        document.oncopy = function (event) {
            event.clipboardData.setData('text', logStore.get());
            event.preventDefault();
        };

        document.execCommand('copy');
        document.oncopy = null;
        chrome.runtime.sendMessage('olx.logs-copied');
    }

    chrome.alarms.onAlarm.addListener(function (alarm) {
        if (alarm.name === 'olx.timer') {
            runCycle();
        }
    });

    chrome.runtime.onMessage.addListener(function (message) {
        if (message === 'olx.copy-logs') {
            copyLogs();
            return;
        }

        if (message === 'olx.run') {
            runCycle();
            return;
        }

        if (message === 'olx.timer.start') {
            timerManager.setNew().then(function () {
                chrome.runtime.sendMessage('olx.timer-updated');
            });

            return;
        }

        if (message === 'olx.timer.stop') {
            timerManager.clear().then(function () {
                chrome.runtime.sendMessage('olx.timer-updated');
            });
        }
    });

    window.onload = function () {
        timerManager.initialize();
    };
}());