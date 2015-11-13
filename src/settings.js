/* global logStore, Q, chrome */
(function () {
    'use strict';

    var DEFAULTS = {
        labelFrom: null,
        labelTo: null,
        checkHour: null,
        lastSuccess: null,
        nextCheck: null,
        markAsRead: false,
        removeFromInbox: false
    };

    function save(setting) {
        var deferred = Q.defer();

        logStore.log('Saving settings', setting);
        chrome.storage.sync.set(setting, function () {
            logStore.log('Settings saved');
            deferred.resolve();
        });

        return deferred.promise;
    }

    function load() {
        var deferred = Q.defer();

        logStore.log('Loading settings');

        chrome.storage.sync.get(DEFAULTS, deferred.resolve);

        return deferred.promise;
    }

    window.settings = {
        save: save,
        load: load
    };
}());