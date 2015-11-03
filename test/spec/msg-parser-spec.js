/* global msgParser */
(function () {
    'use strict';

    var VALID_REFRESH_LINK = 'https://ssl.olx.pl/oferta/przedluz/ccxnP/?action=extend&id=123456789&alog=1234%5AhDhdQas3Ewqe3veqweqxdw%7E%7d&utm_source=serviceletterAdRefresh&utm_medium=email&utm_campaign=link#xtor=EREC-52-[id1]-12345677-[link]-12345161@1-12312312312322',
        VALID_REFRESH_ALL_LINK = 'https://ssl.olx.pl/oferta/refreshall/?action=refreshall&alog=5ea1%3xc8JEasdC-nitsadEgMaR_f%7E%7E&utm_source=serviceletterRefreshYourAds&utm_medium=email&utm_campaign=refreshAllLink#xtor=EREC-61-[id1]-12345678-[refreshAllLink]-1231232@1-12312301012390';

    describe('msgParser', function () {
        describe('getLinks', function () {
            it('should fail if some of the provided messages do not contain links', function (done) {
                msgParser.getLinks([{msg: 'blabla'}, {msg: VALID_REFRESH_LINK}])
                    .fail(function (e) {
                        expect(e).toBe('Some messages did not contain links');
                        done();
                    });
            });

            it('should succeed if there are no parameters', function (done) {
                msgParser.getLinks()
                    .then(function (links) {
                        expect(links).toEqual([]);
                        done();
                    });
            });

            it('should succeed if there are no messages', function (done) {
                msgParser.getLinks([])
                    .then(function (links) {
                        expect(links).toEqual([]);
                        done();
                    });
            });

            it('should succeed if there are messages with refresh all links', function (done) {
                msgParser.getLinks([{msg: 'blabla"' + VALID_REFRESH_ALL_LINK + '"blabla'}])
                    .then(function (links) {
                        expect(links[0]).toBe(VALID_REFRESH_ALL_LINK);
                        done();
                    });
            });

            it('should succeed if there are messages with refresh links', function (done) {
                msgParser.getLinks([{msg: 'blabla"' + VALID_REFRESH_LINK + '"blabla'}])
                    .then(function (links) {
                        expect(links[0]).toBe(VALID_REFRESH_LINK);
                        done();
                    });
            });
        });
    });
}());