/* global Q, chrome, settings, moment, logStore */
(function () {
    'use strict';

    var TIMER_NAME = 'olx.timer';

    function create(withInterval) {
        return settings.load().then(function (loadedSettings) {
            var nextCheck = loadedSettings.nextCheck;

            logStore.log('Checking timer', nextCheck);

            if (!nextCheck || moment(nextCheck).isBefore(moment())) {
                logStore.log('No previous timer set, or timer passed, setting new');
                nextCheck = Date.now() + (withInterval ? loadedSettings.interval : 0);
            }

            chrome.alarms.create(TIMER_NAME, { when: nextCheck });

            return settings.save({
                nextCheck: nextCheck
            });
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

    function reload() {
        logStore.log('Loading old timer');
        return settings.load().then(function (loadedSettings) {
            if (loadedSettings.nextCheck) {
                return create();
            }

            logStore.log('No old timer detected');
            return Q.when();
        });
    }

    window.timerManager = {
        reload: reload,
        create: create,
        clear: clear
    };
}());