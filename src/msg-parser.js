/* global Q, console */
(function () {
    'use strict';

    var linkRegExp = /https:\/\/ssl.olx.pl\/oferta\/(?:przedluz|refreshall)[^"]+/;

    function getLinks(messages) {
        var deferred = Q.defer(),
            links = [];

        console.log('Procuring links');

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
            console.log('Links found:', links);
            deferred.resolve(links);
        } else {
            console.error('Some messages did not contain links');
            deferred.reject('Some messages did not contain links');
        }

        return deferred.promise;
    }

    window.msgParser = {
        getLinks: getLinks
    };
}());