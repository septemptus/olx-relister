import ApiWrapper from './api-wrapper';
import logStore from './log-store';
import msgParser from './msg-parser';
import requester from './requester';
import notificator from './notificator';
import settings from './settings';
import timerManager from './timer-manager'
import chrome from 'chrome';

let cycleInProgress = false;
let api;

function runCycle() {
    let messages;

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
        .then(() => {
            cycleInProgress = false;
            logStore.log('Task successful!');
            notificator.notifySuccess();
            chrome.runtime.sendMessage('olx.cycle-end');
        })
        .fail((e) => {
            cycleInProgress = false;
            logStore.error('Flow broken', e);
            notificator.notifyError(e);
            setNewTimer().finally(() => {
                chrome.runtime.sendMessage('olx.cycle-failed');
            });
        });
}

function copyLogs() {
    document.oncopy = (event) => {
        event.clipboardData.setData('text', logStore.get());
        event.preventDefault();
    };

    document.execCommand('copy');
    document.oncopy = null;
    chrome.runtime.sendMessage('olx.logs-copied');
}

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'olx.timer') {
        runCycle();
    }
});

chrome.runtime.onMessage.addListener((message) => {
    if (message === 'olx.copy-logs') {
        copyLogs();
        return;
    }

    if (message === 'olx.run') {
        runCycle();
        return;
    }

    if (message === 'olx.timer.start') {
        timerManager.setNew().then(() => {
            chrome.runtime.sendMessage('olx.timer-updated');
        });

        return;
    }

    if (message === 'olx.timer.stop') {
        timerManager.clear().then(() => {
            chrome.runtime.sendMessage('olx.timer-updated');
        });
    }
});

window.onload = () => timerManager.initialize();