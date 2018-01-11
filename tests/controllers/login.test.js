/* eslint-disable max-nested-callbacks */
jest.mock('../../src/services/sanitySession')

const nock = require('nock')
const request = require('supertest')
const url = require('url')

const app = require('../../src/app.js')
const strategies = require('../../config/passport-strategies')
const config = require('../../config')
const fixtures = require('../fixtures')
const helpers = require('../helpers')
const sanitySession = require('../../src/services/sanitySession')

const baseUrl = config.baseUrl
const {findSessionState, clearSessionStorage} = helpers

const {
  accessToken,
  claimUrl,
  code,
  googleUser,
  origin,
  passportSessionCookieExpires,
  project,
  projectId,
  sessionLabel,
  sessionResponseProject
} = fixtures

sanitySession.create = jest.fn(() => {
  return Promise.resolve(claimUrl)
})

jest.mock(
  '../../config/passport-strategies.js',
  () => {
    const {mockPassportStrategies} = require('../fixtures')
    return mockPassportStrategies
  },
  { virtual: true }
)

const googleClientId = strategies['google-oauth20'].config.clientID
const googleClientSecret = strategies['google-oauth20'].config.clientSecret
const callbackUrlEncoded = encodeURIComponent(`${baseUrl}/${config.apiPath}/callback/google`)
const passportSessionKey = 'oauth2:accounts.google.com'


beforeAll(() => {
  nock.disableNetConnect()
  nock.enableNetConnect('127.0.0.1')
})

beforeEach(done => {
  clearSessionStorage().then(done)
})

afterEach(() => {
  nock.cleanAll()
})

afterAll(() => {
  nock.disableNetConnect()
  nock.restore()
})

