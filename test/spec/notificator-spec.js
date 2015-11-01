/* global notificator, chrome */
(function () {
    'use strict';

    describe('notificator', function () {
        var createSpy,
            clearSpy;

        beforeEach(function () {
            createSpy = spyOn(chrome.notifications, 'create').and.callFake(function (id, params, callback) {
                if (callback) {
                    callback('someId');
                }
            });
            clearSpy = spyOn(chrome.notifications, 'clear');
        });

        it('should display a notification when notifySuccess() is called', function () {
            notificator.notifySuccess();
            expect(createSpy).toHaveBeenCalled();
        });

        it('should display a notification when notifyError() is called', function () {
            notificator.notifyError();
            expect(createSpy).toHaveBeenCalled();
        });

        it('should display a title when notifySuccess() is called', function () {
            var notificationParams;

            notificator.notifySuccess();
            notificationParams = createSpy.calls.first().args[1];

            expect(notificationParams.title).toBe('Ogłoszenia odświeżone');
        });

        it('should display a title when notifyError() is called', function () {
            var notificationParams;

            notificator.notifyError();
            notificationParams = createSpy.calls.first().args[1];

            expect(notificationParams.title).toBe('Wystąpił błąd');
        });

        it('should display a message when notifySuccess() is called', function () {
            var notificationParams;

            notificator.notifySuccess();
            notificationParams = createSpy.calls.first().args[1];

            expect(notificationParams.message).toBe('Wszystkie ogłoszenia zostały odświeżone');
        });

        it('should display a message when notifyError() is called', function () {
            var notificationParams;

            notificator.notifyError();
            notificationParams = createSpy.calls.first().args[1];

            expect(notificationParams.message).toBe('Wystąpił błąd przy odświeżaniu ogłoszeń');
        });

        it('should display an extended message if an error is specified when notifyError() is called', function () {
            var notificationParams;

            notificator.notifyError('error message');
            notificationParams = createSpy.calls.first().args[1];

            expect(notificationParams.message).toBe('Wystąpił błąd przy odświeżaniu ogłoszeń: error message');
        });

        it('should clear a previous notification if notifySuccess() is called', function () {
            notificator.notifySuccess();
            clearSpy.calls.reset();
            notificator.notifySuccess();
            expect(clearSpy).toHaveBeenCalled();
        });

        it('should clear a previous notification if notifyError() is called', function () {
            notificator.notifyError();
            clearSpy.calls.reset();
            notificator.notifySuccess();
            expect(clearSpy).toHaveBeenCalled();
        });
    });
}());