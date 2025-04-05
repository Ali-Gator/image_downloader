import gulp from 'gulp'
import zip from 'gulp-zip'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const manifest = require('../build/manifest.json')
const messages = require('../build/_locales/en/messages.json')

gulp
  .src('build/**')
  .pipe(zip(`${messages.appName.message.replaceAll(' ', '-')}-${manifest.version}.zip`))
  .pipe(gulp.dest('package'))
