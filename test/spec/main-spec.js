/* global chrome, Q, ApiWrapper, msgParser, requester, notificator, settings, timerManager */
(function () {
    'use strict';

    var realApiWrapper = ApiWrapper,
        realMsgParser = msgParser,
        realRequester = requester,
        realNotificator = notificator,
        realTimerManager = timerManager,
        realSettings = settings,
        msgParserMock = {
            getLinks: function () {
                return returnPromise(getLinksSpy);
            }
        },
        requesterMock = {
            request: function () {
                return returnPromise(requestSpy);
            }
        },
        notificatorMock = {
            notifySuccess: jasmine.createSpy(),
            notifyError: jasmine.createSpy()
        },
        timerManagerMock = {
            create: function () {
                return returnPromise(createSpy);
            },
            clear: function () {
                return returnPromise(clearSpy);
            },
            setLater: function () {
                return returnPromise(setLaterSpy);
            },
            initialize: function () {
                return returnPromise(initializeSpy);
            }
        },
        settingsMock = {
            load: function () {
                return Q.when();
            },
            save: function () {
                return Q.when();
            }
        },
        getMessagesSpy,
        switchLabelsSpy,
        getLinksSpy,
        requestSpy,
        createSpy,
        clearSpy,
        setLaterSpy,
        initializeSpy;

    function returnPromise(spy) {
        if (spy()) {
            return Q.when();
        }

        return Q.reject();
    }

    function ApiWrapperMock() {
        return {
            getMessages: function () {
                return returnPromise(getMessagesSpy);
            },
            switchLabels: function () {
                return returnPromise(switchLabelsSpy);
            }
        };
    }

    function setMocks() {
        getMessagesSpy = jasmine.createSpy().and.returnValue(true);
        switchLabelsSpy = jasmine.createSpy().and.returnValue(true);
        getLinksSpy = jasmine.createSpy().and.returnValue(true);
        requestSpy = jasmine.createSpy().and.returnValue(true);
        createSpy = jasmine.createSpy().and.returnValue(true);
        clearSpy = jasmine.createSpy().and.returnValue(true);
        setLaterSpy = jasmine.createSpy().and.returnValue(true);
        initializeSpy = jasmine.createSpy().and.returnValue(true);

        window.ApiWrapper = ApiWrapperMock;
        window.msgParser = msgParserMock;
        window.requester = requesterMock;
        window.notificator = notificatorMock;
        window.timerManager = timerManagerMock;
        window.settings = settingsMock;
    }

    function resetMocks() {
        window.ApiWrapper = realApiWrapper;
        window.msgParser = realMsgParser;
        window.requester = realRequester;
        window.notificator = realNotificator;
        window.timerManager = realTimerManager;
        window.settings = realSettings;
    }

    function resetSpies() {
        getLinksSpy.calls.reset();
        getMessagesSpy.calls.reset();
        switchLabelsSpy.calls.reset();
        requestSpy.calls.reset();
        createSpy.calls.reset();
        clearSpy.calls.reset();
        setLaterSpy.calls.reset();
        initializeSpy.calls.reset();
        notificatorMock.notifySuccess.calls.reset();
        notificatorMock.notifyError.calls.reset();
    }

    function clearListeners() {
        chrome.runtime.onMessage.clearListeners();
        chrome.alarms.onAlarm.clearListeners();
    }

    describe('main', function () {
        beforeEach(setMocks);
        beforeEach(resetSpies);
        afterEach(resetMocks);
        afterEach(clearListeners);

        describe('given we start the cycle using a force message', function () {
            it('should start the cycle on "olx.run" message', function (done) {
                chrome.runtime.addOnDone(function () {
                    expect(getMessagesSpy).toHaveBeenCalled();
                    done();
                });

                chrome.runtime.sendMessage('olx.run');
            });

            it('should not start the cycle given a different message than "olx.run"', function (done) {
                chrome.runtime.addOnDone(function () {
                    expect(getMessagesSpy).not.toHaveBeenCalled();
                    done();
                });

                chrome.runtime.sendMessage('olx.runxx');
            });

            it('should emit an "olx.cycle-end" message on success', function (done) {
                chrome.runtime.addOnDone(function (messages) {
                    expect(messages).toEqual(['olx.run', 'olx.cycle-end']);
                    done();
                });

                chrome.runtime.sendMessage('olx.run');
            });

            it('should emit an "olx.cycle-failed" message on error', function (done) {
                getMessagesSpy = jasmine.createSpy().and.returnValue(false);

                chrome.runtime.addOnDone(function (messages) {
                    expect(messages).toEqual(['olx.run', 'olx.cycle-failed']);
                    done();
                });

                chrome.runtime.sendMessage('olx.run');
            });

            it('should not allow concurrent cycles to run in the same time', function (done) {
                chrome.runtime.addOnDone(function (messages) {
                    expect(messages).toEqual(['olx.run', 'olx.run', 'olx.cycle-in-progress', 'olx.cycle-end']);
                    done();
                });

                chrome.runtime.sendMessage('olx.run');
                chrome.runtime.sendMessage('olx.run');
            });

            it('should deflag concurrent cycle lock after a successful cycle', function (done) {
                chrome.runtime.addOnDone(function () {
                    chrome.runtime.addOnDone(function (messages) {
                        expect(messages).toEqual(['olx.run', 'olx.cycle-end', 'olx.run', 'olx.cycle-end']);
                        done();
                    });

                    chrome.runtime.sendMessage('olx.run');
                });

                chrome.runtime.sendMessage('olx.run');
            });

            it('should deflag concurrent cycle lock after a failed cycle', function (done) {
                getMessagesSpy = jasmine.createSpy().and.returnValue(false);

                chrome.runtime.addOnDone(function () {
                    chrome.runtime.addOnDone(function (messages) {
                        expect(messages).toEqual(['olx.run', 'olx.cycle-failed', 'olx.run', 'olx.cycle-failed']);
                        done();
                    });

                    chrome.runtime.sendMessage('olx.run');
                });

                chrome.runtime.sendMessage('olx.run');
            });

            it('should show a notification after a successful cycle', function (done) {
                chrome.runtime.addOnDone(function () {
                    expect(notificatorMock.notifySuccess).toHaveBeenCalled();
                    done();
                });

                chrome.runtime.sendMessage('olx.run');
            });

            it('should show a notification after a failed cycle', function (done) {
                getMessagesSpy = jasmine.createSpy().and.returnValue(false);

                chrome.runtime.addOnDone(function () {
                    expect(notificatorMock.notifyError).toHaveBeenCalled();
                    done();
                });

                chrome.runtime.sendMessage('olx.run');
            });

            it('should log a last success timestamp', function (done) {
                var spy = spyOn(settings, 'save').and.returnValue(Q.when());

                chrome.runtime.addOnDone(function () {
                    expect(spy).toHaveBeenCalled();
                    done();
                });

                chrome.runtime.sendMessage('olx.run');
            });

            it('should start a new timer given a success', function (done) {
                var spy = spyOn(timerManager, 'setLater').and.callThrough();

                chrome.runtime.addOnDone(function () {
                    expect(spy).toHaveBeenCalled();
                    done();
                });

                chrome.runtime.sendMessage('olx.run');
            });

            it('should start a new timer given a failure', function (done) {
                var spy = spyOn(timerManager, 'setLater').and.callThrough();

                getMessagesSpy = jasmine.createSpy().and.returnValue(false);

                chrome.runtime.addOnDone(function () {
                    expect(spy).toHaveBeenCalled();
                    done();
                });

                chrome.runtime.sendMessage('olx.run');
            });
        });

        describe('given we start the cycle using the timer', function () {
            it('should start the cycle on olx.timer timer message', function (done) {
                chrome.runtime.addOnDone(function () {
                    expect(getMessagesSpy).toHaveBeenCalled();
                    done();
                });

                chrome.alarms.trigger();
            });

            it('should not start the cycle on a timer message other than olx.timer', function (done) {
                chrome.alarms.addOnDone(function () {
                    expect(getMessagesSpy).not.toHaveBeenCalled();
                    done();
                });

                chrome.alarms.trigger('olx.notimer');
            });

            it('should emit an "olx.cycle-end" message on success', function (done) {
                chrome.runtime.addOnDone(function (messages) {
                    expect(messages).toEqual(['olx.cycle-end']);
                    done();
                });

                chrome.alarms.trigger();
            });

            it('should emit an "olx.cycle-failed" message on error', function (done) {
                getMessagesSpy = jasmine.createSpy().and.returnValue(false);

                chrome.runtime.addOnDone(function (messages) {
                    expect(messages).toEqual(['olx.cycle-failed']);
                    done();
                });

                chrome.alarms.trigger();
            });

            it('should not allow concurrent cycles to run in the same time', function (done) {
                chrome.runtime.addOnDone(function (messages) {
                    expect(messages).toEqual(['olx.cycle-in-progress', 'olx.cycle-end']);
                    done();
                });

                chrome.alarms.trigger();
                chrome.alarms.trigger();
            });

            it('should deflag concurrent cycle lock after a successful cycle', function (done) {
                chrome.runtime.addOnDone(function () {
                    chrome.runtime.addOnDone(function (messages) {
                        expect(messages).toEqual(['olx.cycle-end', 'olx.cycle-end']);
                        done();
                    });

                    chrome.alarms.trigger();
                });

                chrome.alarms.trigger();
            });

            it('should deflag concurrent cycle lock after a failed cycle', function (done) {
                getMessagesSpy = jasmine.createSpy().and.returnValue(false);

                chrome.runtime.addOnDone(function () {
                    chrome.runtime.addOnDone(function (messages) {
                        expect(messages).toEqual(['olx.cycle-failed', 'olx.cycle-failed']);
                        done();
                    });

                    chrome.alarms.trigger();
                });

                chrome.alarms.trigger();
            });

            it('should show a notification after a successful cycle', function (done) {
                chrome.runtime.addOnDone(function () {
                    expect(notificatorMock.notifySuccess).toHaveBeenCalled();
                    done();
                });

                chrome.alarms.trigger();
            });

            it('should show a notification after a failed cycle', function (done) {
                getMessagesSpy = jasmine.createSpy().and.returnValue(false);

                chrome.runtime.addOnDone(function () {
                    expect(notificatorMock.notifyError).toHaveBeenCalled();
                    done();
                });

                chrome.alarms.trigger();
            });

            it('should log a last success timestamp', function (done) {
                var spy = spyOn(settings, 'save').and.returnValue(Q.when());

                chrome.runtime.addOnDone(function () {
                    expect(spy).toHaveBeenCalled();
                    done();
                });

                chrome.alarms.trigger();
            });

            it('should start a new timer given a success', function (done) {
                var spy = spyOn(timerManager, 'setLater').and.callThrough();

                chrome.runtime.addOnDone(function () {
                    expect(spy).toHaveBeenCalled();
                    done();
                });

                chrome.alarms.trigger();
            });

            it('should start a new timer given a failure', function (done) {
                var spy = spyOn(timerManager, 'setLater').and.callThrough();

                getMessagesSpy = jasmine.createSpy().and.returnValue(false);

                chrome.runtime.addOnDone(function () {
                    expect(spy).toHaveBeenCalled();
                    done();
                });

                chrome.alarms.trigger();
            });
        });

        it('should copy logs on an olx.copy-logs message', function (done) {
            var spy = spyOn(document, 'execCommand');

            document.addEventListener('copy', spy);

            chrome.runtime.addOnDone(function () {
                expect(spy).toHaveBeenCalledWith('copy');
                done();
            });

            chrome.runtime.sendMessage('olx.copy-logs');
        });

        it('should send an olx.logs-copied message after copying logs', function (done) {
            chrome.runtime.addOnDone(function (messages) {
                expect(messages).toEqual(['olx.copy-logs', 'olx.logs-copied']);
                done();
            });

            chrome.runtime.sendMessage('olx.copy-logs');
        });

        it('should enable timer on olx.timer.start message', function (done) {
            chrome.runtime.addOnDone(function () {
                expect(createSpy).toHaveBeenCalled();
                done();
            });

            chrome.runtime.sendMessage('olx.timer.start');
        });

        it('should disable timer on olx.timer.stop message', function (done) {
            chrome.runtime.addOnDone(function () {
                expect(clearSpy).toHaveBeenCalled();
                done();
            });

            chrome.runtime.sendMessage('olx.timer.stop');
        });

        it('should send an olx.timer-updated message after starting timer', function (done) {
            chrome.runtime.addOnDone(function (messages) {
                expect(messages).toEqual(['olx.timer.start', 'olx.timer-updated']);
                done();
            });

            chrome.runtime.sendMessage('olx.timer.start');
        });

        it('should send an olx.timer-updated message after stopping timer', function (done) {
            chrome.runtime.addOnDone(function (messages) {
                expect(messages).toEqual(['olx.timer.stop', 'olx.timer-updated']);
                done();
            });

            chrome.runtime.sendMessage('olx.timer.stop');
        });
    });
}());