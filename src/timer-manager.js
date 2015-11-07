/* global chrome, settings, moment, logStore */
(function () {
    'use strict';

    function create(withInterval) {
        return settings.load().then(function (loadedSettings) {
            var nextCheck = loadedSettings.nextCheck;

            logStore.log('Checking timer', nextCheck);

            if (!nextCheck || moment(nextCheck).isBefore(moment())) {
                logStore.log('No previous timer set, or timer passed, setting new');
                nextCheck = Date.now() + (withInterval ? loadedSettings.interval : 0);
            }

            chrome.alarms.create('olx.timer', { when: nextCheck });

            return settings.save({
                nextCheck: nextCheck
            });
        });
    }

    window.timerManager = {
        create: create
    };
}());