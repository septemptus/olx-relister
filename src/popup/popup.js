import logStore from '../log-store';
import settings from '../settings';
import constants from '../constants';
import utils from '../utils';
import chrome from 'chrome';
import moment from 'moment';

const FORMATS = constants.FORMATS;
const EVENTS = constants.EVENTS;
const STRINGS = constants.STRINGS;
const REGEXPS = constants.REGEXPS;
const SELECTORS = constants.SELECTORS;

let labelFromEl;
let labelToEl;
let markAsReadEl;
let removeFromInboxEl;
let forceButtonEl;
let copyButtonEl;
let lastSuccessEl;
let nextCheckEl;
let hourEl;

function loadOptions() {
    settings.load().then((settings) => {
        labelFromEl.value = settings.labelFrom;
        labelToEl.value = settings.labelTo;
        markAsReadEl.checked = settings.markAsRead;
        removeFromInboxEl.checked = settings.removeFromInbox;
        lastSuccessEl.innerHTML = settings.lastSuccess ? moment(settings.lastSuccess).format(FORMATS.DATE_FORMAT) : STRINGS.NOT_PRESENT;
        nextCheckEl.innerHTML = settings.nextCheck ? moment(settings.nextCheck).format(FORMATS.DATE_FORMAT) : STRINGS.NOT_PRESENT;
        if (document.activeElement !== hourEl) {
            hourEl.value = utils.createHour(settings.checkHour);
        }
    }).fail((e) => {
        logStore.error(STRINGS.SETTINGS_LOAD_FAILED, e);
    });
}

function save() {
    let setting = {};
    let hour = null;

    if (hourEl.value) {
        hour = hourEl.value.match(REGEXPS.HOUR);
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
        .fail(() => utils.flash(true));
}

function sendEvent() {
    chrome.runtime.sendMessage(EVENTS.CYCLE_RUN);
}

function copyLogs() {
    chrome.runtime.sendMessage(EVENTS.LOGS_COPY);
}

function toggleAutoRefresh() {
    let message = EVENTS.TIMER_STOP;

    if (hourEl.value) {
        message = EVENTS.TIMER_START;
    }

    chrome.runtime.sendMessage(message);
}

document.addEventListener('DOMContentLoaded', () => {
    labelFromEl = document.querySelector(SELECTORS.LABEL_FROM);
    labelToEl = document.querySelector(SELECTORS.LABEL_TO);
    markAsReadEl = document.querySelector(SELECTORS.MARK_AS_READ);
    removeFromInboxEl = document.querySelector(SELECTORS.REMOVE_FROM_INBOX);
    forceButtonEl = document.querySelector(SELECTORS.FORCE);
    lastSuccessEl = document.querySelector(SELECTORS.LAST_SUCCESS);
    nextCheckEl = document.querySelector(SELECTORS.NEXT_CHECK);
    copyButtonEl = document.querySelector(SELECTORS.COPY_LOGS);
    hourEl = document.querySelector(SELECTORS.CHECK_HOUR);

    forceButtonEl.addEventListener('click', sendEvent);
    copyButtonEl.addEventListener('click', copyLogs);

    labelFromEl.addEventListener('input', save);
    labelToEl.addEventListener('input', save);
    markAsReadEl.addEventListener('click', save);
    removeFromInboxEl.addEventListener('click', save);

    hourEl.addEventListener('input', save);
});

chrome.runtime.onMessage.addListener((message) => {
    if (message === EVENTS.CYCLE_END) {
        lastSuccessEl.innerHTML = moment().format(FORMATS.DATE_FORMAT);
        utils.flash();
        loadOptions();
    }

    if (message === EVENTS.CYCLE_FAILED) {
        utils.flash(true);
        loadOptions();
    }

    if (message === EVENTS.LOGS_COPIED) {
        utils.flash();
    }

    if (message === EVENTS.TIMER_UPDATED) {
        loadOptions();
    }
});

window.onload = loadOptions;