const Boom = require('boom')
const config = require('../../config')
const logger = require('../services/logger')

module.exports = (err, req, res, next) => {
  const error = errorResponse(res, err)
  const log = logger({ logLevel: config.logLevel })

  const code = (error.output && error.output.statusCode) || error.code
  if (!code || code >= 500 || config.logLevel === 'debug') {
    log.error(error)
    // Send to exception notifiers here!
  }
}

function errorResponse(res, err) {
  let error = err

  if (!err.isBoom) {
    error = Boom.wrap(err)
  }

  const code = Number(err.code || (error.output && error.output.statusCode))
  const statusCode = isNaN(code) ? 500 : code
  res.status(statusCode).json(error.output.payload)

  return error
}
