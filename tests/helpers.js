const supertest = require('supertest')
const session = require('../src/middleware/passportSession.js')

function findSessionByCookie(cookie) {
  const sid = findSid(cookie)
  return findSessionBySid(sid)
}

function findSessionBySid(sid) {
  return new Promise((resolve, reject) => {
    session.sessionStore.get(sid, (error, result) => {
      if (error) {
        reject(error)
      }
      resolve(result)
    })
  })
}

function findSid(cookie) {
  if (!cookie || !Array.isArray(cookie)) {
    return undefined
  }
  return /^[^=]+=s%3A([^;.]+)[.;]/.exec(cookie[0])[1]
}

function findSessionState(cookie, key) {
  return findSessionByCookie(cookie).then(result => {
    return result && result[key].state
  })
}

function createVhostTester(app, vhost) {
  const real = supertest(app)
  const proxy = {}

  Object.keys(real).forEach(methodName => {
    proxy[methodName] = function(...args) {
      return real[methodName](args).set('host', vhost)
    }
  })

  return proxy
}

function clearSessionStorage() {
  return new Promise((resolve, reject) => {
    if (!session.sessionStore.clear) {
      resolve()
      return
    }

    session.sessionStore.clear(err => {
      if (err) {
        reject(err)
      }
      resolve()
    })
  })
}

module.exports.findSessionState = findSessionState
module.exports.findSessionByCookie = findSessionByCookie
module.exports.findSessionBySid = findSessionBySid
module.exports.findSid = findSid
module.exports.createVhostTester = createVhostTester
module.exports.clearSessionStorage = clearSessionStorage
