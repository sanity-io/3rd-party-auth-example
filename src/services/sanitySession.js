const config = require('../../config')
const hashUserId = require('../util/hashUserId')
const logger = require('../services/logger')
const sanityClient = require('@sanity/client')

const client = sanityClient(config.sanityClient)
const log = logger({ logLevel: config.logLevel })

function findEmail(emails) {
  if (!emails || !emails.length) {
    return null
  }
  const accountEmail = emails.find(email => email.type === 'account')
  return accountEmail ? accountEmail.value : emails[0].value
}

function findImage(photos) {
  if (!photos || !photos.length) {
    return null
  }
  return photos[0].value
}

const passportToSanityUser = pUser => {
  const displayName = pUser.displayName || pUser.username
  if (!displayName) {
    const message = `Could not resolve displayName`
    throw new Error(message)
  }
  const email = findEmail(pUser.emails)
  return {
    userId: hashUserId(email),
    userFullName: displayName,
    userEmail: email,
    userImage: findImage(pUser.photos) || null
  }
}

module.exports = {
  create: passportUser => {
    const sanityUser = passportToSanityUser(passportUser)

    const expires = new Date()
    expires.setTime(expires.getTime() + config.sanitySession.expires)

    const session = Object.assign({}, sanityUser, {sessionExpires})

    log.info(`Logging in ${passportUser.displayName}`)

    return client.request({
      uri: '/auth/thirdParty/session',
      method: 'POST',
      json: true,
      body: session
    }).then(result => {
      log.info(`Sucessfully created Sanity identity: ${sanityUser.userId}`)
      log.info(`Redirecting to: ${result.endUserClaimUrl}`)
      return result.endUserClaimUrl
    })
    .catch(err => {
      log.error('Got error from Sanity auth API:')
      log.error(err)
      throw err
    })
  }
}
