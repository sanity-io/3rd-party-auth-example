const Boom = require('boom')
const passport = require('../middleware/passport')
const strategies = require('../../config/passport-strategies')


// Redirects to a provider from /login/:providerName and stores origin in the session

module.exports = (req, res, next) => {

  const providerName = req.params.providerName
  const strategyName = Object.keys(strategies).find(key => strategies[key].name === providerName)
  const provider = strategyName ? strategies[strategyName] : null

  if (!provider) {
    return next(Boom.notFound('No such provider'))
  }

  // Regenerate any current session first
  req.session.regenerate(err => {
    if (err) {
      return next(err)
    }

    // Store the origin only if supplied
    if (req.query.origin) {
      req.session.origin = `${req.query.origin}`
    }

    // Configure provider scope if need be
    let scope = {}
    if (provider.config.scope) {
      scope = {scope: provider.config.scope}
    }

    // We deal with all the sessions stuff on our own,
    // so always turn off built in session management by passport
    const options = Object.assign(scope, provider.options, {session: false})

    return passport.authenticate(provider.name, options)(req, res, next)
  })
}
