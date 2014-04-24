'use strict';
var gulp    = require('gulp'),
    jshint  = require('gulp-jshint'),
    mocha   = require('gulp-mocha');

var files = [
  '*.js',
  'test/**/*.js'
];
var testFiles = 'test/**/*.js';

gulp.task('test', function () {
  gulp
    .src(testFiles)
    .pipe(mocha({ reporter: 'spec' }));
});

gulp.task('lint', function() {
  gulp
    .src(files)
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('watch', function () {
  gulp.watch(files, function() {
    gulp.run('lint', 'test');
  });
});

gulp.task('default', ['lint', 'test', 'watch']);
