const Boom = require('boom')
const bodyParser = require('body-parser')
const express = require('express')

const errorHandler = require('./middleware/errorHandler')
const passport = require('./middleware/passport')
const passportSession = require('./middleware/passportSession')

module.exports = config => {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', true)
  app.use(bodyParser.json())

  // Use own session middleware for passport
  app.use(passportSession)

  // Passport middleware
  app.use(passport.initialize())

  // API routes
  app.use(config.apiPath || '/', require('./controllers'))

  // 404 handler
  app.use('/', (req, res, next) => next(Boom.notFound()))

  app.use(errorHandler)

  return app
}
