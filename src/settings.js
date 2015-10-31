/* global api, console, Q, chrome */
(function () {
    'use strict';

    var DEFAULTS = {
        labelFrom: null,
        labelTo: null,
        interval: 24 * 60 * 60 * 1000,
        markAsRead: false,
        removeFromInbox: false
    };

    function convertLabel(labelName) {
        return api.getLabels().then(function (response) {
            var label = response.result.labels.filter(function (label) {
                return label.name === labelName;
            });

            if (!label.length) {
                console.error('Label not found', labelName);
                throw 'Label not found';
            }

            return label[0].id;
        });
    }

    function save(setting) {
        var deferred = Q.defer(),
            labelConversions = [];

        if (setting.labelFrom) {
            console.log('Converting label', setting.labelFrom);
            labelConversions.push(convertLabel(setting.labelFrom).then(function (convertedLabel) {
                console.log('Converted', setting.labelFrom, 'to', convertedLabel);
                setting.labelFrom = convertedLabel;
            }));
        }

        if (setting.labelTo) {
            console.log('Converting label', setting.labelTo);
            labelConversions.push(convertLabel(setting.labelTo).then(function (convertedLabel) {
                console.log('Converted', setting.labelTo, 'to', convertedLabel);
                setting.labelTo = convertedLabel;
            }));
        }

        return Q.all(labelConversions).then(function () {
            console.log('Saving settings', setting);
            chrome.storage.sync.set(setting, deferred.resolve);

            return deferred.promise;
        }).then(function () {
                console.log('Settings saved');
            });
    }

    function load() {
        var deferred = Q.defer();

        console.log('Loading settings');

        chrome.storage.sync.get(DEFAULTS, deferred.resolve);

        return deferred.promise;
    }

    window.settings = {
        save: save,
        load: load
    };
}());