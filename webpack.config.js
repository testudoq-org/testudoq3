const path = require('path');
const recursiveLs = require('fs-readdir-recursive'),

	/**
 * Object to store entry points for webpack.
 * @type {Object.<string, string>}
 */
	entries = {},

	/**
 * Function to recursively build entry points based on files in a directory.
 * @param {string} dir - The directory to scan for files.
 */
	buildEntries = (dir) => {
		try {
			// Recursively list files in the specified directory
			recursiveLs(dir).forEach((f) => {
				// Add each file as an entry point with its full path
				entries[f] = path.join(dir, f);
			});
		} catch (err) {
			// Handle errors if any occur during directory scanning
			console.error('Error building entries:', err);
		}
	};

// Call buildEntries function to generate entry points from the 'src/main' directory
buildEntries(path.resolve(__dirname, 'src', 'main'));

// Export webpack configuration
module.exports = {
	// Specify entry points generated by the buildEntries function
	entry: entries,
	// Define output configuration
	output: {
		// Specify output directory for bundled files
		path: path.resolve(__dirname, 'pack'),
		// Define filename pattern for output files, using the entry names
		filename: '[name]'
	},
	// Define module rules for processing files (e.g., loaders for different file types)
	module: {
		rules: [
			// Add any necessary loaders or rules for processing files
		]
	},
	// Define resolve configurations for resolving module paths
	resolve: {
		// Add any resolve configurations if needed
	}
	// Add any other necessary configurations
};
