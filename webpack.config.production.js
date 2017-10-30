const config = require('./webpack.config')
const webpack = require('webpack')

config.output.filename = 'react-transient.min.js'
config.devtool = 'source-map'

module.exports = config
