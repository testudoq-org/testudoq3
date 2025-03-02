const { merge } = require('webpack-merge'),
common = require('./webpack.common.js'),
TerserPlugin = require('terser-webpack-plugin');

module.exports = merge(common(true), {
	mode: 'production',
	optimization: {
		minimize: true,
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					compress: {
						drop_console: true
					},
					format: {
						comments: false
					}
				}
			})
		]
	},
	performance: {
		hints: 'warning',
		maxEntrypointSize: 512000,
		maxAssetSize: 512000
	}
});
