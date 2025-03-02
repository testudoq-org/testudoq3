const fs = require('fs-extra'),
	path = require('path'),
	env = process.argv.includes('--prod') ? 'prod' : 'dev',
	isProduction = env === 'prod',
	versionFile = path.join(__dirname, 'config', `version.${env}.json`),
	config = JSON.parse(fs.readFileSync(versionFile, 'utf-8')),
	currentVersion = config.version,
	[major, minor, patch] = currentVersion.split('-')[0].split('.').map(Number),
	newVersion = isProduction
		? `${major}.${minor}.${patch + 1}`
		: `${major}.${minor}.${patch + 1}-dev`,
	filesToUpdate = [
		{ path: 'package.json', key: 'version' },
		{ path: path.join('packages', isProduction ? 'prd-pack' : 'dev-pack', 'manifest.json'), key: 'version' },
		{ path: path.join('packages', isProduction ? 'prd-pack' : 'dev-pack', 'popup/popup.html'), key: 'version-text' }
	],
	updateVersionInFile = (filePath, key) => {
		try {
			let fileContent = fs.readFileSync(filePath, 'utf-8');

			if (key === 'version') {
				fileContent = fileContent.replace(/"version":\s*"(.*?)"/, `"version": "${newVersion}"`);
			} else if (key === 'version-text') {
				fileContent = fileContent.replace(
					/<span class="version" title="uniPath version installed\." aria-label="Version">v\s*[\d.]+(-dev)?<\/span>/g,
					`<span class="version" title="uniPath version installed." aria-label="Version">v ${newVersion}</span>`
				);
			}

			fs.writeFileSync(filePath, fileContent, 'utf-8');
			console.log(`Successfully updated ${key} in ${filePath} to ${newVersion}`);
		} catch (error) {
			console.error(`Error updating ${filePath}:`, error.message);
		}
	};

// Update the config file with the new version
config.version = newVersion;
fs.writeFileSync(versionFile, JSON.stringify(config, null, 2), 'utf-8');

// Update version in each file
filesToUpdate.forEach(file => {
	const filePath = path.join(__dirname, file.path);
	updateVersionInFile(filePath, file.key);
});

console.log(`\nVersion updated to ${newVersion} in ${env} environment`);
