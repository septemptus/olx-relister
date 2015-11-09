/* global console */
(function () {
    'use strict';

    var CAPACITY = 500,
        TYPE = {
            log: 0,
            error: 1
        },
        localStorageKey = 'olx-relister-logs';

    function joinArgs(args) {
        var params = [].slice.apply(args);

        return params.reduce(function (acc, param) {
            return acc + ' ' + (typeof param === 'string' ? param : JSON.stringify(param));
        }, '').trim();
    }

    function storeLog(args, type) {
        var logs = JSON.parse(localStorage.getItem(localStorageKey));

        if (!logs) {
            logs = [];
        }

        if (logs.length === CAPACITY) {
            logs.shift();
        }

        logs.push({
            ts: Date.now(),
            type: type,
            msg: joinArgs(args)
        });

        localStorage.setItem(localStorageKey, JSON.stringify(logs));
    }

    function log() {
        console.log.apply(console, arguments);
        storeLog(arguments, TYPE.log);
    }

    function error() {
        console.error.apply(console, arguments);
        storeLog(arguments, TYPE.error);
    }

    function get() {
        return localStorage.getItem(localStorageKey);
    }

    window.logStore = {
        log: log,
        error: error,
        get: get
    };
}());