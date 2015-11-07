/* global timerManager, Q, chrome, settings */
(function () {
    'use strict';

    describe('timerManager', function () {
        beforeEach(function () {
            window.settings = {
                settings: {
                    interval: 50000000
                },
                load: function () {
                    return Q.when(this.settings);
                },
                save: function () {
                    return Q.when();
                }
            };
        });

        describe('create', function () {
            it('should save the next alarm timestamp in the settings', function (done) {
                var spy = spyOn(settings, 'save');

                timerManager.create()
                    .then(function () {
                        expect(spy.calls.argsFor(0)[0].nextCheck).toBeDefined();
                        done();
                    });
            });

            it('should create a new alarm', function (done) {
                var spy = spyOn(chrome.alarms, 'create');

                timerManager.create()
                    .then(function () {
                        expect(spy).toHaveBeenCalled();
                        done();
                    });
            });

            it('should create an alarm with a timestamp from settings if there in one already pending', function (done) {
                var spy = spyOn(chrome.alarms, 'create');

                settings.settings.nextCheck = Date.now() + 100000;

                timerManager.create()
                    .then(function () {
                        expect(spy.calls.argsFor(0)[1].when).toBe(settings.settings.nextCheck);
                        done();
                    });
            });

            it('should create an alarm for now if the timestamp from settings has passed', function (done) {
                var spy = spyOn(chrome.alarms, 'create');

                settings.settings.nextCheck = Date.now() - 100000;

                timerManager.create()
                    .then(function () {
                        expect(spy.calls.argsFor(0)[1].when).toBeLessThan(Date.now() + 10000);
                        expect(spy.calls.argsFor(0)[1].when).toBeGreaterThan(Date.now() - 10000);
                        done();
                    });
            });

            it('should create an alarm for after an interval if the timestamp from settings has passed', function (done) {
                var spy = spyOn(chrome.alarms, 'create');

                settings.settings.nextCheck = Date.now() - 100000;

                timerManager.create(true)
                    .then(function () {
                        expect(spy.calls.argsFor(0)[1].when).toBeLessThan(Date.now() + settings.settings.interval + 10000);
                        expect(spy.calls.argsFor(0)[1].when).toBeGreaterThan(Date.now() + settings.settings.interval - 10000);
                        done();
                    });
            });
        });
    });
}());