const session = require('express-session')
const MemoryStore = require('memorystore')(session)

const config = require('../../config')
const redis = require('../services/redis')
const logger = require('../services/logger')
const log = logger({ logLevel: config.logLevel })

// Allows usage of redis in test environment
const useRedis = process.env.USE_REDIS // eslint-disable-line no-process-env

// Configure session storage
let sessionStore
if (config.isTest && !useRedis) {
  sessionStore = new MemoryStore({ checkPeriod: 86400000 })
} else {
  const RedisStore = require('connect-redis')(session)
  sessionStore = new RedisStore({
    client: redis(),
    logErrors: err => log.error(err),
    ttl: config.passportSession.maxAge / 1000
  })
}

// Configure session middleware
const passportSession = session({
  store: sessionStore,
  secret: config.passportSession.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: Boolean(config.baseUrl.match(/^https:\/\//)),
    maxAge: config.passportSession.maxAge
  }
})

passportSession.destroyPassportSessionBySid = sid => {
  return new Promise((resolve, reject) => {
    sessionStore.destroy(sid, (err, result) => {
      if (err) {
        return reject(err)
      }
      return resolve()
    })
  })
}

passportSession.destroyPassportSessionByReq = req => {
  if (req.session) {
    req.session.destroy()
  }
  req.session = null
}

passportSession.createPassportSession = (sid, data) => {
  return new Promise((resolve, reject) => {
    sessionStore.set(sid, data, err => {
      if (err) {
        return reject(err)
      }
      return resolve()
    })
  })
}

passportSession.getSessionBySid = sid =>
  new Promise((resolve, reject) => {
    sessionStore.get(sid, (err, sess) => {
      return err ? reject(err) : resolve(sess)
    })
  })

passportSession.sessionStore = sessionStore

module.exports = passportSession
