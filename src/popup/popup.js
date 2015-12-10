/* global utils, constants, settings, chrome, moment, logStore */
(function () {
    'use strict';

    var formats = constants.formats,
        events = constants.events,
        strings = constants.strings,
        regexps = constants.regexps,
        selectors = constants.selectors,
        labelFromEl,
        labelToEl,
        markAsReadEl,
        removeFromInboxEl,
        forceButtonEl,
        copyButtonEl,
        lastSuccessEl,
        nextCheckEl,
        hourEl;

    function loadOptions() {
        settings.load().then(function (settings) {
            labelFromEl.value = settings.labelFrom;
            labelToEl.value = settings.labelTo;
            markAsReadEl.checked = settings.markAsRead;
            removeFromInboxEl.checked = settings.removeFromInbox;
            lastSuccessEl.innerHTML = settings.lastSuccess ? moment(settings.lastSuccess).format(formats.DATE_FORMAT) : strings.NOT_PRESENT;
            nextCheckEl.innerHTML = settings.nextCheck ? moment(settings.nextCheck).format(formats.DATE_FORMAT) : strings.NOT_PRESENT;
            if (document.activeElement !== hourEl) {
                hourEl.value = utils.createHour(settings.checkHour);
            }
        }).fail(function (e) {
            logStore.error(strings.SETTINGS_LOAD_FAILED, e);
        });
    }

    function save() {
        var setting = {},
            hour = null;

        if (hourEl.value) {
            hour = hourEl.value.match(regexps.HOUR);
            hour = {
                hour: hour[1],
                minute: hour[2]
            };
        }

        setting[labelFromEl.name] = labelFromEl.value || null;
        setting[labelToEl.name] = labelToEl.value || null;
        setting[markAsReadEl.name] = markAsReadEl.checked;
        setting[removeFromInboxEl.name] = removeFromInboxEl.checked;
        setting[hourEl.name] = hour;

        settings.save(setting)
            .then(toggleAutoRefresh)
            .fail(function () {
                utils.flash(true);
            });
    }

    function sendEvent() {
        chrome.runtime.sendMessage(events.CYCLE_RUN);
    }

    function copyLogs() {
        chrome.runtime.sendMessage(events.LOGS_COPY);
    }

    function toggleAutoRefresh() {
        var message = events.TIMER_STOP;

        if (hourEl.value) {
            message = events.TIMER_START;
        }

        chrome.runtime.sendMessage(message);
    }

    document.addEventListener('DOMContentLoaded', function () {
        labelFromEl = document.querySelector(selectors.LABEL_FROM);
        labelToEl = document.querySelector(selectors.LABEL_TO);
        markAsReadEl = document.querySelector(selectors.MARK_AS_READ);
        removeFromInboxEl = document.querySelector(selectors.REMOVE_FROM_INBOX);
        forceButtonEl = document.querySelector(selectors.FORCE);
        lastSuccessEl = document.querySelector(selectors.LAST_SUCCESS);
        nextCheckEl = document.querySelector(selectors.NEXT_CHECK);
        copyButtonEl = document.querySelector(selectors.COPY_LOGS);
        hourEl = document.querySelector(selectors.CHECK_HOUR);

        forceButtonEl.addEventListener('click', sendEvent);
        copyButtonEl.addEventListener('click', copyLogs);

        labelFromEl.addEventListener('input', save);
        labelToEl.addEventListener('input', save);
        markAsReadEl.addEventListener('click', save);
        removeFromInboxEl.addEventListener('click', save);

        hourEl.addEventListener('input', save);
    });

    chrome.runtime.onMessage.addListener(function (message) {
        if (message === events.CYCLE_END) {
            lastSuccessEl.innerHTML = moment().format(formats.DATE_FORMAT);
            utils.flash();
            loadOptions();
        }

        if (message === events.CYCLE_FAILED) {
            utils.flash(true);
            loadOptions();
        }

        if (message === events.LOGS_COPIED) {
            utils.flash();
        }

        if (message === events.TIMER_UPDATED) {
            loadOptions();
        }
    });

    window.onload = loadOptions;
}());
