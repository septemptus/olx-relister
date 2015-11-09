(function () {
    'use strict';

    function noop() {}

    var timeout;

    window.chrome = {
        alarms: {
            create: noop,
            clear: function (name, callback) {
                callback();
            },
            onAlarm: {
                listener: null,
                timers: [],
                addListener: function (fn) {
                    this.listener = fn;
                },
                clearListeners: function () {
                    this.timers = [];
                }
            },
            trigger: function (timer) {
                this.onAlarm.timers.push(timer);
                this.onAlarm.listener({ name: timer || 'olx.timer' });

                clearTimeout(timeout);
                timeout = setTimeout(function () {
                    if (this.onDone){
                        this.onDone(this.onAlarm.timers);
                    }
                }.bind(this), 50);
            },
            addOnDone: function (cb) {
                this.onDone = function () {
                    this.onDone = null;
                    cb.apply(null, arguments);
                }.bind(this);
            }
        },
        notifications: {
            create: noop,
            clear: noop
        },
        runtime: {
            onMessage: {
                listener: null,
                messages: [],
                addListener: function (fn) {
                    this.listener = fn;
                },
                clearListeners: function () {
                    this.messages = [];
                }
            },
            sendMessage: function (msg) {
                this.onMessage.messages.push(msg);
                this.onMessage.listener(msg);

                clearTimeout(timeout);
                timeout = setTimeout(function () {
                    if (this.onDone){
                        this.onDone(this.onMessage.messages);
                    }
                }.bind(this), 50);
            },
            addOnDone: function (cb) {
                this.onDone = function () {
                    this.onDone = null;
                    cb.apply(null, arguments);
                }.bind(this);
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
