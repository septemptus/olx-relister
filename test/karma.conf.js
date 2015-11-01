/* global module */
module.exports = function (config) {
    'use strict';

    config.set({
        basePath: '.',
        frameworks: ['jasmine'],
        browsers: ['PhantomJS'],
        files: [
            'mock/chrome-mock.js',
            '../src/lib/moment.min.js',
            '../src/lib/q.min.js',
            '../src/*.js',
            '**/*-spec.js'
        ],
        reporters: ['spec']
    });
};