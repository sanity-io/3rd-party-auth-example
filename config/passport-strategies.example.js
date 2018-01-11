// Example for passport-strategies.js

const config = require('./index')

module.exports = {
  'google-oauth20': {
    name: 'google',
    title: 'Google',
    config: {
      clientID: "xxx-yyy.apps.googleusercontent.com",
      clientSecret: "zzzxxx",
      callbackURL: `${config.baseUrl}/${config.apiPath}/callback/google`,
      state: true,
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ]
    }
  }
}
