// clean-duplicates.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url),
	__dirname = path.dirname(__filename),

	// Define directories to scan
	libDir = path.join(__dirname, 'src', 'lib'),
	mainDir = path.join(__dirname, 'src', 'main'),
	packDir = path.join(__dirname, 'pack'),
	templateDir = path.join(__dirname, 'template');

// Function to clean duplicate files
function cleanDuplicates(dir) {
	console.log(`\n🔍 Cleaning duplicates in ${dir}...`);
	fs.readdir(dir, (err, files) => {
		if (err) {
			console.error(`❌ Error reading directory ${dir}:`, err);
			return;
		}

		// Find .mjs files
		const mjsFiles = files.filter(file => file.endsWith('.mjs'));

		// For each .mjs file, check if a corresponding .js file exists and remove it
		mjsFiles.forEach(mjsFile => {
			const baseName = mjsFile.replace('.mjs', ''),
				jsFile = `${baseName}.js`,
				jsFilePath = path.join(dir, jsFile);

			// Check if the .js version exists
			if (fs.existsSync(jsFilePath)) {
				console.log(`🗑️  Removing duplicate file: ${jsFilePath}`);				// Read both files to compare content
				const mjsContent = fs.readFileSync(path.join(dir, mjsFile), 'utf8'),
					jsContent = fs.readFileSync(jsFilePath, 'utf8'),

					// Only delete if the content is actually migrated (not just renamed)
					isMigrated = mjsContent.includes('export default') || mjsContent.includes('import ');

				if (isMigrated) {
					try {
						fs.unlinkSync(jsFilePath);
						console.log(`   ✅ Deleted: ${jsFile}`);
					} catch (deleteErr) {
						console.error(`   ❌ Failed to delete ${jsFile}:`, deleteErr);
					}
				} else {
					console.log(`   ⚠️ Skipped ${jsFile}: Content not migrated properly`);
				}
			}
		});

		console.log(`   ✅ Completed cleaning in ${dir}`);
	});
}

// Function to verify and copy missing files from src/main to pack
function verifyAndCopyFiles() {
	console.log('\n🔍 Verifying required files in pack directory...');

	// Check for background.mjs specifically
	const criticalFiles = [
		{ source: path.join(mainDir, 'background.mjs'), target: path.join(packDir, 'background.mjs') },
		{ source: path.join(mainDir, 'options.mjs'), target: path.join(packDir, 'options.mjs') },
		{ source: path.join(mainDir, 'inject-value.mjs'), target: path.join(packDir, 'inject-value.mjs') },
		{ source: path.join(mainDir, 'paste.mjs'), target: path.join(packDir, 'paste.mjs') }
	];

	// Copy critical files if missing
	criticalFiles.forEach(file => {
		if (!fs.existsSync(file.target) && fs.existsSync(file.source)) {
			try {
				fs.copyFileSync(file.source, file.target);
				console.log(`   ✅ Copied missing file: ${path.basename(file.source)}`);
			} catch (err) {
				console.error(`   ❌ Error copying ${path.basename(file.source)}:`, err);
			}
		} else if (fs.existsSync(file.target)) {
			console.log(`   ✓ File exists: ${path.basename(file.target)}`);
		} else if (!fs.existsSync(file.source)) {
			console.error(`   ❌ Source file missing: ${path.basename(file.source)}`);
		}
	});
}

// Run the cleanup and verification
cleanDuplicates(libDir);
cleanDuplicates(mainDir);
cleanDuplicates(packDir);
verifyAndCopyFiles();

console.log('\n✅ All operations completed!');
