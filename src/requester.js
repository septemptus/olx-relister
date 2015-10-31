/* global console, Q */
(function () {
    "use strict";
    function request(urls) {
        var promises = [];

        console.log('Sending requests');

        urls.forEach(function (url) {
            var xhr = new XMLHttpRequest(),
                xhrDeferred = Q.defer();

            console.log('Sending request for', url);

            xhr.open('GET', url);
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    console.log('Request for', url, 'was successful');
                    xhrDeferred.resolve();
                } else if (xhr.readyState === 4 && xhr.status !== 200) {
                    console.log('Request for', url, 'failed');
                    xhrDeferred.reject();
                }
            };
            promises.push(xhrDeferred.promise);
            xhr.send();
        });

        return Q.all(promises);
    }

    window.requester = {
        request: request
    };
}());