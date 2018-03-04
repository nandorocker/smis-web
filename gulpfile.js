/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
'use strict';
//
// G U L P  L O A D E R
// ====================
//
const gulp = require('gulp');
const gutil = require('gulp-util');  					// Gulp utilities
const gulpIf = require('gulp-if');             // Run pipes conditionally
const ghPages = require('gulp-gh-pages');      // Publish to Github Pages
const changed = require('gulp-changed');       // Only process tasks on changed files
const del = require('del');  						  	  // rm -rf
const sourcemaps = require('gulp-sourcemaps'); // sourcemaps for CSS
const plumber = require('gulp-plumber');       // plumber for error handling
const pug = require('pug');  						    	// Formerly known as JADE
const gulpPug = require('gulp-pug');  					// Formerly known as JADE
const filter = require('gulp-filter'); 				// Filter for paths (using it to hide underscore folders)
const sass = require('gulp-sass'); 				  	// SASS
const uglify = require('gulp-uglify'); 				// For Javascript
const imagemin = require('gulp-imagemin'); 		// Image minify
const notify = require('gulp-notify'); 				// For pretty notifications
const browserSync = require('browser-sync').create();
const merge = require('merge-stream'); 				// merge() command for tasks with multiple sources
const cmq = require('gulp-group-css-media-queries'); 	// Combines media queries
const autoprefixer = require('gulp-autoprefixer');     // Autoprefixes CSS for compatibility
const cleanCss = require('gulp-clean-css');    // minify CSS
const htmlReplace =  require('gulp-html-replace');   // Replaces stuff on HTML
const { spawn } = require('child_process');  // for Gulp restart when gulpfile.js or config.js files are changed
const { exec } = require('child_process');   //execute commands

// reload = ->
//   return browserSync.reload

//
// C O N F I G
// ===========
const config = {
  // environment variables
  //
  // production should be called like this:
  // $ gulp --type production
  type: gutil.env.type,

  // default paths
  sourceDir: 'app',
  outputDir: '.tmp',

  // Plumber configurations for not crashing gulp on errors
  plumber: {
    // this prevents SASS errors from crashing
    errorHandler(err) {
      console.log(err);
      return this.emit('end');
    }
  }
};

// set output dir to 'dist' for production
if (config.type) {
  config.outputDir = 'dist';
}

//
// G U L P  T A S K S
// ==================
//


// Task: Clean output dir
gulp.task('clean', () =>
  del([
    config.outputDir + '/**/*',
    // '!dist/.git'
    '!dist/CNAME'
  ])
);


//
// Task: HTML
//
gulp.task('html', function() {
  // sets base directory according to state
  config.htmlReplaceSrc = '/';
  config.htmlReplaceTpl = '<base href="%s">';

  if (config.type) {
    // Use this when publishing to GitHub
    // config.htmlReplaceSrc = '//nandorocker.github.io/smis-web/'
    // Use this publishing to rajewska.com
    config.htmlReplaceSrc = '//rajewska.com/';
  }

  config.htmlReplace = {
    base: {
      src: config.htmlReplaceSrc,
      tpl: config.htmlReplaceTpl
      }
  };

  return gulp.src(config.sourceDir + '/**/*.pug')

  // Stop gulp from crashing on errors
  .pipe(plumber(config.plumber))

  // Filters out files and folders starting with underscore
  .pipe(filter(file => !/\/_/.test(file.path) && !/^_/.test(file.relative)))

  .pipe(gulpPug({
    pug,
    basedir: config.sourceDir,
    pretty: true}))

  .pipe(htmlReplace(config.htmlReplace))

  .pipe(gulp.dest(config.outputDir))

  // Send out notification when done
  .pipe(notify({message: 'HTML task complete'}));
});

//
// Task: Styles
//
gulp.task('styles', function() {
  // SASS configuration parameters
  let outputStyle = 'map';

  // Compress stylesheets for production
  if (config.type) {
    outputStyle = 'compressed';
  }

  return gulp.src(config.sourceDir + '/styles/**/*.{scss,sass}')

  // Stop gulp from crashing on errors
  .pipe(plumber(config.plumber))

  // Sourcemaps for CSS (step 1)
  .pipe(sourcemaps.init())

  .pipe(sass({

    // Include paths to components (add/remove manually)
    includePaths: [
      'node_modules/foundation-sites/scss',
      'node_modules/font-awesome/scss',
      'node_modules/slick-carousel/slick'
    ],

    outputStyle
  }))

  // Combines media queries
  .pipe(cmq())

  // Autoprefixer for browser support (production)
  .pipe(gulpIf(config.type, autoprefixer()))

  // Minify
  .pipe(gulpIf(config.type, cleanCss({
    browsers: ['last 2 versions', 'ie >= 9', 'and_chr >= 2.3']
  })))

  // Sourcemaps for CSS (step 2)
  .pipe(gulpIf(!config.type, sourcemaps.write()))

  .pipe(gulp.dest(config.outputDir + '/styles'))

  // Updates browsers
  .pipe(browserSync.stream())

  // Send out notification when done
  .pipe(notify({message: 'Styles task complete'}));
});

