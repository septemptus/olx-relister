/* global logStore, console */
(function () {
    'use strict';

    describe('logStore', function () {
        beforeEach(function () {
            localStorage.setItem('olx-relister-logs', '[]');
        });

        describe('log', function () {
            it('should log a log in the console', function () {
                var spy = spyOn(console, 'log');

                logStore.log('msg');

                expect(spy).toHaveBeenCalled();
            });

            it('should persist the log in local storage', function () {
                logStore.log('msg');

                expect(JSON.parse(localStorage.getItem('olx-relister-logs')).length).toBe(1);
            });

            it('should contain a timestamp', function () {
                logStore.log('msg');

                expect(JSON.parse(localStorage.getItem('olx-relister-logs'))[0].ts).toBeGreaterThan(0);
            });

            it('should toss the oldest record if reached capacity', function () {
                var secondRecord;

                for (var i = 0; i < 200; i += 1) {
                    logStore.log(i);
                }

                secondRecord = JSON.parse(localStorage.getItem('olx-relister-logs'))[1];
                logStore.log('overflow');
                expect(JSON.parse(localStorage.getItem('olx-relister-logs'))[0]).toEqual(secondRecord);
            });

            it('should concat arguments', function () {
                logStore.log('x', 'y');
                expect(JSON.parse(localStorage.getItem('olx-relister-logs'))[0].msg).toBe('x y');
            });

            it('should concat object arguments', function () {
                logStore.log('x', {y: 3});
                expect(JSON.parse(localStorage.getItem('olx-relister-logs'))[0].msg).toBe('x {"y":3}');
            });
        });

        describe('error', function () {
            it('should log a log in the console', function () {
                var spy = spyOn(console, 'error');

                logStore.error('msg');

                expect(spy).toHaveBeenCalled();
            });

            it('should persist the log in local storage', function () {
                logStore.error('msg');

                expect(JSON.parse(localStorage.getItem('olx-relister-logs')).length).toBe(1);
            });

            it('should contain a timestamp', function () {
                logStore.error('msg');

                expect(JSON.parse(localStorage.getItem('olx-relister-logs'))[0].ts).toBeGreaterThan(0);
            });

            it('should toss the oldest record if reached capacity', function () {
                var secondRecord;

                for (var i = 0; i < 200; i += 1) {
                    logStore.error(i);
                }

                secondRecord = JSON.parse(localStorage.getItem('olx-relister-logs'))[1];
                logStore.error('overflow');
                expect(JSON.parse(localStorage.getItem('olx-relister-logs'))[0]).toEqual(secondRecord);
            });

            it('should concat arguments', function () {
                logStore.error('x', 'y');
                expect(JSON.parse(localStorage.getItem('olx-relister-logs'))[0].msg).toBe('x y');
            });

            it('should concat object arguments', function () {
                logStore.error('x', {y: 3});
                expect(JSON.parse(localStorage.getItem('olx-relister-logs'))[0].msg).toBe('x {"y":3}');
            });
        });

        describe('get', function () {
            beforeEach(function () {
                for (var i = 0; i < 250; i += 1) {
                    logStore.error(i);
                }
            });

            it('should return last 200 records in JSON format', function () {
                expect(logStore.get()).toEqual(localStorage.getItem('olx-relister-logs'));
                expect(JSON.parse(logStore.get()).length).toBe(200);
            });
        });
    });
}());
