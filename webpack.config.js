const path = require('path')
const nodeExternals = require('webpack-node-externals');

module.exports = {
    mode: 'development',
    entry: {
        'server': './src/server.ts',
    },
    output: {
        path: path.resolve(__dirname, './lib/'),
        sourceMapFilename: '[name].js.map',
        filename: '[name].js',
        chunkFilename: '[name].js',
        library: {
            name: 'server',
            type: 'umd',
        },
    },
    optimization: {
        minimize: false,
    },
    context: path.resolve('.'),
    target: 'node',
    devtool: 'source-map',
    watchOptions: {
        ignored: /lib/,
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
        modules: ['node_modules', path.resolve(__dirname, '../src')],
    },
    externals: [
        nodeExternals({})
    ],
}
