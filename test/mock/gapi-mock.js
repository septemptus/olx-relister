/* global Q */
(function () {
    'use strict';

    function returnPromise() {
        return Q.when({
            result: {
                labels: [],
                messages: []
            }
        });
    }

    var gmail = {
        users: {
            messages: {
                list: returnPromise,
                get: returnPromise,
                modify: returnPromise
            },
            labels: {
                list: returnPromise
            }
        }
    };


    window.gapi = {
        reset: function () {
            this.client.gmail = null;
        },
        auth: {
            authorize: function (param, callback) {
                callback({});
            }
        },
        client: {
            load: function () {
                this.gmail = gmail;
                return returnPromise();
            },
            gmail: null
        }
    };
}());
