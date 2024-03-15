const fs = require('fs');
const { obfuscate } = require('javascript-obfuscator');
const { minify } = require('uglify-js'),

	// Get a list of all files in the 'pack' directory
	files = fs.readdirSync('pack'),

	// Define obfuscation options
	obfuscationOptions = {
		compact: true,
		controlFlowFlattening: true,
		deadCodeInjection: false,
		debugProtection: false,
		disableConsoleOutput: true,
		identifierNamesGenerator: 'hexadecimal',
		renameGlobals: false,
		rotateStringArray: true,
		selfDefending: true,
		shuffleStringArray: true,
		stringArray: true,
		stringArrayEncoding: ['base64'], // Set stringArrayEncoding to an array with a valid value
		stringArrayThreshold: 0.75
	};

// Iterate over each file in the 'pack' directory
files.forEach(file => {
	// Check if the file has a '.js' extension
	if (file.endsWith('.js')) {
		// Read the file's content
		const sourceCode = fs.readFileSync(`pack/${file}`, 'utf8'),

			// Obfuscate the source code
			obfuscatedCode = obfuscate(sourceCode, obfuscationOptions).getObfuscatedCode(),

			// Minimize the obfuscated code
			minimizedCode = minify(obfuscatedCode).code;

		// Write the minimized and obfuscated code to a new file in the 'dist' directory with the same name
		fs.writeFileSync(`dist/${file.replace('.js', '.min.js')}`, minimizedCode);
	}
});

console.log('Obfuscation and Minimization complete');
