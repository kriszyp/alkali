var webpack = require('webpack')
module.exports = {
    entry:  './index.js',
    output: {
        filename: './index.js',
        library: 'alkali',
        libraryTarget: 'umd'
    },
    plugins: [
      new webpack.optimize.UglifyJsPlugin()
    ],
    mode: 'production',
    devtool: 'source-map'
};
