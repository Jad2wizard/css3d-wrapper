const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: [
        path.resolve(__dirname, './src/index.js')
    ],
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'bundle.js',
        library: 'CSS3D',
        libraryTarget: "umd"
    },

    resolve: {
        extensions: ['.js', '.jsx']
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            }
        }),
        new webpack.optimize.UglifyJsPlugin({
            output: {
                comments: false
            },
            compress: {
                warnings: false
            }
        })
    ],
    module: {
        rules: [
            {
                test: /\.(jsx|js)?$/,
                exclude: /node_modules/,
                use: 'babel-loader'
            },
            {
                test: /\.(css|scss)$/,
                loader: "style-loader!css-loader?modules&localIdentName=[path][name]---[local]---[hash:base64:5]!sass-loader"
            },
            {
                test: /\.(png|jpg)$/,
                loader: 'url-loader?limit=8192'
            }
        ]
    },
    // externals:{
    //     'react': 'umd react',
    //     'react-dom': 'umd react-dom'
    // }
};
