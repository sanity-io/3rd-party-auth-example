const pckage = require('../../package.json')
const callback = require('./callback')
const express = require('express')
const login = require('./login')
const validateOrigin = require('../middleware/valdiateOrigin')

const router = express.Router()

router.get('/login/:providerName', validateOrigin, login)

router.get('/callback/:providerName', callback)
router.post('/callback/:providerName', callback)

router.get('/apiadmin/ping', (req, res) => {
  let message = 'OK ' + pckage.version
  res.statusMessage = message
  res.status(200).send(message)
})

module.exports = router
