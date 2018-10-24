const passport = require('passport')
const strategies = require('../../config/passport-strategies')

// Include and set up configured strategies
Object.keys(strategies).forEach(key => {
  let Strategy = require(`passport-${key}`)
  // Some passport modules doesn't export the Strategy as default
  if (Strategy.Strategy) {
    Strategy = Strategy.Strategy
  }
  if (!strategies[key].callbackFn) {
    throw new Error('Provider callback not configured.')
  }
  passport.use(
    new Strategy(
      strategies[key].config,
      strategies[key].callbackFn
    )
  )
})

module.exports = passport
