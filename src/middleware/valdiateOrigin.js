const Boom = require('boom')
const validUrl = require('valid-url')

// Validate origin url
module.exports = (req, res, next) => {
  const query = req.query || {}
  const origin = query.origin
  if (!origin) {
    next(
      Boom.badRequest(
        `Param 'origin' (url) is required.`
      )
    )
    return
  }
  // Check if it has the right format
  if (!validUrl.isWebUri(origin)) {
    next(
      Boom.badRequest(
        `Invalid origin URL '${origin}'. Make sure you include protocol, hostname and path.`
      )
    )
    return
  }
  // Store the origin for later use
  res.locals.origin = origin
  next()
}
