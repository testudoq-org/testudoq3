// copy-lib-files.mjs - Copy lib directory to pack
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url),
	dirname = path.dirname(filename),
	sourceLibDir = path.join(dirname, 'src', 'lib'),
	destLibDir = path.join(dirname, 'pack', 'lib');

/**
 * Create a directory if it doesn't exist
 * @param {string} dir - Directory path to create
 */
function ensureDirectoryExists(dir) {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
		console.log(`📁 Created directory: ${dir}`);
	}
}

/**
 * Copy all files from source directory to destination directory
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 */
function copyDirectory(src, dest) {
	console.log(`📂 Copying directory: ${src} -> ${dest}`);
	ensureDirectoryExists(dest);
	
	try {
		const files = fs.readdirSync(src);
		files.forEach(file => {
			const srcPath = path.join(src, file);
			const destPath = path.join(dest, file);
			
			if (fs.statSync(srcPath).isDirectory()) {
				copyDirectory(srcPath, destPath);
			} else if (file.endsWith('.mjs')) {
				try {
					fs.copyFileSync(srcPath, destPath);
					console.log(`   ✅ Copied: ${file}`);
				} catch (err) {
					console.error(`   ❌ Error copying ${file}:`, err);
				}
			}
		});
	} catch (err) {
		console.error(`❌ Error reading directory ${src}:`, err);
	}
}

// Copy lib directory
console.log('\n📂 Copying lib directory to pack...');
copyDirectory(sourceLibDir, destLibDir);

console.log('\n✅ Library files copied successfully!');
