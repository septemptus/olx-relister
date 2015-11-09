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

            it('should create an alarm if there is no timestamp', function (done) {
                var spy = spyOn(chrome.alarms, 'create');

                settings.settings.nextCheck = null;

                timerManager.create()
                    .then(function () {
                        expect(spy).toHaveBeenCalled();
                        done();
                    });
            });
        });

        describe('reload', function () {
            it('should create an alarm if there is a timestamp', function (done) {
                var spy = spyOn(chrome.alarms, 'create');

                settings.settings.nextCheck = 123;

                timerManager.reload()
                    .then(function () {
                        expect(spy).toHaveBeenCalled();
                        done();
                    });
            });

            it('should not create an alarm if there is no timestamp', function (done) {
                var spy = spyOn(chrome.alarms, 'create');

                settings.settings.nextCheck = null;

                timerManager.reload()
                    .then(function () {
                        expect(spy).not.toHaveBeenCalled();
                        done();
                    });
            });
        });

        describe('clear', function () {
            it('should clear the timer from chrome', function (done) {
                var spy = spyOn(chrome.alarms, 'clear').and.callThrough();

                timerManager.clear()
                    .then(function () {
                        expect(spy).toHaveBeenCalled();
                        done();
                    });
            });

            it('should clear the timer from settings', function (done) {
                var spy = spyOn(settings, 'save').and.callThrough();

                timerManager.clear()
                    .then(function () {
                        expect(spy).toHaveBeenCalledWith({ nextCheck: null });
                        done();
                    });
            });
        });
    });
}());