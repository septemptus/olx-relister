/* global chrome, Q, ApiWrapper, msgParser, requester, notificator, settings */
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

    describe('main', function () {
        beforeEach(setMocks);
        beforeEach(resetSpies);
        afterEach(resetMocks);

        it('should start the cycle on "olx.run" message', function (done) {
            chrome.runtime.sendMessage('olx.run');
            chrome.runtime.onMessage.addListener(function () {
                expect(getMessagesSpy).toHaveBeenCalled();
                chrome.runtime.onMessage.removeLastListener();
                done();
            });
        });

        it('should not start the cycle given a different message than "olx.run"', function () {
            chrome.runtime.sendMessage('olx.runxx');
            expect(getMessagesSpy).not.toHaveBeenCalled();
        });

        it('should emit an "olx.cycle-end" message on success', function (done) {
            chrome.runtime.sendMessage('olx.run');
            chrome.runtime.onMessage.addListener(function (message) {
                expect(message).toBe('olx.cycle-end');
                chrome.runtime.onMessage.removeLastListener();
                done();
            });
        });

        it('should emit an "olx.cycle-failed" message on error', function (done) {
            getMessagesSpy = jasmine.createSpy().and.returnValue(false);

            chrome.runtime.sendMessage('olx.run');
            chrome.runtime.onMessage.addListener(function (message) {
                expect(message).toBe('olx.cycle-failed');
                chrome.runtime.onMessage.removeLastListener();
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
                    chrome.runtime.onMessage.removeLastListener();
                    done();
                }
            });
            chrome.runtime.sendMessage('olx.run');
        });

        it('should deflag concurrent cycle lock after a successful cycle', function (done) {
            chrome.runtime.sendMessage('olx.run');
            chrome.runtime.onMessage.addListener(function (message) {
                expect(message).toBe('olx.cycle-end');
                chrome.runtime.onMessage.removeLastListener();
                chrome.runtime.sendMessage('olx.run');
                chrome.runtime.onMessage.addListener(function (message) {
                    expect(message).toBe('olx.cycle-end');
                    chrome.runtime.onMessage.removeLastListener();
                    done();
                });
            });
        });

        it('should deflag concurrent cycle lock after a failed cycle', function (done) {
            getMessagesSpy = jasmine.createSpy().and.returnValue(false);

            chrome.runtime.sendMessage('olx.run');
            chrome.runtime.onMessage.addListener(function (message) {
                expect(message).toBe('olx.cycle-failed');
                chrome.runtime.onMessage.removeLastListener();
                chrome.runtime.sendMessage('olx.run');
                chrome.runtime.onMessage.addListener(function (message) {
                    expect(message).toBe('olx.cycle-failed');
                    chrome.runtime.onMessage.removeLastListener();
                    done();
                });
            });
        });

        it('should show a notification after a successful cycle', function (done) {
            chrome.runtime.sendMessage('olx.run');

            chrome.runtime.onMessage.addListener(function () {
                expect(notificatorMock.notifySuccess).toHaveBeenCalled();
                chrome.runtime.onMessage.removeLastListener();
                done();
            });
        });

        it('should show a notification after a failed cycle', function (done) {
            getMessagesSpy = jasmine.createSpy().and.returnValue(false);

            chrome.runtime.sendMessage('olx.run');

            chrome.runtime.onMessage.addListener(function () {
                expect(notificatorMock.notifyError).toHaveBeenCalled();
                chrome.runtime.onMessage.removeLastListener();
                done();
            });
        });

        it('should log a last success timestamp', function (done) {
            var spy = spyOn(settings, 'save').and.returnValue(Q.when());

            chrome.runtime.sendMessage('olx.run');

            chrome.runtime.onMessage.addListener(function () {
                expect(spy).toHaveBeenCalled();
                chrome.runtime.onMessage.removeLastListener();
                done();
            });
        });
    });
}());