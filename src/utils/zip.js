import { createRequire } from 'module'

import gulp from 'gulp'
import zip from 'gulp-zip'

const require = createRequire(import.meta.url)
const messages = require('../../build/_locales/en/messages.json')
const manifest = require('../../build/manifest.json')

gulp
  .src('build/**')
  .pipe(zip(`${messages.appName.message.replaceAll(' ', '-')}-${manifest.version}.zip`))
  .pipe(gulp.dest('package'))
