/**
 * Script to verify menu contexts in TestudoQ extension
 *
 * This script logs details about menu creation to help diagnose
 * visibility issues in context menus.
 */

// Node.js script to analyze the extension output
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url),
	__dirname = path.dirname(__filename);

// Function to extract context menu configurations from built files
async function analyzeMenuConfigurations() {
	console.log('🔍 Analyzing menu context configurations...');

	// Paths to relevant files
	const contextMenuPath = path.join(__dirname, 'pack', 'context-menu.mjs'),
		chromeMenuBuilderPath = path.join(__dirname, 'pack', 'chrome-menu-builder.mjs'),
		firefoxMenuBuilderPath = path.join(__dirname, 'pack', 'firefox-menu-builder.mjs');

	// Check if files exist
	try {
		console.log(`✅ Reading context-menu.mjs: ${fs.existsSync(contextMenuPath)}`);
		console.log(`✅ Reading chrome-menu-builder.mjs: ${fs.existsSync(chromeMenuBuilderPath)}`);
		console.log(`✅ Reading firefox-menu-builder.mjs: ${fs.existsSync(firefoxMenuBuilderPath)}`);

		// Read files
		const contextMenuContent = fs.readFileSync(contextMenuPath, 'utf8'),
			chromeMenuBuilderContent = fs.readFileSync(chromeMenuBuilderPath, 'utf8'),
			firefoxMenuBuilderContent = fs.readFileSync(firefoxMenuBuilderPath, 'utf8');

		// Check for the relevant context configurations
		console.log('\n📊 Context Analysis:');

		// Check for ALL_CONTEXTS definition
		const allContextsMatch = contextMenuContent.match(/const\s+ALL_CONTEXTS\s*=\s*\[(.*?)\]/);
		if (allContextsMatch) {
			console.log(`✅ ALL_CONTEXTS defined as: ${allContextsMatch[1]}`);
		} else {
			console.log('❌ ALL_CONTEXTS not found in context-menu.mjs');
		}

		// Check for Customise menus and Help/Support entries
		const customiseMenusMatch = contextMenuContent.match(/menuBuilder\.menuItem\('Customise menus',\s*rootMenu,\s*[^,]+,\s*({[^}]+})/);
		if (customiseMenusMatch) {
			console.log(`✅ 'Customise menus' using contexts: ${customiseMenusMatch[1]}`);
		} else {
			console.log('❌ Could not find context config for "Customise menus"');
		}

		const helpSupportMatch = contextMenuContent.match(/menuBuilder\.menuItem\('Help\/Support',\s*rootMenu,\s*[^,]+,\s*({[^}]+})/);
		if (helpSupportMatch) {
			console.log(`✅ 'Help/Support' using contexts: ${helpSupportMatch[1]}`);
		} else {
			console.log('❌ Could not find context config for "Help/Support"');
		}

		// Check Chrome menu builder for context handling
		const chromeContextsDefault = chromeMenuBuilderContent.match(/const\s+DEFAULT_CONTEXTS\s*=\s*\[(.*?)\]/);
		if (chromeContextsDefault) {
			console.log(`✅ Chrome DEFAULT_CONTEXTS: ${chromeContextsDefault[1]}`);
		} else {
			console.log('❌ DEFAULT_CONTEXTS not found in chrome-menu-builder.mjs');
		}

		const chromeContextsUsage = chromeMenuBuilderContent.match(/const\s+useContexts\s*=\s*value\s*&&\s*value\.contexts\s*\?\s*value\.contexts\s*:\s*contexts/);
		if (chromeContextsUsage) {
			console.log('✅ Chrome menu builder properly uses contexts from value parameter');
		} else {
			console.log('❌ Chrome menu builder might not be using contexts correctly');
		}

		// Check Firefox menu builder
		const firefoxContextsUsage = firefoxMenuBuilderContent.match(/const\s+useContexts\s*=\s*value\s*&&\s*value\.contexts\s*\?\s*value\.contexts\s*:\s*contexts/);
		if (firefoxContextsUsage) {
			console.log('✅ Firefox menu builder properly uses contexts from value parameter');
		} else {
			console.log('❌ Firefox menu builder might not be using contexts correctly');
		}
	} catch (error) {
		console.error(`❌ Error analyzing files: ${error.message}`);
	}
}

// Execute the analysis
analyzeMenuConfigurations().catch(err => {
	console.error('❌ Analysis failed:', err);
});
