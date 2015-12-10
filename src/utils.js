/* global moment, constants */
(function () {
    'use strict';

    var classes = constants.classes,
        formats = constants.formats;

    function flash(isError) {
        var className = isError ? classes.ERROR : classes.SUCCESS;

        document.body.classList.add(className);

        setTimeout(function () {
            document.body.classList.remove(className);
        }, 500);
    }

    function createHour(hour) {
        if (!hour) {
            return '';
        }

        return moment().hour(hour.hour).minute(hour.minute).format(formats.HOUR_FORMAT);
    }

    window.utils = {
        createHour: createHour,
        flash: flash
    };
}());