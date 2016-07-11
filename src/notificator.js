import chrome from 'chrome';

const DEFAULT_OPTIONS = {
        type: 'basic',
        iconUrl: 'img/ico120.png'
    };
let lastNID;

function notify(options) {
    let mergedOptions = {
        type: DEFAULT_OPTIONS.type,
        iconUrl: DEFAULT_OPTIONS.iconUrl,
        message: options.message,
        title: options.title
    };

    chrome.notifications.create(null, mergedOptions, (nid) => {
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

export default {
    notifySuccess: notifySuccess,
    notifyError: notifyError
};