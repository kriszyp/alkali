var webpack = require('webpack')
module.exports = {
    entry:  './index.js',
    output: {
        path:     'dist',
        filename: 'index.js',
        library: 'alkali',
        libraryTarget: 'umd'
    },
    plugins: [
      new webpack.optimize.UglifyJsPlugin()
    ],
    devtool: 'source-map'
};