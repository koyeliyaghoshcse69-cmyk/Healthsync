const path = require('path')

const app = require(path.join(__dirname, '..', 'backend', 'index.js'))

module.exports = (req, res) => {
  return app(req, res)
}
