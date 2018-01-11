const pino = require('pino')

let logger = null

module.exports = config => {
  if (!logger && !config) {
    throw new Error('Logger needs to be initialized with a config before usage')
  }

  if (!logger) {
    logger = pino({
      level: config.logLevel
    })
  }

  return logger
}
