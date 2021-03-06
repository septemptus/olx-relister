/* global Q, logStore */
(function () {
    'use strict';

    var linkRegExp = /https:\/\/ssl.olx.pl\/oferta\/(?:przedluz|refreshall)[^"]+/;

    function getLinks(messages) {
        var deferred = Q.defer(),
            links = [];

        logStore.log('Procuring links');

        if (!messages) {
            deferred.resolve([]);
            return deferred.promise;
        }

        messages.forEach(function (message) {
            var linkMatches = linkRegExp.exec(message.msg),
                link = linkMatches && linkMatches[0];

            if (link) {
                links.push(link);
            }
        });

        if (links.length === messages.length) {
            logStore.log('Links found:', links);
            deferred.resolve(links);
        } else {
            logStore.error('Some messages did not contain links');
            deferred.reject('Some messages did not contain links');
        }

        return deferred.promise;
    }

    window.msgParser = {
        getLinks: getLinks
    };
}());