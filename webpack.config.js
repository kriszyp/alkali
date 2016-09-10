var path = require('path')
module.exports = {
    entry:  './src',
    output: {
        path:     'builds',
        filename: 'bundle.js',
    },
    module: {
        loaders: [
            {
                include: /src/,
                test:   /\.js/,
                loader: 'babel-loader'
            }
        ]
    },
    resolve: {
        alias: {
            alkali: path.resolve(__dirname, 'bower_components/alkali')
        }
    },
    devtool: 'cheap-source-map'
};