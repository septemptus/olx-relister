import logStore from './log-store';
import Q from 'q';

function request(urls) {
    logStore.log('Sending requests');

    function startNextRequest(url, ...restOfUrls) {
        let xhr = new XMLHttpRequest();
        let xhrDeferred = Q.defer();

        if (!url) {
            xhrDeferred.resolve();
            return xhrDeferred.promise;
        }

        logStore.log('Sending request for', url);

        xhr.open('GET', url);
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4 && xhr.status === 200) {
                logStore.log('Request for', url, 'was successful');
                xhrDeferred.resolve();
            } else if (xhr.readyState === 4 && xhr.status !== 200) {
                logStore.log('Request for', url, 'failed');
                xhrDeferred.reject();
            }
        };
        xhr.send();

        return xhrDeferred.promise.then(startNextRequest.bind(null, restOfUrls));
    }

    if (urls && urls.length) {
        return startNextRequest(urls);
    }

    logStore.log('No requests sent');
    return Q.when();
}

export default {
    request: request
};