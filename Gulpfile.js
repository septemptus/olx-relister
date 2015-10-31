var gulp = require('gulp'),
    rename = require('gulp-rename'),
    clean = require('gulp-clean'),
    minifycss = require('gulp-minify-css'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    htmlreplace = require('gulp-html-replace'),
    bump = require('gulp-bump'),
    jsonedit = require('gulp-json-editor'),
    zip = require('gulp-zip');

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

gulp.task('clean-build', function () {
    return gulp.src('build')
        .pipe(clean());
});

gulp.task('clean-rel', function () {
    return gulp.src('rel')
        .pipe(clean());
});

gulp.task('copy-lib', ['clean-build'], function () {
    return gulp.src('src/lib/*')
        .pipe(gulp.dest('build/lib'))
});

gulp.task('styles', ['clean-build'], function () {
    return gulp.src('src/styles/*.css')
        .pipe(minifycss())
        .pipe(rename({basename: 'styles', suffix: '.min'}))
        .pipe(gulp.dest('build'));
});

gulp.task('minify', ['clean-build'], function () {
    return gulp.src(['src/*.js', '!src/popup.js'])
        .pipe(uglify())
        .pipe(concat('olx-relister.min.js'))
        .pipe(gulp.dest('build'));
});

gulp.task('minify-popup-script', ['clean-build'], function () {
    return gulp.src('src/popup.js')
        .pipe(uglify())
        .pipe(gulp.dest('build'));
});

gulp.task('modify-manifest', ['clean-build'], function () {
    return gulp.src('src/manifest.json')
        .pipe(jsonedit(function (json) {
            json.background.scripts = ["lib/moment.min.js", "lib/q.min.js", "lib/gapi.js", "olx-relister.min.js"];
            return json;
        }))
        .pipe(gulp.dest('build'));
});

gulp.task('copy-html', ['clean-build'], function () {
    return gulp.src('src/*.html')
        .pipe(htmlreplace({js: ['olx-relister.min.js', 'popup.js'], css: 'styles.min.css'}))
        .pipe(gulp.dest('build'));
});

gulp.task('copy-images', ['clean-build'], function () {
    return gulp.src('src/img/*')
        .pipe(gulp.dest('build/img'));
});

gulp.task('copy-assets', ['copy-html', 'copy-images', 'clean-build']);

gulp.task('build', ['copy-lib', 'copy-assets', 'modify-manifest', 'styles', 'minify', 'minify-popup-script']);

gulp.task('release', ['clean-rel', 'build', 'bump-versions'], function () {
    return gulp.src('build/**')
        .pipe(zip('olx-relister.zip'))
        .pipe(gulp.dest('rel'));
});

gulp.task('bump-package-ver', ['clean-rel', 'build'], function () {
    return gulp.src('./package.json')
        .pipe(bump({type: getBumpType()}))
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

gulp.task('default', ['build']);