//
// Task: Fonts
//
gulp.task('fonts', () =>
  gulp.src([
    config.sourceDir + '/fonts/**/*',
    'node_modules/monosocialiconsfont/**/MonoSocialIconsFont-1.10.*',
    'node_modules/font-awesome/fonts/*.{eot,svg,ttf,woff,woff2,otf}'
  ])

  // Stop gulp from crashing on errors
  .pipe(plumber(config.plumber))
  .pipe(gulp.dest(config.outputDir + '/fonts'))

  // Send out notification when done
  .pipe(notify({message: 'Fonts task complete'}))
);

//
// Task: scripts
//
gulp.task('scripts', function() {

  // Task 1: my scripts

  // Minify and copy all JavaScript (except vendor scripts)
  const js = gulp.src(config.sourceDir + '/scripts/**/*.js')

  // Stop gulp from crashing on errors
  .pipe(plumber(config.plumber))

  // Uglify scripts (production)
  .pipe(gulpIf(config.type, uglify()))
  .pipe(gulp.dest(config.outputDir + '/scripts'));


  // Task 2: vendor scripts

  // Copy vendor files to output dir
  const vendor = gulp.src([
    'node_modules/jquery/dist/jquery.min.*',
    'node_modules/slick-carousel/slick/slick.js'
  ])

  .pipe(gulp.dest(config.outputDir + '/scripts/vendor'));

  // Merge tasks and return stream
  return merge(js, vendor);
});

//
// Task: Images
//
gulp.task('images', () =>
  gulp.src(config.sourceDir + '/**/*.{jpg,png,svg,ico,gif}')

  // Stop gulp from crashing on errors
  .pipe(plumber(config.plumber))

  // Checks output dir for changes
  .pipe(changed(config.outputDir))

  // Minify images (on production)
  .pipe(gulpIf(config.type, imagemin()))

  .pipe(gulp.dest(config.outputDir))

  // Send out notification when done
  .pipe(notify({message: 'Images task complete'}))
);

//
// Copy Assets
// ===========
//
gulp.task('assets', () =>
  gulp.src(config.sourceDir + '/assets/**/*.{pdf,zip}')

  // Stop gulp from crashing on errors
  .pipe(plumber(config.plumber))

  // Checks output dir for changes
  .pipe(changed(config.outputDir))

  .pipe(gulp.dest(config.outputDir + '/assets/'))

  // Send out notification when done
  .pipe(notify({message: 'Assets task complete'}))
);

// 
// Copy Favicons
// =============
// 
gulp.task('favicons', () =>
  gulp.src(config.sourceDir + '/assets/favicons/**/*')
  .pipe(gulp.dest(config.outputDir))
);

//
// Copy CNAME
// ===========
//
gulp.task('cname', () =>
  gulp.src(config.sourceDir + '/CNAME')

  // Stop gulp from crashing on errors
  .pipe(plumber(config.plumber))

  // Checks output dir for changes
  .pipe(changed(config.outputDir))

  .pipe(gulp.dest(config.outputDir))
);

//
// Watcher
// =======
//

gulp.task('watch', function() {

  gulp.watch(config.sourceDir + '/**/*.pug', [ 'watch:pug' ]);
  gulp.watch(config.sourceDir + '/scripts/**/*.js', [ 'scripts' ]);
  gulp.watch(config.sourceDir + '/**/*.{jpg,png,svg,ico,gif}', [ 'images' ]);
  gulp.watch(config.sourceDir + '/styles/**/*.{scss,sass}', [
    'styles'
  ]);
  gulp.watch(config.sourceDir + '/fonts/**/*', [ 'fonts' ]);
  gulp.watch(config.sourceDir + '/assets/**/*.{pdf,zip}', ['assets']);
});

gulp.task('watch:pug', [ 'html' ], function(done) {
  browserSync.reload();
  return done();
});

//
// Deploy
// ======
//
gulp.task('deploy', () =>
  gulp.src(config.outputDir + '/**/*')
    .pipe(ghPages())
);

// Gulp restart when gulpfile.js or config.js files are changed
gulp.task('watch:gulp', function() {
  let p = undefined;
  gulp.watch([
    'gulpfile.coffee'
  ], function() {
    if (p) {
      p.kill();
    }
    p = spawn('gulp', [ 'build' ], {stdio: 'inherit'});
  });
});

// Development Server
gulp.task('serve', [ 'build' ], function(done) {
  browserSync.init({
    open: true,
    port: 9000,
    ghostMode: false,
    server: config.outputDir
  }, done);
});

// Build
gulp.task('build', [ 'clean' ], () =>
  gulp.start([
    'html',
    'scripts',
    'images',
    'styles',
    'fonts',
    'assets',
    'favicons',
    'cname'
  ])
);

// Default task
gulp.task('default', [
  'serve',
  'watch',
  'watch:gulp'
]);
