var webpack = require('webpack')
module.exports = {
    entry:  './index.js',
    output: {
        filename: './index.js',
        library: 'alkali',
        libraryTarget: 'umd'
    },
    optimization: {
      minimize: true
    },
    mode: 'production',
    devtool: 'source-map'
};
