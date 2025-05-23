const { merge } = require('webpack-merge'),
	common = require('./webpack.common.js');

module.exports = merge(common(false), {
	mode: 'development',
	devtool: 'source-map',
	optimization: {
		minimize: false
	},
	watchOptions: {
		ignored: /node_modules/
	}
});
