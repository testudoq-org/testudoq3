// validate-build.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Define directories to scan
const sourceDir = path.join(dirname, 'src', 'main');
const packDir = path.join(dirname, 'pack');
const requiredFiles = ['background.mjs', 'options.mjs', 'inject-value.mjs', 'paste.mjs'];

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
console.log('\n🔍 Checking for required files:');

requiredFiles.forEach(file => {
  const packPath = path.join(packDir, file);
  const sourcePath = path.join(sourceDir, file);
  
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
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);
    
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

// Summary
if (missingFiles > 0) {
  console.log(`\n⚠️ Found and fixed ${missingFiles} missing files`);
} else {
  console.log('\n✅ All required files are present');
}

console.log('\n🏁 Build validation completed');
