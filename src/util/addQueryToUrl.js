const {URL} = require('url')

// Adds a query to the query string */
// query = Object where key/values become param/values

module.exports = (query, oldUrl) => {
  const newUrl = new URL(oldUrl)
  let search = ''
  Object.keys(query).forEach(key => {
    search += `&${key}=${encodeURIComponent(query[key])}`
  })
  newUrl.search = `${newUrl.search}${search}`
  return newUrl.href.replace('?&', '?')
}
