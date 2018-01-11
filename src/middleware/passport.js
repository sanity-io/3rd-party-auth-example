const passport = require('passport')
const strategies = require('../../config/passport-strategies')

// Include and set up configured strategies
Object.keys(strategies).forEach(key => {
  const Strategy = require(`passport-${key}`)
  passport.use(
    new Strategy(strategies[key].config, (accessToken, refreshToken, profile, done) => {
      done(null, profile)
    })
  )
})

module.exports = passport