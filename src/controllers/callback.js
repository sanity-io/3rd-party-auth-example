const Boom = require('boom')
const addQueryToUrl = require('../util/addQueryToUrl')
const config = require('../../config')
const sanitySession = require('../services/sanitySession')
const logger = require('../services/logger')
const log = logger({logLevel: config.logLevel})
const passport = require('../middleware/passport')
const {destroyPassportSessionByReq} = require('../middleware/passportSession')

// Errors from passport that should not be reported to exception handling etc.
const EXPECTED_AUTH_ERRORS = ['bad_verification_code']

// Under some circumstances, a user is not returned from the provider, and no errors are thrown
function noUserResponse(req, res, next, info, origin) {
  const message =
    info && info.message ? info.message : 'Unable to process login request (no user returned)'

  log.debug(message)

  next(Boom.badRequest(message))
}


module.exports = (req, res, next) => {
  const providerName = req.params.providerName
  const {origin} = req.session
  passport.authenticate(providerName, (err, passportUser, info) => {

    if (err || !passportUser) {
      destroyPassportSessionByReq(req)
    }

    if (err) {
      if (!EXPECTED_AUTH_ERRORS.includes(err.code)) {
        return next(err)
      }
      next(Boom.badRequest(err.message))
    }

    // An authenticated user was for some reason not returned from the provider but no error was thrown
    if (!passportUser) {
      return noUserResponse(req, res, next, info, origin)
    }

    return sanitySession.create(passportUser)
      .then(claimUrl => {
        log.info(`Sucessfully created Sanity identity for ${passportUser.displayName || passportUser.username}`)
        const origin = req.session.origin
        destroyPassportSessionByReq(req) // Wipe the passport session here
        const redirectUrl = addQueryToUrl({origin: origin}, claimUrl)
        log.info(`Redirecting to: ${redirectUrl}`)
        res.redirect(redirectUrl)
      })
      .catch(error => {
        destroyPassportSessionByReq(req) // Wipe the passport session here
        return next(error)
      })
  })(req, res, next)
}
