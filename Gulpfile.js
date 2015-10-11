var gulp = global.gulp = require('gulp'),
	plugins = global.plugins = require("gulp-load-plugins")( { scope: ['devDependencies'] } );;

gulp.task('eslint', function() {
	return gulp.src( './lib/**/*.js' )
		.pipe( global.plugins.eslint() )
		.pipe( global.plugins.eslint.format() )
		.pipe( global.plugins.eslint.failOnError() );
});

gulp.task( 'mocha', function(callback) {
	return gulp.src( './test/mochaTest.js' ).pipe( global.plugins.mocha({reporter: 'nyan'}) );
} );

gulp.task( 'default', [ 'eslint', 'mocha' ] );
