var webpack = require('webpack')
module.exports = {
    entry:  './index.js',
    output: {
        filename: 'dist/index.js',
        library: 'alkali',
        libraryTarget: 'umd'
    },
    plugins: [
      new webpack.optimize.UglifyJsPlugin()
    ],
    devtool: 'source-map'
};
