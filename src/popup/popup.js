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
        nextCheckEl;

    function flash(className) {
        document.body.classList.add(className);

        setTimeout(function () {
            document.body.classList.remove(className);
        }, 500);
    }

    function loadOptions() {
        settings.load().then(function (settings) {
            labelFromEl.value = settings.labelFrom;
            labelToEl.value = settings.labelTo;
            markAsReadEl.checked = settings.markAsRead;
            removeFromInboxEl.checked = settings.removeFromInbox;
            lastSuccessEl.innerHTML = settings.lastSuccess ? moment(settings.lastSuccess).format(DATE_FORMAT) : '-';
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

        settings.save(setting)
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

    document.addEventListener('DOMContentLoaded', function () {
        labelFromEl = document.querySelector('[name=labelFrom]');
        labelToEl = document.querySelector('[name=labelTo]');
        markAsReadEl = document.querySelector('[name=markAsRead]');
        removeFromInboxEl = document.querySelector('[name=removeFromInbox]');
        forceButtonEl = document.querySelector('[name=force]');
        lastSuccessEl = document.querySelector('#last-success');
        nextCheckEl = document.querySelector('#next-check');
        copyButtonEl = document.querySelector('[name=logs]');

        forceButtonEl.addEventListener('click', sendEvent);
        copyButtonEl.addEventListener('click', copyLogs);

        labelFromEl.addEventListener('input', save);
        labelToEl.addEventListener('input', save);
        markAsReadEl.addEventListener('click', save);
        removeFromInboxEl.addEventListener('click', save);
    });

    chrome.runtime.onMessage.addListener(function (message) {
        if (message === 'olx.cycle-end') {
            lastSuccessEl.innerHTML = moment().format(DATE_FORMAT);
            flash('success');
        }

        if (message === 'olx.logs-copied') {
            flash('success');
        }

        if (message === 'olx.cycle-failed') {
            flash('error');
        }
    });

    window.onload = loadOptions;
}());
