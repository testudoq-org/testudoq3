// copy-files.mjs - Simple file copy utility
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Source and destination paths
const sourceDir = path.join(dirname, 'src', 'main');
const libDir = path.join(dirname, 'src', 'lib');
const destDir = path.join(dirname, 'pack');
const destLibDir = path.join(dirname, 'pack', 'lib');
const filesToCopy = ['background.mjs', 'options.mjs', 'inject-value.mjs', 'paste.mjs'];

console.log('📂 Copying critical files from src/main to pack...');

// Create destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  console.log(`Created directory: ${destDir}`);
}

// Copy each file
filesToCopy.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const destPath = path.join(destDir, file);
  
  if (fs.existsSync(sourcePath)) {
    try {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copied: ${file}`);
    } catch (err) {
      console.error(`❌ Error copying ${file}:`, err);
    }
  } else {
    console.error(`❌ Source file not found: ${file}`);
  }
});

console.log('✅ Copy operation completed!');
