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
    }
};