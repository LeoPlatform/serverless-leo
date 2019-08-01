const webpack = require('webpack');
const slsw = require('serverless-webpack');
var nodeExternals = require('webpack-node-externals');
// use the bunde analyzer plugin only locally when you want to drill down on your dependencies
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = (async () => {
	return {
		entry: slsw.lib.entries,
		externals: [
			'aws-sdk', // excluding dependencies from the output bundles entirely (not even in node_modules) because externals are not being webpcked, must use webpack.includeModules = true in serverless
			nodeExternals({ modulesDir: '../layer/src/leo/nodejs/node_modules' }),
		],
		mode: slsw.lib.webpack.isLocal ? 'development' : 'production',
		optimization: {
			minimize: false, // We no not want to minimize our code. Easier to fix in lambda console.
		},
		plugins: [
			new webpack.IgnorePlugin(/pg-native/, /\/pg\//),
			// new BundleAnalyzerPlugin({ analyzerMode: 'static' })
		],
		target: 'node',
	};
})();
