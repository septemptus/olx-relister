import logStore from './log-store';
import Q from 'q';
import chrome from 'chrome';

const DEFAULTS = {
    labelFrom: null,
    labelTo: null,
    checkHour: null,
    lastSuccess: null,
    nextCheck: null,
    markAsRead: false,
    removeFromInbox: false
};

function save(setting) {
    let deferred = Q.defer();

    logStore.log('Saving settings', setting);
    chrome.storage.sync.set(setting, () => {
        logStore.log('Settings saved');
        deferred.resolve();
    });

    return deferred.promise;
}

function load() {
    let deferred = Q.defer();

    logStore.log('Loading settings');

    chrome.storage.sync.get(DEFAULTS, deferred.resolve);

    return deferred.promise;
}

export default {
    save: save,
    load: load
};