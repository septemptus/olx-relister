/* global settings, api, console, chrome, moment */
(function () {
    'use strict';

    var DATE_FORMAT = 'DD.MM.YYYY HH:mm',
        labelFromEl,
        labelToEl,
        markAsReadEl,
        removeFromInboxEl,
        saveButtonEl,
        forceButtonEl,
        fromContainerEl,
        toContainerEl,
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
            console.error('Failed to load settings', e);
        });
    }

    function save() {
        var setting = {};

        fromContainerEl.classList.remove('has-error');
        toContainerEl.classList.remove('has-error');

        setting[labelFromEl.name] = labelFromEl.value || null;
        setting[labelToEl.name] = labelToEl.value || null;
        setting[markAsReadEl.name] = markAsReadEl.checked;
        setting[removeFromInboxEl.name] = removeFromInboxEl.checked;

        settings.save(setting)
            .then(function () {
                flash('success');
            })
            .fail(function () {
                flash('error');
                fromContainerEl.classList.add('has-error');
                toContainerEl.classList.add('has-error');
            });
    }

    function sendEvent() {
        chrome.runtime.sendMessage('olx.run');
    }

    document.addEventListener('DOMContentLoaded', function () {
        fromContainerEl = document.querySelector('#from-container');
        toContainerEl = document.querySelector('#to-container');
        labelFromEl = document.querySelector('[name=labelFrom]');
        labelToEl = document.querySelector('[name=labelTo]');
        markAsReadEl = document.querySelector('[name=markAsRead]');
        removeFromInboxEl = document.querySelector('[name=removeFromInbox]');
        saveButtonEl = document.querySelector('[name=save]');
        forceButtonEl = document.querySelector('[name=force]');
        lastSuccessEl = document.querySelector('#last-success');
        nextCheckEl = document.querySelector('#next-check');

        saveButtonEl.addEventListener('click', save);
        forceButtonEl.addEventListener('click', sendEvent);
    });

    chrome.runtime.onMessage.addListener(function (message) {
        if (message === 'olx.cycle-end') {
            lastSuccessEl.innerHTML = moment().format(DATE_FORMAT);
            flash('success');
        }

        if (message === 'olx.cycle-failed') {
            flash('error');
        }
    });

    window.onload = loadOptions;
}());
