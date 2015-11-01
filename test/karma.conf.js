/* global module */
module.exports = function (config) {
    'use strict';

    config.set({
        basePath: '.',
        frameworks: ['jasmine'],
        browsers: ['PhantomJS'],
        files: [
            '../node_modules/phantomjs-polyfill/bind-polyfill.js',
            '../src/lib/moment.min.js',
            '../src/lib/q.min.js',
            'mock/*-mock.js',
            '../src/*.js',
            '**/*-spec.js'
        ],
        reporters: ['spec']
    });
};