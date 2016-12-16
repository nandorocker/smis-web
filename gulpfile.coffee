'use strict'
#
# G U L P  L O A D E R
# ====================
#
gulp = require('gulp')
gutil = require('gulp-util')  					# Gulp utilities
gulpIf = require('gulp-if')             # Run pipes conditionally
ghPages = require('gulp-gh-pages')      # Publish to Github Pages
changed = require('gulp-changed')       # Only process tasks on changed files
del = require('del')  						  	  # rm -rf
sourcemaps = require('gulp-sourcemaps') # sourcemaps for CSS
plumber = require('gulp-plumber')       # plumber for error handling
pug = require('pug')  						    	# Formerly known as JADE
gulpPug = require('gulp-pug')  					# Formerly known as JADE
filter = require('gulp-filter') 				# Filter for paths (using it to hide underscore folders)
sass = require('gulp-sass') 				  	# SASS
uglify = require('gulp-uglify') 				# For Javascript
imagemin = require('gulp-imagemin') 		# Image minify
notify = require('gulp-notify') 				# For pretty notifications
browserSync = require('browser-sync').create()
merge = require('merge-stream') 				# merge() command for tasks with multiple sources
cmq = require('gulp-group-css-media-queries') 	# Combines media queries
autoprefixer = require('gulp-autoprefixer')     # Autoprefixes CSS for compatibility
cleanCss = require('gulp-clean-css')    # minify CSS
htmlReplace =  require('gulp-html-replace')   # Replaces stuff on HTML
spawn = require('child_process').spawn  # for Gulp restart when gulpfile.js or config.js files are changed
exec = require('child_process').exec   #execute commands

# reload = ->
#   return browserSync.reload

#
# C O N F I G
# ===========
config =
  # environment variables
  #
  # production should be called like this:
  # $ gulp --type production
  type: gutil.env.type

  # default paths
  sourceDir: 'app'
  outputDir: '.tmp'

  # Plumber configurations for not crashing gulp on errors
  plumber: {
    # this prevents SASS errors from crashing
    errorHandler: (err) ->
      console.log(err)
      this.emit('end')
  }

# set output dir to 'dist' for production
if config.type
  config.outputDir = 'dist'

#
# G U L P  T A S K S
# ==================
#


# Task: Clean output dir
gulp.task 'clean', ->
  del([
    config.outputDir + '/**/*',
    '!dist/.git'
    '!dist/CNAME'
  ])


#
# Task: HTML
#
gulp.task 'html', ->
  # sets base directory according to state
  config.htmlReplaceSrc = '/'
  config.htmlReplaceTpl = '<base href="%s">'

  if config.type
    config.htmlReplaceSrc = '//nandorocker.github.io/smis-web/'

  config.htmlReplace = {
    base: {
      src: config.htmlReplaceSrc,
      tpl: config.htmlReplaceTpl
      }
  }

  gulp.src(config.sourceDir + '/**/*.pug')

  # Stop gulp from crashing on errors
  .pipe(plumber(config.plumber))

  # Filters out files and folders starting with underscore
  .pipe(filter((file) ->
    !/\/_/.test(file.path) and !/^_/.test(file.relative)
  ))

  .pipe(gulpPug(
    pug: pug
    basedir: config.sourceDir
    pretty: true))

  .pipe(htmlReplace(config.htmlReplace))

  .pipe(gulp.dest(config.outputDir))

  # Send out notification when done
  .pipe notify(message: 'HTML task complete')

#
# Task: Styles
#
gulp.task 'styles', ->
  # SASS configuration parameters
  outputStyle = 'map'

  # Compress stylesheets for production
  if config.type
    outputStyle = 'compressed'

  gulp.src(config.sourceDir + '/styles/**/*.{scss,sass}')

  # Stop gulp from crashing on errors
  .pipe(plumber(config.plumber))

  # Sourcemaps for CSS (step 1)
  .pipe(sourcemaps.init())

  .pipe(sass({

    # Include paths to components (add/remove manually)
    includePaths: [
      'bower_components/foundation-sites/scss'
      'bower_components/font-awesome/scss'
    ]

    outputStyle: outputStyle
  }))

  # Combines media queries
  .pipe(cmq())

  # Autoprefixer for browser support (production)
  .pipe(gulpIf(config.type, autoprefixer()))

  # Minify
  .pipe(gulpIf(config.type, cleanCss({
    browsers: ['last 2 versions', 'ie >= 9', 'and_chr >= 2.3']
  })))

  # Sourcemaps for CSS (step 2)
  .pipe(gulpIf(!config.type, sourcemaps.write()))

  .pipe(gulp.dest(config.outputDir + '/styles'))

  # Updates browsers
  .pipe(browserSync.stream())

  # Send out notification when done
  .pipe notify(message: 'Styles task complete')

