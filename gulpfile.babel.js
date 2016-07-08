import gulp from 'gulp';
import replace from 'gulp-replace';
import rename from 'gulp-rename';
import clean from 'gulp-clean';
import minifycss from 'gulp-minify-css';
import uglify from 'gulp-uglify';
import concat from 'gulp-concat';
import htmlreplace from 'gulp-html-replace';
import bump from 'gulp-bump';
import jsonedit from 'gulp-json-editor';
import jshint from 'gulp-jshint';
import zip from 'gulp-zip';
import git from 'gulp-git';
import {Server} from 'karma';

let version;

function getBumpType() {
    let args = process.argv;

    if (args.includes('--minor')) {
        return 'minor';
    }

    if (args.includes('--major')) {
        return 'major';
    }

    return 'patch';
}

gulp.task('clean-build', ['lint', 'test'], () => {
    return gulp.src('build')
        .pipe(clean());
});

gulp.task('clean-rel', () => {
    return gulp.src('rel')
        .pipe(clean());
});

gulp.task('copy-lib', ['clean-build'], () => {
    return gulp.src('src/lib/*')
        .pipe(gulp.dest('build/lib'));
});

gulp.task('styles', ['clean-build'], () => {
    return gulp.src('src/popup/*.css')
        .pipe(minifycss())
        .pipe(rename({basename: 'styles', suffix: '.min'}))
        .pipe(gulp.dest('build/popup'));
});

gulp.task('minify', ['clean-build'], () => {
    return gulp.src(['src/*.js', '!src/popup.js'])
        .pipe(replace('113558311566-rcfi51rf2e1p5jbn6rcf5ur8m4bnft9m.apps.googleusercontent.com', '113558311566-o2ce28ic2rv5j5j2rvmmqebd6q7gq7cb.apps.googleusercontent.com'))
        .pipe(uglify())
        .pipe(concat('olx-relister.min.js'))
        .pipe(gulp.dest('build'));
});

gulp.task('minify-popup-script', ['clean-build'], () => {
    return gulp.src('src/popup/popup.js')
        .pipe(uglify())
        .pipe(gulp.dest('build/popup'));
});

gulp.task('modify-manifest', ['clean-build'], () => {
    return gulp.src('src/manifest.json')
        .pipe(jsonedit((json) => {
            json.background.scripts = ["lib/moment.min.js", "lib/q.min.js", "lib/gapi.js", "olx-relister.min.js"];
            json.oauth2.client_id = '113558311566-o2ce28ic2rv5j5j2rvmmqebd6q7gq7cb.apps.googleusercontent.com';
            return json;
        }))
        .pipe(gulp.dest('build'));
});

gulp.task('copy-html', ['clean-build'], () => {
    return gulp.src('src/popup/*.html')
        .pipe(htmlreplace({js: ['../olx-relister.min.js', 'popup.js'], css: 'styles.min.css'}))
        .pipe(gulp.dest('build/popup'));
});

gulp.task('copy-images', ['clean-build'], () => {
    return gulp.src('src/img/*')
        .pipe(gulp.dest('build/img'));
});

gulp.task('copy-assets', ['copy-html', 'copy-images', 'clean-build']);

gulp.task('build', ['test-postbuild']);

gulp.task('build-release', ['clean-rel', 'build', 'bump-versions'], () => {
    return gulp.src('build/**')
        .pipe(zip('olx-relister.zip'))
        .pipe(gulp.dest('rel'));
});

gulp.task('release', ['build-release'], () => {
    return gulp.src('.')
        .pipe(git.add({args: '*'}))
        .pipe(git.commit('Release ' + version))
        .pipe(git.tag('v' + version, 'version bump'));
});

gulp.task('bump-package-ver', ['clean-rel', 'build'], () => {
    return gulp.src('./package.json')
        .pipe(bump({type: getBumpType()}))
        .pipe(jsonedit((json) => {
            version = json.version;
            return json;
        }))
        .pipe(gulp.dest('.'));
});

gulp.task('bump-manifest-ver', ['clean-rel', 'build'], () => {
    return gulp.src('./src/manifest.json')
        .pipe(bump({type: getBumpType()}))
        .pipe(gulp.dest('src'));
});

gulp.task('bump-dist-manifest-ver', ['clean-rel', 'build'], () => {
    return gulp.src('build/manifest.json')
        .pipe(bump({type: getBumpType()}))
        .pipe(gulp.dest('build'));
});

gulp.task('bump-versions', ['build', 'bump-package-ver', 'bump-manifest-ver', 'bump-dist-manifest-ver']);

gulp.task('test', (done) => {
    if (process.argv.includes('--force')) {
        done();
        return;
    }

    new Server({
        configFile: process.cwd() + '\\test\\karma.conf.js',
        singleRun: true
    }, done).start();
});

gulp.task('test-postbuild', ['copy-lib', 'copy-assets', 'modify-manifest', 'styles', 'minify', 'minify-popup-script'], (done) => {
    if (process.argv.includes('--force')) {
        done();
        return;
    }

    new Server({
        configFile: process.cwd() + '\\test\\karma.postbuild.conf.js',
        singleRun: true
    }, done).start();
});

gulp.task('lint', () => {
    if (process.argv.includes('--force')) {
        return;
    }

    return gulp.src(['./src/*.js', './src/popup.js', './test/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'));
});

gulp.task('default', ['build']);