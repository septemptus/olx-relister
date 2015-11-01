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
                addListener: noop
            },
            sendMessage: noop
        },
        storage: {
            sync: {
                set: noop,
                get: noop
            }
        }
    };
}());
