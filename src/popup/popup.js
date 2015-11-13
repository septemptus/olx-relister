/* global settings, chrome, moment, logStore */
(function () {
    'use strict';

    var DATE_FORMAT = 'DD.MM.YYYY HH:mm',
        labelFromEl,
        labelToEl,
        markAsReadEl,
        removeFromInboxEl,
        forceButtonEl,
        copyButtonEl,
        lastSuccessEl,
        nextCheckEl,
        hourEl;

    function flash(className) {
        document.body.classList.add(className);

        setTimeout(function () {
            document.body.classList.remove(className);
        }, 500);
    }

    function loadOptions() {
        function getTwoDigitString(num) {
            var numString = '' + num;

            return numString.length === 2 ? numString : '0' + numString;
        }

        settings.load().then(function (settings) {
            labelFromEl.value = settings.labelFrom;
            labelToEl.value = settings.labelTo;
            markAsReadEl.checked = settings.markAsRead;
            removeFromInboxEl.checked = settings.removeFromInbox;
            lastSuccessEl.innerHTML = settings.lastSuccess ? moment(settings.lastSuccess).format(DATE_FORMAT) : '-';
            nextCheckEl.innerHTML = settings.nextCheck ? moment(settings.nextCheck).format(DATE_FORMAT) : '-';
            if (document.activeElement !== hourEl) {
                hourEl.value = settings.checkHour ? getTwoDigitString(settings.checkHour.hour) + ':' + getTwoDigitString(settings.checkHour.minute) : '';
            }
        }).fail(function (e) {
            logStore.error('Failed to load settings', e);
        });
    }

    function save() {
        var setting = {};

        setting[labelFromEl.name] = labelFromEl.value || null;
        setting[labelToEl.name] = labelToEl.value || null;
        setting[markAsReadEl.name] = markAsReadEl.checked;
        setting[removeFromInboxEl.name] = removeFromInboxEl.checked;
        setting[hourEl.name] = hourEl.value ? { hour: ~~hourEl.value.substring(0, 2), minute: ~~hourEl.value.substring(3, 5)} : null;

        settings.save(setting)
            .then(toggleAutoRefresh)
            .fail(function () {
                flash('error');
            });
    }

    function sendEvent() {
        chrome.runtime.sendMessage('olx.run');
    }

    function copyLogs() {
        chrome.runtime.sendMessage('olx.copy-logs');
    }

    function toggleAutoRefresh() {
        var message = 'olx.timer.stop';

        if (hourEl.value) {
            message = 'olx.timer.start';
        }

        chrome.runtime.sendMessage(message);
    }

    document.addEventListener('DOMContentLoaded', function () {
        labelFromEl = document.querySelector('[name=labelFrom]');
        labelToEl = document.querySelector('[name=labelTo]');
        markAsReadEl = document.querySelector('[name=markAsRead]');
        removeFromInboxEl = document.querySelector('[name=removeFromInbox]');
        forceButtonEl = document.querySelector('[name=force]');
        lastSuccessEl = document.querySelector('#last-success');
        nextCheckEl = document.querySelector('#next-check');
        copyButtonEl = document.querySelector('[name=logs]');
        hourEl = document.querySelector('[name=checkHour]');

        forceButtonEl.addEventListener('click', sendEvent);
        copyButtonEl.addEventListener('click', copyLogs);

        labelFromEl.addEventListener('input', save);
        labelToEl.addEventListener('input', save);
        markAsReadEl.addEventListener('click', save);
        removeFromInboxEl.addEventListener('click', save);

        hourEl.addEventListener('input', save);
    });

    chrome.runtime.onMessage.addListener(function (message) {
        if (message === 'olx.cycle-end') {
            lastSuccessEl.innerHTML = moment().format(DATE_FORMAT);
            flash('success');
            loadOptions();
        }

        if (message === 'olx.cycle-failed') {
            flash('error');
            loadOptions();
        }

        if (message === 'olx.logs-copied') {
            flash('success');
        }

        if (message === 'olx.timer-updated') {
            loadOptions();
        }
    });

    window.onload = loadOptions;
}());
