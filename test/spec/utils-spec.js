/* global utils */
(function () {
    'use strict';

    describe('utils', function () {
        describe('flash', function () {
            it('should set success class on body', function () {
                utils.flash();
                expect(document.body.classList.contains('success')).toBe(true);
            });

            it('should remove success class on body after a timeout', function (done) {
                utils.flash();
                setTimeout(function () {
                    expect(document.body.classList.contains('success')).toBe(false);
                    done();
                }, 1000);
            });

            it('should set error class on body if parameter is provided', function () {
                utils.flash(true);
                expect(document.body.classList.contains('error')).toBe(true);
            });

            it('should remove error class on body after a timeout', function (done) {
                utils.flash(true);
                setTimeout(function () {
                    expect(document.body.classList.contains('error')).toBe(false);
                    done();
                }, 1000);
            });
        });

        describe('createHour', function () {
            it('should format the hour object properly', function () {
                expect(utils.createHour({hour: 1, minute: 59})).toBe('01:59');
            });

            it('should return an empty string if no hour object is provided', function () {
                expect(utils.createHour()).toBe('');
            });
        });
    });
}());