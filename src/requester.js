/* global logStore, Q */
(function () {
    "use strict";
    function request(urls) {
        logStore.log('Sending requests');

        function startNextRequest(urls) {
            var xhr = new XMLHttpRequest(),
                xhrDeferred = Q.defer(),
                url = urls[0];

            if (!url) {
                xhrDeferred.resolve();
                return xhrDeferred.promise;
            }

            logStore.log('Sending request for', url);

            xhr.open('GET', url);
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    logStore.log('Request for', url, 'was successful');
                    xhrDeferred.resolve();
                } else if (xhr.readyState === 4 && xhr.status !== 200) {
                    logStore.log('Request for', url, 'failed');
                    xhrDeferred.reject();
                }
            };
            xhr.send();

            return xhrDeferred.promise.then(startNextRequest.bind(null, urls.slice(1)));
        }

        if (urls && urls.length) {
            return startNextRequest(urls);
        }

        logStore.log('No requests sent');
        return Q.when();
    }

    window.requester = {
        request: request
    };
}());