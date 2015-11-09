/* global Q, chrome, settings, moment, logStore */
(function () {
    'use strict';

    var TIMER_NAME = 'olx.timer';

    function set(nextCheck) {
        chrome.alarms.create(TIMER_NAME, { when: nextCheck });

        return settings.save({
            nextCheck: nextCheck
        });
    }

    function initialize() {
        return settings.load().then(function (loadedSettings) {
            var nextCheck = loadedSettings.nextCheck;

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

    function setLater() {
        return settings.load().then(function (loadedSettings) {
            var nextCheck = loadedSettings.nextCheck;

            logStore.log('Checking timer', nextCheck);

            if (!nextCheck) {
                logStore.log('No timer to set, moving on');

                return Q.when();
            }

            return set(Date.now() + loadedSettings.interval);
        });
    }

    function clear() {
        var deferred = Q.defer();

        logStore.log('Clearing timer');

        chrome.alarms.clear(TIMER_NAME, function () {
            settings.save({
                    nextCheck: null
                })
                .then(deferred.resolve)
                .fail(deferred.reject);
        });

        return deferred.promise;
    }

    function create() {
        return settings.load().then(function (loadedSettings) {
            if (!loadedSettings.nextCheck) {
                return set(Date.now());
            }
        });
    }

    window.timerManager = {
        initialize: initialize,
        setLater: setLater,
        clear: clear,
        create: create
    };
}());