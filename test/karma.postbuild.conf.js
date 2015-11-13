/* global module */
module.exports = function (config) {
    'use strict';

    config.set({
        basePath: '.',
        frameworks: ['jasmine'],
        browsers: ['PhantomJS'],
        files: [
            '../node_modules/phantomjs-polyfill/bind-polyfill.js',
            '../build/lib/moment.min.js',
            '../build/lib/q.min.js',
            'mock/*-mock.js',
            '../build/olx-relister.min.js',
            '**/*-spec.js'
        ],
        reporters: ['spec']
    });
};