const crypto = require('crypto')
const config = require('../../config')

module.exports = function hashUserId(username) {
  return crypto.createHmac('sha256', config.sanitySession.userIdHashSalt)
    .update(username.toLowerCase())
    .digest('hex')
}
