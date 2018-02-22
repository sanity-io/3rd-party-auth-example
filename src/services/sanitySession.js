const config = require('../../config')
const hashUserId = require('../util/hashUserId')
const sanityClient = require('@sanity/client')

const client = sanityClient(config.sanityClient)

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

async function findUserRole(userId) {
  const query = '*[_type == "system.group" && members[] == $userId] {_id}'
  return client.fetch(query, {userId})
    .then(groups => {
      if (groups.some(grp => grp._id.match('admin'))) {
        return 'admin'
      }
      if (groups.length) {
        return 'editor'
      }
      return null
    })
}

async function passportToSanityUser(pUser) {
  const displayName = pUser.displayName || pUser.username
  if (!displayName) {
    const message = `Could not resolve displayName`
    throw new Error(message)
  }
  const email = findEmail(pUser.emails)
  const userId = hashUserId(email)

  // User role here is just a helper for the Studio GUI.
  // Not related to actual security!
  const userRole = await findUserRole(userId)

  return {
    userId: userId,
    userFullName: displayName,
    userEmail: email,
    userImage: findImage(pUser.photos) || null,
    userRole: userRole
  }
}

module.exports = {
  create: async passportUser => {
    const sanityUser = await passportToSanityUser(passportUser)

    const expires = new Date()
    expires.setTime(expires.getTime() + config.sanitySession.expires)

    const session = Object.assign({}, sanityUser, {sessionExpires: expires})

    return client.request({
      uri: '/auth/thirdParty/session',
      method: 'POST',
      json: true,
      body: session
    }).then(result => {
      return result.endUserClaimUrl
    })
    .catch(err => {
      throw err
    })
  }
}
