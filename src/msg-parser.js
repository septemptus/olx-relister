import logStore from './log-store';

const LINK_REG_EXP = /https:\/\/ssl.olx.pl\/oferta\/(?:przedluz|refreshall)[^"]+/;

function getLinks(messages) {
    let deferred = Q.defer();
    let links = [];

    logStore.log('Procuring links');

    if (!messages) {
        deferred.resolve([]);
        return deferred.promise;
    }

    messages.forEach((message) => {
        let linkMatches = LINK_REG_EXP.exec(message.msg);
        let link = linkMatches && linkMatches[0];

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

export default {
    getLinks: getLinks
};