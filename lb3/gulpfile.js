import gulp from 'gulp';
import pug from 'gulp-pug';
import gulpSass from 'gulp-sass';
import * as dartSass from 'sass';
import cleanCSS from 'gulp-clean-css';
import babel from 'gulp-babel';
import uglify from 'gulp-uglify';
import concat from 'gulp-concat';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const del = require('del');

const sass = gulpSass(dartSass);

const paths = {
    pug: 'views/**/*.pug',
    scss: 'public/styles/**/*.scss',
    js: 'public/js/**/*.js',
    assets: 'public/**/*',
    dest: 'build_gulp'
};

export function clean() {
    return del([paths.dest]);
}

export function html() {
    return gulp.src('views/*.pug')
        .pipe(pug({ pretty: true }))
        .pipe(gulp.dest(paths.dest));
}

export function styles() {
    return gulp.src(paths.scss)
        .pipe(sass().on('error', sass.logError))
        .pipe(cleanCSS())
        .pipe(concat('main.css'))
        .pipe(gulp.dest(paths.dest + '/css'));
}

export function scripts() {
    return gulp.src(paths.js)
        .pipe(babel({
            presets: ['@babel/preset-env']
        }))
        .pipe(concat('bundle.js'))
        .pipe(uglify())
        .pipe(gulp.dest(paths.dest + '/js'));
}

export function copyAssets() {
    return gulp.src(['public/img/**', 'public/*.html'], { base: '.' })
        .pipe(gulp.dest(paths.dest));
}

export const build = gulp.series(clean, gulp.parallel(html, styles, scripts, copyAssets));
export default build;
