const url = require('url')
const config = require('../config')

const accessToken = 'fa28649688a71e445b2ed0898e6559abfc1c5054'
const code = '9013d99ac10988ea568b'
const projectId = 'abtjub23'
const origin = 'https://sanity.io/just?for=test'

mockPassportStrategies = {
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
    },
    callbackFn: (accessToken, refreshToken, profile, done) => {
      done(null, profile)
    }
  }
}

const passportGoogleUser = {
  id: '100114701088670492342423',
  displayName: 'Test',
  emails: [
    {
      value: 'test@gmail.com',
      type: 'account'
    }
  ],
  photos: [
    {
      value:
        'https://lh3.googleusercontent.com/-KdpciKxr4wk/AAAAAAAAAAI/AAAAAAAACv8/0zQf2IB6B24/photo.jpg?sz=50'
    }
  ],
  provider: 'google'
}

const googleUser = {
  kind: 'plus#person',
  etag: '"Sh4n9u6EtD24TM0RmWv7jTXojqc/38ACUi9sngkIZNJS7gFJO-H04pg"',
  occupation: 'Web development',
  gender: 'male',
  emails: [{ value: 'test@gmail.com', type: 'account' }],
  objectType: 'person',
  id: '100114701088670492342423',
  displayName: 'Test Person',
  name: { familyName: 'Person', givenName: 'Test' },
  url: 'https://plus.google.com/+TestPerson',
  image: {
    url:
      'https://lh3.googleusercontent.com/-KdpciKxr4wk/AAAAAAAAAAI/AAAAAAAACv8/0zQf2IB6B24/photo.jpg?sz=50',
    isDefault: false
  },
  organizations: [
    {
      name: 'TestCorp',
      title: 'Developer',
      type: 'work',
      startDate: '2007',
      primary: true
    }
  ],
  placesLived: [{ value: 'Testland', primary: true }, { value: 'United stats of Test' }],
  isPlusUser: true,
  language: 'en',
  circledByCount: 115,
  verified: false
}

const passportSessionCookieExpires = new Date(
  Date.now() + config.passportSession.maxAge
).toGMTString()

const claimUrl = `https://${projectId}.api.sanity.io/v1/auth/thirdParty/session/claim/`
  + '454eaa24c4f8b9e26fe64b52145638c8b1f18856adb9fea5de5cf38bf250611687ff5da0c54d346ba00a8d382a01a68796f2f2887e52cb4213e99bffd051a717'

const userId = 'e-49bf06169f42167ec6578e8407626fa84ca6a79c53424aaaa545e83bd422dffa'

const sessionPostBody = {
  userId: userId,
  userFullName: 'Test Person',
  userEmail: 'test@gmail.com',
  userImage: 'https://lh3.googleusercontent.com/-KdpciKxr4wk/AAAAAAAAAAI/AAAAAAAACv8/0zQf2IB6B24/photo.jpg?sz=50',
  userRole: 'admin',
  sessionExpires: null
}

module.exports.accessToken = accessToken
module.exports.claimUrl = claimUrl
module.exports.code = code
module.exports.googleUser = googleUser
module.exports.origin = origin
module.exports.passportGoogleUser = passportGoogleUser
module.exports.passportSessionCookieExpires = passportSessionCookieExpires
module.exports.mockPassportStrategies = mockPassportStrategies
module.exports.projectId = projectId
module.exports.userId = userId
module.exports.sessionPostBody = sessionPostBody
