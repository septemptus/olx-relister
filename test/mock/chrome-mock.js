(function () {
    'use strict';

    function noop() {}

    window.chrome = {
        alarms: {
            create: noop,
            onAlarm: {
                listeners: [],
                addListener: function (fn) {
                    this.listeners.push(fn);
                },
                clearListeners: function () {
                    if (this.listeners.length > 1) {
                        this.listeners.splice(1);
                    }
                }
            },
            trigger: function (msgName) {
                this.onAlarm.listeners.forEach(function (listener) {
                    listener({ name: msgName || 'olx.timer' });
                });
            }
        },
        notifications: {
            create: noop,
            clear: noop
        },
        runtime: {
            onMessage: {
                listeners: [],
                addListener: function (fn) {
                    this.listeners.push(fn);
                },
                clearListeners: function () {
                    if (this.listeners.length > 1) {
                        this.listeners.splice(1);
                    }
                }
            },
            sendMessage: function (msg) {
                this.onMessage.listeners.forEach(function (listener) {
                    listener(msg);
                });
            }
        },
        storage: {
            sync: {
                set: noop,
                get: noop
            }
        }
    };
}());
