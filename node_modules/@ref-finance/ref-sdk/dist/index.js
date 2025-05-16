
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./ref-sdk.cjs.production.min.js')
} else {
  module.exports = require('./ref-sdk.cjs.development.js')
}