describe('API', () => {

  const agent = request.agent(app(config))


  describe('/login', () => {

    it('should return a named error and destroy the passport session if no origin', () => {
      return agent
        .get(`${config.apiPath}/login/google`)
        .expect(res => {
          expect(res.headers['set-cookie']).toBeUndefined()
        })
        .expect('Content-Type', /json/)
        .expect(400, {
          error: 'Bad Request',
          statusCode: 400,
          message: "Param 'origin' (url) is required."
        })
    })

    it('should return a named error and destroy the passport session if invalid origin', () => {
      return agent
        .get(`${config.apiPath}/login/google?origin=foo`)
        .expect(res => {
          expect(res.headers['set-cookie']).toBeUndefined()
        })
        .expect('Content-Type', /json/)
        .expect(400, {
          statusCode: 400,
          error: 'Bad Request',
          message: "Invalid origin URL 'foo'. Make sure you include protocol, hostname and path."
        })
    })

    it('should return a 500 error, and and destroy the passport session if an unexpected error occurs', () => {
      // (in the test here it is unavailable because there are no nock requests registered for this test)
      let cookie
      let location
      return agent
        .get(`${config.apiPath}/login/google?origin=${encodeURIComponent(origin)}`)
        .then(res => {
          cookie = res.headers['set-cookie']
          location = url.parse(res.headers.location, true)
          return findSessionState(cookie, passportSessionKey).then(state => {
            expect(state).toEqual(location.query.state)
            expect(res.headers['set-cookie']).toBeDefined()
            return agent
              .get(`${config.apiPath}/callback/google?code=${code}&state=${state}`)
              .set('Cookie', cookie)
              .expect('Content-Type', /json/)
              .expect(500, {
                statusCode: 500,
                error: 'Internal Server Error',
                message: 'An internal server error occurred'
              })
              .then(finalRes => {
                expect(finalRes.headers['set-cookie']).toBeUndefined()
              })
          })
        })
    })

    it('should return a named error and destroy the passport session if the provider gives an *expected* error', () => {
      let cookie
      let location
      return agent
        .get(`${config.apiPath}/login/google?origin=${encodeURIComponent(origin)}`)
        .then(res => {
          cookie = res.headers['set-cookie']
          location = url.parse(res.headers.location, true)
          return findSessionState(cookie, passportSessionKey).then(state => {
            expect(state).toEqual(location.query.state)

            nock('https://www.googleapis.com:443', { encodedQueryParams: true })
              .post(
                '/oauth2/v4/token',
                'grant_type=authorization_code' +
                  `&redirect_uri=${callbackUrlEncoded}` +
                  `&client_id=${googleClientId}&client_secret=${googleClientSecret}` +
                  `&code=${code}`
              )
              .reply(
                401,
                '{"error":"bad_verification_code","error_description":"The code passed is incorrect or expired."}'
              )

            return agent
              .get(`${config.apiPath}/callback/google?code=${code}&state=${state}`)
              .set('Cookie', cookie)
              .expect('Content-Type', /json/)
              .expect(400, {
                statusCode: 400,
                error: 'Bad Request',
                message: 'The code passed is incorrect or expired.'
              })
              .expect(finalRes => {
                expect(finalRes.headers['set-cookie']).toBeUndefined()
              })
          })
        })
    })

    it('should create a Sanity session, destroy the Passport session, and redirect to origin', () => {
      let cookie
      let location
      return agent
        .get(`${config.apiPath}/login/google?origin=${encodeURIComponent(origin)}`)
        .then(res => {
          cookie = res.headers['set-cookie']
          location = url.parse(res.headers.location, true)
          return findSessionState(cookie, passportSessionKey).then(state => {
            expect(state).toEqual(location.query.state)
            expect(cookie[0]).toMatch(`Expires=${passportSessionCookieExpires.split(':')[0]}`)

            nock('https://www.googleapis.com:443', { encodedQueryParams: true })
              .post(
                '/oauth2/v4/token',
                'grant_type=authorization_code' +
                  `&redirect_uri=${callbackUrlEncoded}` +
                  `&client_id=${googleClientId}&client_secret=${googleClientSecret}` +
                  `&code=${code}`
              )
              .reply(200, {
                access_token: accessToken // eslint-disable-line camelcase
              })

            nock('https://www.googleapis.com:443')
              .get(`/plus/v1/people/me?access_token=${accessToken}`)
              .reply(200, JSON.stringify(googleUser))

            return agent
              .get(`${config.apiPath}/callback/google?code=${code}&state=${state}`)
              .set('Cookie', cookie)
              .expect(302, `Found. Redirecting to ${claimUrl}?origin=${encodeURIComponent(origin)}`)
              .then(finalRes => {
                expect(finalRes.headers['set-cookie']).toBeUndefined()
                expect(sanitySession.create).toHaveBeenLastCalledWith(
                  {
                    _json: expect.anything(),
                    _raw: JSON.stringify(googleUser),
                    displayName: googleUser.displayName,
                    emails: googleUser.emails,
                    gender: googleUser.gender,
                    id: googleUser.id,
                    name: googleUser.name,
                    photos: [
                      {
                        value: googleUser.image.url
                      }
                    ],
                    provider: 'google'
                  }
                )
              })
          })
        })
    })
  })

  describe('/callback', () => {

    it('should return a named error and destroy the passport session if invalid code and state', () => {
      return agent
        .get(`${config.apiPath}/callback/google?code=foo&state=bar`)
        .expect(res => {
          expect(res.headers['set-cookie']).toBeUndefined()
        })
        .expect('Content-Type', /json/)
        .expect(400, {
          statusCode: 400,
          error: 'Bad Request',
          message: 'Unable to verify authorization request state.'
        })
    })

    it('should return a named error and destroy the passport session if invalid code', () => {
      return agent
        .get(`${config.apiPath}/callback/google?code=foo`)
        .expect(res => {
          expect(res.headers['set-cookie']).toBeUndefined()
        })
        .expect('Content-Type', /json/)
        .expect(400, {
          statusCode: 400,
          error: 'Bad Request',
          message: 'Unable to verify authorization request state.'
        })
    })

  })

})