(function () {
    var labelFromEl,
        labelToEl,
        markAsReadEl,
        removeFromInboxEl,
        saveButtonEl,
        forceButtonEl,
        fromContainerEl,
        toContainerEl;

    function flash(className) {
        document.body.classList.add(className);

        setTimeout(function () {
            document.body.classList.remove(className);
        }, 500);
    }

    function loadOptions() {
        settings.load().then(function (settings) {
            if (settings.labelFrom) {
                api.getLabel(settings.labelFrom).then(function (label) {
                    labelFromEl.value = label;
                });
            }

            if (settings.labelTo) {
                api.getLabel(settings.labelTo).then(function (label) {
                    labelToEl.value = label;
                });
            }

            markAsReadEl.checked = settings.markAsRead;
            removeFromInboxEl.checked = settings.removeFromInbox;
        }).fail(function (e) {
                console.error('Failed to load settings', e);
            });
    }

    function save() {
        var setting = {};

        fromContainerEl.classList.remove('has-error');
        toContainerEl.classList.remove('has-error');

        setting[labelFromEl.name] = labelFromEl.value || null;
        setting[labelToEl.name] = labelToEl.value || null;
        setting[markAsReadEl.name] = markAsReadEl.checked;
        setting[removeFromInboxEl.name] = removeFromInboxEl.checked;

        settings.save(setting)
            .then(function () {
                flash('success');
            })
            .fail(function () {
                flash('error');
                fromContainerEl.classList.add('has-error');
                toContainerEl.classList.add('has-error');
            });
    }

    function sendEvent() {
        chrome.runtime.sendMessage('olx.run');
    }

    document.addEventListener('DOMContentLoaded', function () {
        fromContainerEl = document.querySelector('#from-container');
        toContainerEl = document.querySelector('#to-container');
        labelFromEl = document.querySelector('[name=labelFrom]');
        labelToEl = document.querySelector('[name=labelTo]');
        markAsReadEl = document.querySelector('[name=markAsRead]');
        removeFromInboxEl = document.querySelector('[name=removeFromInbox]');
        saveButtonEl = document.querySelector('[name=save]');
        forceButtonEl = document.querySelector('[name=force]');

        saveButtonEl.addEventListener('click', save);
        forceButtonEl.addEventListener('click', sendEvent);
    });

    window.onload = loadOptions;
}());
