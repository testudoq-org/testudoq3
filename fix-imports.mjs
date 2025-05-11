// fix-imports.mjs - Fix import paths in compiled files
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url),
	dirname = path.dirname(filename),
	packDir = path.join(dirname, 'pack'),
	filesToFix = [
		'background.mjs',
		'options.mjs',
		'inject-value.mjs',
		'paste.mjs'
	];

console.log('🔧 Fixing import paths in compiled files...');

/**
 * Fix import paths in a file
 * @param {string} filePath - Path to file to fix
 */
function fixImportPaths(filePath) {
	if (!fs.existsSync(filePath)) {
		console.error(`   ❌ File not found: ${filePath}`);
		return;
	}
	
	try {
		console.log(`   📝 Processing: ${path.basename(filePath)}`);
		let content = fs.readFileSync(filePath, 'utf8');
		
		// Fix relative imports to lib directory
		let updatedContent = content.replace(
			/import\s+(\w+(?:\s*,\s*\{\s*[^}]+\s*\})?|\{\s*[^}]+\s*\})\s+from\s+['"]\.\.\/lib\//g, 
			"import $1 from './lib/"
		);
		
		// Update if changes were made
		if (content !== updatedContent) {
			fs.writeFileSync(filePath, updatedContent);
			console.log(`      ✅ Fixed imports in ${path.basename(filePath)}`);
		} else {
			console.log(`      ✓ No changes needed in ${path.basename(filePath)}`);
		}
	} catch (err) {
		console.error(`      ❌ Error fixing imports in ${path.basename(filePath)}:`, err);
	}
}

// Process each file
filesToFix.forEach(file => {
	const filePath = path.join(packDir, file);
	fixImportPaths(filePath);
});

console.log('\n✅ Import path fixing completed!');
