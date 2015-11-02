(function () {
    'use strict';

    function XMLHttpRequestMock() {}

    XMLHttpRequestMock.prototype.send = function () {
        if (this.onreadystatechange) {
            this.readyState = 4;
            this.status = 200;

            if (XMLHttpRequestMock.failCounter) {
                this.status = 500;
                XMLHttpRequestMock.failCounter -= 1;
            }

            if (XMLHttpRequestMock.decreasedDelay) {
                XMLHttpRequestMock.delay -= 100;
            }

            XMLHttpRequestMock.requestTrack.push(this.url);
            setTimeout(function () {
                this.onreadystatechange();
                if (XMLHttpRequestMock.requestTrack.indexOf(this.url) !== -1) {
                    XMLHttpRequestMock.responseTrack.push(this.url);
                }
            }.bind(this), XMLHttpRequestMock.delay);
        }
    };

    XMLHttpRequestMock.prototype.open = function (type, url) {
        this.url = url;
    };

    XMLHttpRequestMock.failNextRequest = function (n) {
        this.failCounter = n ? n : 1;
    };

    XMLHttpRequestMock.reset = function () {
        this.failCounter = 0;
        this.requestTrack = [];
        this.responseTrack = [];
        this.delay = 1000;
        this.decreasedDelay = false;
    };

    XMLHttpRequestMock.enableDecreasedDelay = function () {
        this.decreasedDelay = true;
    };

    XMLHttpRequestMock.failCounter = 0;
    XMLHttpRequestMock.requestTrack = [];
    XMLHttpRequestMock.responseTrack = [];
    XMLHttpRequestMock.delay = 1000;
    XMLHttpRequestMock.decreasedDelay = false;

    window.XMLHttpRequest = XMLHttpRequestMock;
}());
