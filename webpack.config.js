const path = require('path')

module.exports = {
    entry: path.resolve('src/lib/index'),
    output: {
        path: path.resolve('dist'),
        filename: process.env.NODE_ENV === 'production' ? 'react-transient.min.js' : 'react-transient.js',
        library: 'ReactTransient',
        libraryTarget: 'umd'
    },
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                options: {
                    configFile: 'tsconfig.dist.json'
                }
            }
        ]
    },
    externals: {
        react: {
            root: 'React',
            commonjs2: 'react',
            commonjs: 'react',
            amd: 'react'
        },
        'react-dom': {
            root: 'ReactDOM',
            commonjs2: 'react-dom',
            commonjs: 'react-dom',
            amd: 'react-dom'
        }
    },
    devtool: process.env.NODE_ENV === 'production' ? 'inline-source-map' : 'source-map'
}
