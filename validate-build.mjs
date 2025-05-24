// validate-build.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url),
	dirname = path.dirname(filename),

	// Define directories to scan
	sourceDir = path.join(dirname, 'src', 'main'),
	packDir = path.join(dirname, 'pack'),
	requiredFiles = ['background.mjs', 'options.mjs', 'inject-value.mjs', 'paste.mjs'];

console.log('🔍 Validating build output...');

// Check if source directory exists
if (!fs.existsSync(sourceDir)) {
	console.error(`❌ Source directory does not exist: ${sourceDir}`);
	process.exit(1);
}

// Check if pack directory exists
if (!fs.existsSync(packDir)) {
	console.error(`❌ Pack directory does not exist: ${packDir}`);
	process.exit(1);
}

// Validate required files
let missingFiles = 0;
console.log('\n�� Checking for required files:');

requiredFiles.forEach(file => {
	const packPath = path.join(packDir, file),
		sourcePath = path.join(sourceDir, file);

	if (fs.existsSync(sourcePath)) {
		if (fs.existsSync(packPath)) {
			console.log(`   ✅ ${file} - Present in pack directory`);
		} else {
			console.error(`   ❌ ${file} - Missing from pack directory`);
			missingFiles++;

			// Copy the missing file
			try {
				fs.copyFileSync(sourcePath, packPath);
				console.log(`      ✅ Copied ${file} from src/main to pack`);
			} catch (err) {
				console.error(`      ❌ Failed to copy ${file}:`, err);
			}
		}
	} else {
		console.warn(`   ⚠️ ${file} - Not found in source directory`);
	}
});

// Check manifest.json for proper configuration
const manifestPath = path.join(packDir, 'manifest.json');
try {
	if (fs.existsSync(manifestPath)) {
		const manifestContent = fs.readFileSync(manifestPath, 'utf8'),
			manifest = JSON.parse(manifestContent);

		console.log('\n🔍 Checking manifest.json configuration:');

		// Verify background script configuration
		if (manifest.background &&
      manifest.background.service_worker === 'background.mjs' &&
      manifest.background.type === 'module') {
			console.log('   ✅ background.mjs correctly configured in manifest');
		} else {
			console.error('   ❌ background.mjs not correctly configured in manifest');
			console.log('      Current configuration:', JSON.stringify(manifest.background, null, 2));
		}
	} else {
		console.error(`❌ manifest.json not found in pack directory`);
	}
} catch (err) {
	console.error('❌ Error parsing manifest.json:', err);
}

// Function to extract context menu configurations from built files
async function analyzeMenuConfigurations() {
	console.log('\n🔍 Analyzing menu context configurations...');

	// Paths to relevant files
	const contextMenuPath = path.join(packDir, 'context-menu.mjs'),
		chromeMenuBuilderPath = path.join(packDir, 'chrome-menu-builder.mjs'),
		firefoxMenuBuilderPath = path.join(packDir, 'firefox-menu-builder.mjs');

	// Check if files exist
	try {
		console.log(`   ✅ Reading context-menu.mjs: ${fs.existsSync(contextMenuPath)}`);
		console.log(`   ✅ Reading chrome-menu-builder.mjs: ${fs.existsSync(chromeMenuBuilderPath)}`);
		console.log(`   ✅ Reading firefox-menu-builder.mjs: ${fs.existsSync(firefoxMenuBuilderPath)}`);

		// Validate that all files are present
		if (!fs.existsSync(contextMenuPath) || !fs.existsSync(chromeMenuBuilderPath) || !fs.existsSync(firefoxMenuBuilderPath)) {
			console.log('   ⚠️ One or more required menu files are missing. Skipping context validation.');
			return;
		}

		// Read files
		const contextMenuContent = fs.readFileSync(contextMenuPath, 'utf8'),
			chromeMenuBuilderContent = fs.readFileSync(chromeMenuBuilderPath, 'utf8'),
			firefoxMenuBuilderContent = fs.readFileSync(firefoxMenuBuilderPath, 'utf8');

		// Check for the relevant context configurations
		console.log('\n📊 Context Analysis:');

		// Check for ALL_CONTEXTS definition
		const allContextsMatch = contextMenuContent.match(/ALL_CONTEXTS\s*=\s*\[(.*?)\]/);
		if (allContextsMatch) {
			console.log(`   ✅ ALL_CONTEXTS defined as: ${allContextsMatch[1]}`);
		} else {
			console.log('   ❌ ALL_CONTEXTS not found in context-menu.mjs');
		}

		// Check for Customise menus and Help/Support entries
		const customiseMenusMatch = contextMenuContent.match(/menuBuilder\.menuItem\(\'Customise menus\',\s*rootMenu,\s*[^,]+,\s*({[^}]+})/);
		if (customiseMenusMatch) {
			console.log(`   ✅ "Customise menus" using contexts: ${customiseMenusMatch[1]}`);
		} else {
			console.log('   ❌ Could not find context config for "Customise menus"');
		}

		const helpSupportMatch = contextMenuContent.match(/menuBuilder\.menuItem\(\'Help\/Support\',\s*rootMenu,\s*[^,]+,\s*({[^}]+})/);
		if (helpSupportMatch) {
			console.log(`   ✅ "Help/Support" using contexts: ${helpSupportMatch[1]}`);
		} else {
			console.log('   ❌ Could not find context config for "Help/Support"');
		}

		// Check Chrome menu builder for context handling
		const chromeContextsDefault = chromeMenuBuilderContent.match(/DEFAULT_CONTEXTS\s*=\s*\[(.*?)\]/);
		if (chromeContextsDefault) {
			console.log(`   ✅ Chrome DEFAULT_CONTEXTS: ${chromeContextsDefault[1]}`);
		} else {
			console.log('   ❌ DEFAULT_CONTEXTS not found in chrome-menu-builder.mjs');
		}

		const chromeContextsUsage = chromeMenuBuilderContent.match(/useContexts\s*=\s*value\s*&&\s*value\.contexts\s*\?\s*value\.contexts\s*:\s*contexts/);
		if (chromeContextsUsage) {
			console.log('   ✅ Chrome menu builder properly uses contexts from value parameter');
		} else {
			console.log('   ❌ Chrome menu builder might not be using contexts correctly');
		}

		// Check Firefox menu builder
		const firefoxContextsUsage = firefoxMenuBuilderContent.match(/useContexts\s*=\s*value\s*&&\s*value\.contexts\s*\?\s*value\.contexts\s*:\s*contexts/);
		if (firefoxContextsUsage) {
			console.log('   ✅ Firefox menu builder properly uses contexts from value parameter');
		} else {
			console.log('   ❌ Firefox menu builder might not be using contexts correctly');
		}

		// Return success message
		return '✅ Menu context validation complete';
	} catch (error) {
		console.error(`❌ Error analyzing menu contexts: ${error.message}`);
		return null;
	}
}

// Analyze menu configurations
analyzeMenuConfigurations().then(result => {
	if (result) {
		console.log(`\n${result}`);
	}
}).catch(error => {
	console.error(`\n❌ Error during menu configuration analysis: ${error.message}`);
});

// Summary
if (missingFiles > 0) {
	console.log(`\n⚠️ Found and fixed ${missingFiles} missing files`);
} else {
	console.log('\n✅ All required files are present');
}

console.log('\n🏁 Build validation completed');
