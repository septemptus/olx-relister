const CAPACITY = 500;
const TYPE = {
    log: 0,
    error: 1
};
const LOCAL_STORAGE_KEY = 'olx-relister-logs';

function joinArgs(...args) {
    return args.reduce((acc, param) => acc + ' ' + (typeof param === 'string' ? param : JSON.stringify(param)), '').trim();
}

function storeLog(args, type) {
    let logs = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));

    if (!logs) {
        logs = [];
    }

    if (logs.length === CAPACITY) {
        logs.shift();
    }

    logs.push({
        ts: Date.now(),
        type: type,
        msg: joinArgs(args)
    });

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(logs));
}

function log() {
    console.log.apply(console, arguments);
    storeLog(arguments, TYPE.log);
}

function error() {
    console.error.apply(console, arguments);
    storeLog(arguments, TYPE.error);
}

function get() {
    return localStorage.getItem(LOCAL_STORAGE_KEY);
}

export default {
    log: log,
    error: error,
    get: get
};