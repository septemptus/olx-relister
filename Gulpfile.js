/* global require, process */
(function () {
   'use strict';

    var gulp = require('gulp'),
        replace = require('gulp-replace'),
        rename = require('gulp-rename'),
        clean = require('gulp-clean'),
        minifycss = require('gulp-minify-css'),
        uglify = require('gulp-uglify'),
        concat = require('gulp-concat'),
        htmlreplace = require('gulp-html-replace'),
        bump = require('gulp-bump'),
        jsonedit = require('gulp-json-editor'),
        jshint = require('gulp-jshint'),
        zip = require('gulp-zip'),
        git = require('gulp-git'),
        Server = require('karma').Server,
        version;

    function getBumpType() {
        var args = process.argv;

        if (args.indexOf('--minor') !== -1) {
            return 'minor';
        }

        if (args.indexOf('--major') !== -1) {
            return 'major';
        }

        return 'patch';
    }

    gulp.task('clean-build', ['lint', 'test'], function () {
        return gulp.src('build')
            .pipe(clean());
    });

    gulp.task('clean-rel', function () {
        return gulp.src('rel')
            .pipe(clean());
    });

    gulp.task('copy-lib', ['clean-build'], function () {
        return gulp.src('src/lib/*')
            .pipe(gulp.dest('build/lib'));
    });

    gulp.task('styles', ['clean-build'], function () {
        return gulp.src('src/popup/*.css')
            .pipe(minifycss())
            .pipe(rename({basename: 'styles', suffix: '.min'}))
            .pipe(gulp.dest('build/popup'));
    });

    gulp.task('minify', ['clean-build'], function () {
        return gulp.src(['src/*.js', '!src/popup.js'])
            .pipe(replace('113558311566-rcfi51rf2e1p5jbn6rcf5ur8m4bnft9m.apps.googleusercontent.com', '113558311566-o2ce28ic2rv5j5j2rvmmqebd6q7gq7cb.apps.googleusercontent.com'))
            .pipe(uglify())
            .pipe(concat('olx-relister.min.js'))
            .pipe(gulp.dest('build'));
    });

    gulp.task('minify-popup-script', ['clean-build'], function () {
        return gulp.src('src/popup/popup.js')
            .pipe(uglify())
            .pipe(gulp.dest('build/popup'));
    });

    gulp.task('modify-manifest', ['clean-build'], function () {
        return gulp.src('src/manifest.json')
            .pipe(jsonedit(function (json) {
                json.background.scripts = ["lib/moment.min.js", "lib/q.min.js", "lib/gapi.js", "olx-relister.min.js"];
                json.oauth2.client_id = '113558311566-o2ce28ic2rv5j5j2rvmmqebd6q7gq7cb.apps.googleusercontent.com';
                return json;
            }))
            .pipe(gulp.dest('build'));
    });

    gulp.task('copy-html', ['clean-build'], function () {
        return gulp.src('src/popup/*.html')
            .pipe(htmlreplace({js: ['../olx-relister.min.js', 'popup.js'], css: 'styles.min.css'}))
            .pipe(gulp.dest('build/popup'));
    });

    gulp.task('copy-images', ['clean-build'], function () {
        return gulp.src('src/img/*')
            .pipe(gulp.dest('build/img'));
    });

    gulp.task('copy-assets', ['copy-html', 'copy-images', 'clean-build']);

    gulp.task('build', ['copy-lib', 'copy-assets', 'modify-manifest', 'styles', 'minify', 'minify-popup-script']);

    gulp.task('build-release', ['clean-rel', 'build', 'bump-versions'], function () {
        return gulp.src('build/**')
            .pipe(zip('olx-relister.zip'))
            .pipe(gulp.dest('rel'));
    });

    gulp.task('release', ['build-release'], function () {
        return gulp.src('.')
            .pipe(git.add({args: '*'}))
            .pipe(git.commit('Release ' + version))
            .pipe(git.tag('v' + version, 'version bump'));
    });

    gulp.task('bump-package-ver', ['clean-rel', 'build'], function () {
        return gulp.src('./package.json')
            .pipe(bump({type: getBumpType()}))
            .pipe(jsonedit(function (json) {
                version = json.version;

                return json;
            }))
            .pipe(gulp.dest('.'));
    });

    gulp.task('bump-manifest-ver', ['clean-rel', 'build'], function () {
        return gulp.src('./src/manifest.json')
            .pipe(bump({type: getBumpType()}))
            .pipe(gulp.dest('src'));
    });

    gulp.task('bump-dist-manifest-ver', ['clean-rel', 'build'], function () {
        return gulp.src('build/manifest.json')
            .pipe(bump({type: getBumpType()}))
            .pipe(gulp.dest('build'));
    });

    gulp.task('bump-versions', ['build', 'bump-package-ver', 'bump-manifest-ver', 'bump-dist-manifest-ver']);

    gulp.task('test', function (done) {
        new Server({
            configFile: process.cwd() + '\\test\\karma.conf.js',
            singleRun: true
        }, done).start();
    });

    gulp.task('lint', function () {
        return gulp.src(['./src/*.js', './src/popup.js', './test/**/*.js'])
            .pipe(jshint())
            .pipe(jshint.reporter('jshint-stylish'))
            .pipe(jshint.reporter('fail'));
    });

    gulp.task('default', ['build']);

}());