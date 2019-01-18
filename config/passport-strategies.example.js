// Example for passport-strategies.js

const config = require('./index')

module.exports = {
  // Example Google strategy
  // This is using the Passport Strategy npm module: passport-google-oauth20
  'google-oauth20': {
    name: 'google', // Should match what the strategy identifies with for the passport.authenticate function
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
    },
    // Stratgies have different signatures for their callbacks
    // Most oauth2 strategies already returns the finished profile object,
    // so the callback is rather simple:
    callbackFn: (accessToken, refreshToken, profile, done) => {
      done(null, profile)
    }
  },
  // Example SAML strategy configured against okta.com
  // This is using the Passport Strategy npm module:: passport-saml
  'saml': {
    name: 'saml', // Should match what the strategy identifies with for the passport.authenticate function
    title: 'Okta',
    config: {
      path: `${config.baseUrl}/${config.apiPath}/callback/saml`,
      entryPoint: 'https://sanity.okta.com/app/xxx/yyy/sso/saml',
      issuer: 'http://www.okta.com/yyy',
      // Put the cert file from Okla inside this folder
      cert: fs.readFileSync('./config/okta.cert', 'utf-8')
    },
    callbackFn: (samlResponse, done) => {
      // The Okta response only contains the user ID (samlResponse.nameID)
      // If we need more info like name and image, we need to get
      // that info from somewhere else, and merge it into the returned profile here.
      // For the example's sake we just use the username (email) as displayName in
      // the returned profile
      const profile = {
        provider: 'saml',
        displayName: samlResponse.nameID,
        emails: [
          {value: samlResponse.nameID}
        ]
      }
      done(null, profile)
    }
  }
}
