import settings from './settings';
import logStore from './log-store';
import moment from 'moment';
import Q from 'q';
import chrome from 'chrome';

const TIMER_NAME = 'olx.timer';

function getNextCheck(settings) {
    let target = moment(Date.now());

    if (!settings.checkHour) {
        throw 'Check hour is not defined';
    }

    target
        .hour(settings.checkHour.hour)
        .minute(settings.checkHour.minute)
        .startOf('minute');

    if (target.isBefore(moment(Date.now()))) {
        target.add({ days: 1 });
    }

    return target.valueOf();
}

function set(nextCheck) {
    logStore.log('Setting timer', nextCheck);
    chrome.alarms.create(TIMER_NAME, { when: nextCheck });

    return settings.save({
        nextCheck: nextCheck
    });
}

function initialize() {
    return settings.load().then((loadedSettings) => {
        let nextCheck = loadedSettings.nextCheck;

        logStore.log('Checking timer', nextCheck);

        if (!nextCheck) {
            logStore.log('No timer to set, moving on');

            return Q.when();
        }

        if (moment(nextCheck).isBefore(moment())) {
            logStore.log('Timer passed, setting new');
            nextCheck = Date.now();
        }

        return set(nextCheck);
    });
}

function setNew() {
    return settings.load().then((loadedSettings) => {
        return set(getNextCheck(loadedSettings));
    });
}

function clear() {
    let deferred = Q.defer();

    logStore.log('Clearing timer');

    chrome.alarms.clear(TIMER_NAME, () => {
        settings.save({
                nextCheck: null
            })
            .then(deferred.resolve)
            .fail(deferred.reject);
    });

    return deferred.promise;
}

export default {
    initialize: initialize,
    setNew: setNew,
    clear: clear
};