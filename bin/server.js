/* eslint-disable no-console, no-process-exit */

const app = require('../src/app')
const config = require('../config')

const server = app(config)

server.use((req, res, next) => {
  res.setHeader('Connection', 'close')
  next()
})

const httpServer = server.listen(config.port, config.hostname, () => {
  console.log(`Running on http://${config.hostname}:${config.port}`)
})

process.on('SIGTERM', () => {
  console.log('\nCaught SIGTERM, exiting')
  httpServer.close(() => process.exit(143))
})