#
# Task: Fonts
#
gulp.task 'fonts', ->
  gulp.src([
    config.sourceDir + '/fonts/**/*'
    'bower_components/monosocialiconsfont/**/MonoSocialIconsFont-1.10.*'
    # 'bower_components/slick-carousel/slick/fonts/slick.*'
    'bower_components/font-awesome/fonts/*.{eot,svg,ttf,woff,woff2,otf}'
  ])

  # Stop gulp from crashing on errors
  .pipe(plumber(config.plumber))
  .pipe(gulp.dest(config.outputDir + '/fonts'))

  # Send out notification when done
  .pipe notify(message: 'Fonts task complete')

#
# Task: scripts
#
gulp.task 'scripts', ->

  # Task 1: my scripts

  # Minify and copy all JavaScript (except vendor scripts)
  js = gulp.src(config.sourceDir + '/scripts/**/*.js')

  # Stop gulp from crashing on errors
  .pipe(plumber(config.plumber))

  # Uglify scripts (production)
  .pipe(gulpIf(config.type, uglify()))
  .pipe(gulp.dest(config.outputDir + '/scripts'))


  # Task 2: vendor scripts

  # Copy vendor files to output dir
  vendor = gulp.src([
    'bower_components/jquery/dist/jquery.min.*'
    'bower_components/slick-carousel/slick/slick.js'
  ])

  .pipe(gulp.dest(config.outputDir + '/scripts/vendor'))

  # Merge tasks and return stream
  merge js, vendor

#
# Task: Images
#
gulp.task 'images', ->
  gulp.src(config.sourceDir + '/**/*.{jpg,png,svg,ico,gif}')

  # Stop gulp from crashing on errors
  .pipe(plumber(config.plumber))

  # Checks output dir for changes
  .pipe(changed(config.outputDir))

  # Minify images (on production)
  .pipe(gulpIf(config.type, imagemin()))

  .pipe(gulp.dest(config.outputDir))

  # Send out notification when done
  .pipe notify(message: 'Images task complete')

#
# Copy Assets
#
gulp.task 'assets', ->
  gulp.src(config.sourceDir + '/assets/**/*.{pdf,zip}')

  # Stop gulp from crashing on errors
  .pipe(plumber(config.plumber))

  # Checks output dir for changes
  .pipe(changed(config.outputDir))

  .pipe(gulp.dest(config.outputDir + '/assets/'))

  # Send out notification when done
  .pipe notify(message: 'Assets task complete')

#
# Task: Deploy (to be used by deploy)
#
gulp.task 'deploy', (cb) ->

  exec('cd dist && git add . && git commit -m "Update ' + Date.now() + '" && git push origin gh-pages', (err, stdout, stderr) ->
    console.log(stdout)
    console.log(stderr)
    cb(err)
  )

#
# Watcher
# =======
# =====
#

gulp.task 'watch', ->

  gulp.watch config.sourceDir + '/**/*.pug', [ 'watch:pug' ]
  gulp.watch config.sourceDir + '/scripts/**/*.js', [ 'scripts' ]
  gulp.watch config.sourceDir + '/**/*.{jpg,png,svg,ico,gif}', [ 'images' ]
  gulp.watch config.sourceDir + '/styles/**/*.{scss,sass}', [
    'styles'
  ]
  gulp.watch config.sourceDir + '/fonts/**/*', [ 'fonts' ]
  gulp.watch config.sourceDir + '/assets/**/*.{pdf,zip}', ['assets']
  return

gulp.task 'watch:pug', [ 'html' ], (done) ->
  browserSync.reload()
  done()

#
# Deploy
# ======
#
gulp.task 'deploy', ->
  gulp.src(config.outputDir + '/**/*')
    .pipe(ghPages())

# Gulp restart when gulpfile.js or config.js files are changed
gulp.task 'watch:gulp', ->
  p = undefined
  gulp.watch [
    'gulpfile.coffee'
  ], ->
    if p
      p.kill()
    p = spawn('gulp', [ 'build' ], stdio: 'inherit')
    return
  return

# Development Server
gulp.task 'serve', [ 'build' ], (done) ->
  browserSync.init {
    open: false
    port: 9000
    server: config.outputDir
  }, done
  return

# Build
gulp.task 'build', [ 'clean' ], ->
  gulp.start [
    'html'
    'scripts'
    'images'
    'styles'
    'fonts'
    'assets'
  ]

# Default task
gulp.task 'default', [
  'serve'
  'watch'
  'watch:gulp'
]
