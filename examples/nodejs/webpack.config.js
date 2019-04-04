const slsw = require('serverless-webpack');
// use the bunde analyzer plugin only locally when you want to drill down on your dependencies
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
    externals: {
        'aws-sdk': 'aws-sdk'
    },
    entry: slsw.lib.entries,
    target: 'node',
    module: {},
    mode: 'none',
    // plugins: [
    //     new BundleAnalyzerPlugin()
    // ]
};
