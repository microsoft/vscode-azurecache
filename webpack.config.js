// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const path = require('path');
const process = require('process');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');

const DEBUG_WEBPACK = !!process.env.DEBUG_WEBPACK;

console.log('DEBUG_WEBPACK: ' + DEBUG_WEBPACK)

const reactWebviewExports = {
    entry: './src-webview/Index',
    devtool: DEBUG_WEBPACK ? 'cheap-source-map' : 'source-map',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'webview.js'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                options: {
                    presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
                    plugins: ["@babel/transform-runtime", "@babel/plugin-proposal-class-properties"]
                }
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: 'style-loader',
                    },
                    {
                        loader: 'css-loader',
                    },
                ],
            },
        ],
    },
    plugins: [
        new FileManagerPlugin({
            onEnd: {
                copy: [
                    {
                        source: path.join(__dirname, 'src-webview', 'fabric-icons', 'fonts', '*.woff'),
                        destination: path.join(__dirname, 'dist', 'fonts')
                    }
                ]
            }
        }),
    ],
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx']
    }
};

const extExports = {
    target: 'node',
    entry: './src/extension.ts',
    devtool: 'source-map',
    node: {
        "__filename": false,
        "__dirname": false
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'extension.js',
        libraryTarget: 'commonjs2',
        devtoolModuleFilenameTemplate: '../[resource-path]'
    },
    externals: {
        'vscode': 'commonjs vscode',
        'applicationinsights-native-metrics': 'applicationinsights-native-metrics',
        '@opentelemetry/tracing': '@opentelemetry/tracing'
    },
    plugins: [
        new FileManagerPlugin({
            onEnd: {
                copy: [
                    {
                        source: path.join(__dirname, 'node_modules', 'vscode-azureextensionui', 'resources', '**', '*.svg'),
                        destination: path.join(__dirname, 'dist', 'node_modules', 'vscode-azureextensionui', 'resources')
                    }
                ]
            }
        }),
        // https://github.com/microsoft/vscode-azuretools/blob/master/dev/src/webpack/getDefaultWebpackConfig.ts#L145
        new webpack.ContextReplacementPlugin(
            /^\./,
            (context) => {
                if (/node_modules[/\\]ms-rest[/\\]lib/.test(context.context)) {
                    for (const d of context.dependencies) {
                        if (d.critical) {
                            d.critical = false;
                        }
                    }
                }
            }),
    ],
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                loader: 'ts-loader',
                options: {
                    configFile: 'src/tsconfig.json'
                }
            }
        ]
    }
};

if (!DEBUG_WEBPACK) {
    reactWebviewExports.optimization = {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                extractComments: false,
                parallel: true,
                cache: true,
                terserOptions: {
                    keep_classnames: true,
                    keep_fnames: true
                }
            })
        ]
    };
    // Clean 'dist' folder before running. It is done here since reactWebViewExports is handled first by Webpack.
    reactWebviewExports.plugins.unshift(new CleanWebpackPlugin());

    extExports.optimization = {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                extractComments: false,
                parallel: true,
                cache: true,
                terserOptions: {
                    keep_classnames: true,
                    keep_fnames: true
                }
            })
        ]
    };
}

module.exports = [reactWebviewExports, extExports];
