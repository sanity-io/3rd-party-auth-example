const logger = require('./logger')
const config = require('../../config')
const Redis = config.isTest ? require('ioredis-mock') : require('ioredis')

const connections = {
  commands: null,
  listener: null
}

const redisService = (type = 'commands') => {
  if (connections[type]) {
    return connections[type]
  }

  const log = logger({logLevel: config.logLevel})
  const redis = new Redis(config.redis)

  // Keep track of connect/reconnect to prevent flooding logs with errors if disconnected
  let connected = false
  let shuttingDown = false
  let attemptNumber = 1

  redis.on('ready', () => {
    if (connected) {
      return
    }

    log.info('[Redis] Connected after %d attempt(s)', attemptNumber)
    connected = true
    attemptNumber = 1
  })

  redis.on('error', err => {
    if (shuttingDown) {
      return
    }

    err.message = `[Redis] ${err.message}`
    log.error(err)
    // Send to exception notifiers here!
  })

  redis.on('reconnecting', time => {
    log.warn('[Redis] Reconnecting in %d ms (attempt #%d)', time, attemptNumber++)

    if (attemptNumber > config.redis.maxReconnects) {
      const err = new Error(
        `Redis failed to (re)connect after ${attemptNumber} attempts - giving up`
      )
      log.error(err)
      // Send to exception notifiers here!
    }
  })

  if (config.env !== 'test') {
    process.on('SIGTERM', () => {
      shuttingDown = true
    })
  }

  connections[type] = redis
  return redis
}

redisService.disconnect = () =>
  Promise.all(
    Object.keys(connections)
      .map(type => connections[type])
      .filter(Boolean)
      .map(conn => conn.disconnect())
  )

module.exports = redisService