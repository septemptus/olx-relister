(function () {
    'use strict';

    function noop() {}

    window.chrome = {
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
                removeLastListener: function () {
                    this.listeners.pop();
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
