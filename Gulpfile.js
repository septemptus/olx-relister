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

gulp.task('clean-dist', function () {
    return gulp.src('dist')
        .pipe(clean());
});

gulp.task('clean-rel', function () {
    return gulp.src('rel')
        .pipe(clean());
});

gulp.task('copy-lib', ['clean-dist'], function () {
    return gulp.src('lib/*')
        .pipe(gulp.dest('dist/lib'));
});

gulp.task('styles', ['clean-dist'], function () {
    return gulp.src('styles/*.css')
        .pipe(minifycss())
        .pipe(rename({basename: 'styles', suffix: '.min'}))
        .pipe(gulp.dest('dist'));
});

gulp.task('minify', ['clean-dist'], function () {
    return gulp.src(['./*.js', '!./Gulpfile.js', '!popup.js'])
        .pipe(uglify())
        .pipe(concat('olx-relister.js'))
        .pipe(gulp.dest('dist'));
});

gulp.task('minify-popup-script', ['clean-dist'], function () {
    return gulp.src('./popup.js')
        .pipe(uglify())
        .pipe(gulp.dest('dist'));
});

gulp.task('modify-manifest', ['clean-dist'], function () {
    return gulp.src('manifest.json')
        .pipe(jsonedit(function (json) {
            json.background.scripts = ["lib/moment.min.js", "lib/q.min.js", "lib/gapi.js", "olx-relister.js"];
            return json;
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('copy-html', ['clean-dist'], function () {
    return gulp.src('./*.html')
        .pipe(htmlreplace({js: ['olx-relister.js', 'popup.js'], css: 'styles.min.css'}))
        .pipe(gulp.dest('dist'));
});

gulp.task('copy-images', ['clean-dist'], function () {
    return gulp.src('img/*')
        .pipe(gulp.dest('dist/img'));
});

gulp.task('copy-assets', ['copy-html', 'copy-images', 'clean-dist']);

gulp.task('build', ['copy-lib', 'copy-assets', 'modify-manifest', 'styles', 'minify', 'minify-popup-script']);

gulp.task('release', ['clean-rel', 'build', 'bump-versions'], function () {
    return gulp.src('dist/*')
        .pipe(zip('olx-relister.zip'))
        .pipe(gulp.dest('rel'));
});

gulp.task('bump-package-ver', ['clean-rel', 'build'], function () {
    return gulp.src('./package.json')
        .pipe(bump({type: getBumpType()}))
        .pipe(gulp.dest('.'));
});

gulp.task('bump-manifest-ver', ['clean-rel', 'build'], function () {
    return gulp.src('./manifest.json')
        .pipe(bump({type: getBumpType()}))
        .pipe(gulp.dest('.'));
});

gulp.task('bump-dist-manifest-ver', ['clean-rel', 'build'], function () {
    return gulp.src('dist/manifest.json')
        .pipe(bump({type: getBumpType()}))
        .pipe(gulp.dest('dist'));
});

gulp.task('bump-versions', ['bump-package-ver', 'bump-manifest-ver', 'bump-dist-manifest-ver']);

gulp.task('default', ['build']);
