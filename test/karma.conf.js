/* global module */
module.exports = function (config) {
    'use strict';

    config.set({
        basePath: '.',
        frameworks: ['jasmine'],
        browsers: ['PhantomJS'],
        files: [
            '../src/lib/moment.min.js',
            '../src/lib/q.min.js',
            'mock/*-mock.js',
            '../src/!(main).js',
            '../src/main.js',
            '**/*-spec.js'
        ],
        reporters: ['spec']
    });
};