const path = require('path'),
	recursiveLs = require('fs-readdir-recursive'),
	CopyWebpackPlugin = require('copy-webpack-plugin'),
	entries = {},
	buildEntries = (dir) => {
		try {
			recursiveLs(dir).forEach((f) => {
				entries[f] = path.join(dir, f);
			});
		} catch (err) {
			console.error('Error building entries:', err);
		}
	};

// Build entries from the main directory
buildEntries(path.resolve(__dirname, 'src', 'main'));

/**
 * Common webpack configuration shared between dev and prod
 * @param {boolean} isProduction - Whether this is a production build
 */
module.exports = (isProduction) => ({
	entry: entries,
	output: {
		path: path.resolve(__dirname, 'packages', isProduction ? 'prd-pack' : 'dev-pack'),
		filename: '[name]'
	},
	module: {
		rules: [
			// Add any common rules here
		]
	},
	resolve: {
		extensions: ['.js', '.json']
	},
	plugins: [
		new CopyWebpackPlugin({
			patterns: [
				{
					from: './template',
					to: path.resolve(__dirname, 'packages', isProduction ? 'prd-pack' : 'dev-pack'),
					globOptions: {
						ignore: ['**/*.js.map'] // Ignore source maps in production
					}
				}
			]
		})
	]
});
