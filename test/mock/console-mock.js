(function () {
    'use strict';

    function noop() {}

    window.console = {
        log: noop,
        error: noop,
        warn: noop
    };
}());
