/* global chrome */
(function () {
    'use strict';

    var DEFAULT_OPTIONS = {
            type: 'basic',
            iconUrl: 'img/ico120.png'
        },
        lastNID;

    function notify(options) {
        var mergedOptions = {
            type: DEFAULT_OPTIONS.type,
            iconUrl: DEFAULT_OPTIONS.iconUrl,
            message: options.message,
            title: options.title
        };

        chrome.notifications.create(null, mergedOptions, function (nid) {
            if (lastNID) {
                chrome.notifications.clear(lastNID);
            }

            lastNID = nid;
        });
}

    function notifySuccess() {
        notify({
            title: 'Ogłoszenia odświeżone',
            message: 'Wszystkie ogłoszenia zostały odświeżone'
        });
    }

    function notifyError(error) {
        notify({
            title: 'Wystąpił błąd',
            message: 'Wystąpił błąd przy odświeżaniu ogłoszeń' + (typeof error === 'string' ? ': ' + error : '')
        });
    }

    window.notificator = {
        notifySuccess: notifySuccess,
        notifyError: notifyError
    };
}());