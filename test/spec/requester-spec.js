/* global requester */
(function () {
    'use strict';

    describe('requester', function () {
        beforeEach(function () {
            XMLHttpRequest.reset();
        });

        describe('request', function () {
            it('should succeed if there are no arguments passed', function (done) {
                requester.request().then(done);
            });

            it('should succeed if there are no links passed', function (done) {
                requester.request([]).then(done);
            });

            it('should succeed if all requests succeed', function (done) {
                requester.request(['success1', 'success2']).then(done);
            });

            it('should fail if at least one request fails', function (done) {
                XMLHttpRequest.failNextRequest();

                requester.request(['onefail1', 'onefail2']).fail(done);
            });

            it('should request sequentially', function (done) {
                XMLHttpRequest.enableDecreasedDelay();

                requester.request(['seq1', 'seq2', 'seq3', 'seq4'])
                    .then(function () {
                        expect(XMLHttpRequest.requestTrack).toEqual(XMLHttpRequest.responseTrack);
                        done();
                    });
            });
        });
    });
}());
