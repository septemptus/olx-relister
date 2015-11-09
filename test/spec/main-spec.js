/* global chrome, Q, ApiWrapper, msgParser, requester, notificator, settings, timerManager */
(function () {
    'use strict';

    var realApiWrapper = ApiWrapper,
        realMsgParser = msgParser,
        realRequester = requester,
        realNotificator = notificator,
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
        getMessagesSpy,
        switchLabelsSpy,
        getLinksSpy,
        requestSpy;

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

        window.ApiWrapper = ApiWrapperMock;
        window.msgParser = msgParserMock;
        window.requester = requesterMock;
        window.notificator = notificatorMock;
    }

    function resetMocks() {
        window.ApiWrapper = realApiWrapper;
        window.msgParser = realMsgParser;
        window.requester = realRequester;
        window.notificator = realNotificator;
    }

    function resetSpies() {
        getLinksSpy.calls.reset();
        getMessagesSpy.calls.reset();
        switchLabelsSpy.calls.reset();
        requestSpy.calls.reset();
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
                chrome.runtime.onMessage.addListener(function () {
                    expect(getMessagesSpy).toHaveBeenCalled();
                    done();
                });
                chrome.runtime.sendMessage('olx.run');
            });

            it('should not start the cycle given a different message than "olx.run"', function () {
                expect(getMessagesSpy).not.toHaveBeenCalled();
                chrome.runtime.sendMessage('olx.runxx');
            });

            it('should emit an "olx.cycle-end" message on success', function (done) {
                chrome.runtime.sendMessage('olx.run');
                chrome.runtime.onMessage.addListener(function (message) {
                    expect(message).toBe('olx.cycle-end');
                    done();
                });
            });

            it('should emit an "olx.cycle-failed" message on error', function (done) {
                getMessagesSpy = jasmine.createSpy().and.returnValue(false);

                chrome.runtime.sendMessage('olx.run');
                chrome.runtime.onMessage.addListener(function (message) {
                    expect(message).toBe('olx.cycle-failed');
                    done();
                });
            });

            it('should not allow concurrent cycles to run in the same time', function (done) {
                var messages = [];

                chrome.runtime.sendMessage('olx.run');
                chrome.runtime.onMessage.addListener(function (message) {
                    messages.push(message);
                    if (messages.length === 3) {
                        expect(messages[0]).toBe('olx.cycle-in-progress');
                        done();
                    }
                });

                chrome.runtime.sendMessage('olx.run');
            });

            it('should deflag concurrent cycle lock after a successful cycle', function (done) {
                chrome.runtime.sendMessage('olx.run');

                chrome.runtime.onMessage.addListener(function (message) {
                    expect(message).toBe('olx.cycle-end');
                    chrome.runtime.onMessage.clearListeners();
                    chrome.runtime.sendMessage('olx.run');
                    chrome.runtime.onMessage.addListener(function (message) {
                        expect(message).toBe('olx.cycle-end');
                        done();
                    });
                });
            });

            it('should deflag concurrent cycle lock after a failed cycle', function (done) {
                getMessagesSpy = jasmine.createSpy().and.returnValue(false);

                chrome.runtime.sendMessage('olx.run');
                chrome.runtime.onMessage.addListener(function (message) {
                    expect(message).toBe('olx.cycle-failed');
                    chrome.runtime.onMessage.clearListeners();
                    chrome.runtime.sendMessage('olx.run');
                    chrome.runtime.onMessage.addListener(function (message) {
                        expect(message).toBe('olx.cycle-failed');
                        done();
                    });
                });
            });

            it('should show a notification after a successful cycle', function (done) {
                chrome.runtime.sendMessage('olx.run');
                chrome.runtime.onMessage.addListener(function () {
                    expect(notificatorMock.notifySuccess).toHaveBeenCalled();
                    done();
                });
            });

            it('should show a notification after a failed cycle', function (done) {
                getMessagesSpy = jasmine.createSpy().and.returnValue(false);

                chrome.runtime.sendMessage('olx.run');
                chrome.runtime.onMessage.addListener(function () {
                    expect(notificatorMock.notifyError).toHaveBeenCalled();
                    done();
                });
            });

            it('should log a last success timestamp', function (done) {
                var spy = spyOn(settings, 'save').and.returnValue(Q.when());

                chrome.runtime.sendMessage('olx.run');
                chrome.runtime.onMessage.addListener(function () {
                    expect(spy).toHaveBeenCalled();
                    done();
                });
            });

            it('should start a new timer given a success', function (done) {
                var spy = spyOn(timerManager, 'create');

                chrome.runtime.sendMessage('olx.run');
                chrome.runtime.onMessage.addListener(function () {
                    expect(spy).toHaveBeenCalled();
                    done();
                });
            });

            it('should start a new timer given a failure', function (done) {
                var spy = spyOn(timerManager, 'create');

                getMessagesSpy = jasmine.createSpy().and.returnValue(false);

                chrome.runtime.sendMessage('olx.run');
                chrome.runtime.onMessage.addListener(function () {
                    expect(spy).toHaveBeenCalled();
                    done();
                });
            });
        });

        describe('given we start the cycle using the timer', function () {
            it('should start the cycle on olx.timer timer message', function (done) {
                chrome.runtime.onMessage.addListener(function () {
                    expect(getMessagesSpy).toHaveBeenCalled();
                    done();
                });
                chrome.alarms.trigger();
            });

            it('should not start the cycle on a timer message other than olx.timer', function (done) {
                chrome.alarms.onAlarm.addListener(function () {
                    expect(getMessagesSpy).not.toHaveBeenCalled();
                    done();
                });
                chrome.alarms.trigger('olx.notimer');
            });

            it('should emit an "olx.cycle-end" message on success', function (done) {
                chrome.runtime.onMessage.addListener(function (message) {
                    expect(message).toBe('olx.cycle-end');
                    done();
                });
                chrome.alarms.trigger();
            });

            it('should emit an "olx.cycle-failed" message on error', function (done) {
                getMessagesSpy = jasmine.createSpy().and.returnValue(false);

                chrome.runtime.onMessage.addListener(function (message) {
                    expect(message).toBe('olx.cycle-failed');
                    done();
                });
                chrome.alarms.trigger();
            });

            it('should not allow concurrent cycles to run in the same time', function (done) {
                var messages = [];

                chrome.runtime.onMessage.addListener(function (message) {
                    messages.push(message);
                    if (messages.length === 2) {
                        expect(messages[0]).toBe('olx.cycle-in-progress');
                        done();
                    }
                });
                chrome.alarms.trigger();
                chrome.alarms.trigger();
            });

            it('should deflag concurrent cycle lock after a successful cycle', function (done) {
                chrome.runtime.onMessage.addListener(function (message) {
                    expect(message).toBe('olx.cycle-end');
                    chrome.runtime.onMessage.clearListeners();
                    chrome.alarms.trigger();
                    chrome.runtime.onMessage.addListener(function (message) {
                        expect(message).toBe('olx.cycle-end');
                        done();
                    });
                });

                chrome.alarms.trigger();
            });

            it('should deflag concurrent cycle lock after a failed cycle', function (done) {
                getMessagesSpy = jasmine.createSpy().and.returnValue(false);

                chrome.runtime.onMessage.addListener(function (message) {
                    expect(message).toBe('olx.cycle-failed');
                    chrome.runtime.onMessage.clearListeners();
                    chrome.runtime.onMessage.addListener(function (message) {
                        expect(message).toBe('olx.cycle-failed');
                        done();
                    });
                    chrome.alarms.trigger();
                });

                chrome.alarms.trigger();
            });

            it('should show a notification after a successful cycle', function (done) {
                chrome.runtime.onMessage.addListener(function () {
                    expect(notificatorMock.notifySuccess).toHaveBeenCalled();
                    done();
                });

                chrome.alarms.trigger();
            });

            it('should show a notification after a failed cycle', function (done) {
                getMessagesSpy = jasmine.createSpy().and.returnValue(false);

                chrome.runtime.onMessage.addListener(function () {
                    expect(notificatorMock.notifyError).toHaveBeenCalled();
                    done();
                });

                chrome.alarms.trigger();
            });

            it('should log a last success timestamp', function (done) {
                var spy = spyOn(settings, 'save').and.returnValue(Q.when());

                chrome.runtime.onMessage.addListener(function () {
                    expect(spy).toHaveBeenCalled();
                    done();
                });

                chrome.alarms.trigger();
            });

            it('should start a new timer given a success', function (done) {
                var spy = spyOn(timerManager, 'create');

                chrome.runtime.onMessage.addListener(function () {
                    expect(spy).toHaveBeenCalled();
                    done();
                });
                chrome.alarms.trigger();
            });

            it('should start a new timer given a failure', function (done) {
                var spy = spyOn(timerManager, 'create');

                getMessagesSpy = jasmine.createSpy().and.returnValue(false);

                chrome.runtime.onMessage.addListener(function () {
                    expect(spy).toHaveBeenCalled();
                    done();
                });
                chrome.alarms.trigger();
            });
        });

        it('should copy logs on an olx.copy-logs message', function () {
            var spy = spyOn(document, 'execCommand');

            document.addEventListener('copy', spy);

            chrome.runtime.sendMessage('olx.copy-logs');

            expect(spy).toHaveBeenCalledWith('copy');
        });

        it('should send an olx.logs-copied message after copying logs', function (done) {
            chrome.runtime.onMessage.addListener(function (msg) {
                expect(msg).toBe('olx.logs-copied');
                done();
            });

            chrome.runtime.sendMessage('olx.copy-logs');
        });

        it('should enable timer on olx.timer.start message', function (done) {
            var spy = spyOn(timerManager, 'create');

            chrome.runtime.onMessage.addListener(function () {
                expect(spy).toHaveBeenCalled();
                done();
            });

            chrome.runtime.sendMessage('olx.timer.start');
        });

        it('should disable timer on olx.timer.stop message', function (done) {
            var spy = spyOn(timerManager, 'clear');

            chrome.runtime.onMessage.addListener(function () {
                expect(spy).toHaveBeenCalled();
                done();
            });

            chrome.runtime.sendMessage('olx.timer.stop');
        });
    });
}());