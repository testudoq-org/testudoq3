# TestudoQ Build Process Documentation

## Overview

The TestudoQ build process has been improved to ensure all source files are properly compiled and included in the final extension package. This document outlines the key components of the build system and how to troubleshoot common issues.

## Build Components

1. **Source Directory Structure**
   - `src/main/` - Core module files (background.mjs, options.mjs, etc.)
   - `src/lib/` - Utility and helper modules
   - `src/content-scripts/` - Content script modules

2. **Template Directory**
   - Contains static files to be copied to the output
   - Includes manifest.json, HTML, CSS, and images

3. **Pack Directory**
   - Final compiled extension ready for loading into browser
   - Contains all static assets and compiled JavaScript modules

## Build Scripts

The build process is managed through npm scripts in `package.json`:

- `npm run clean` - Cleans the output directory
- `npm run prepack-extension` - Prepares the output directory, copies template files
- `npm run pack-extension` - Runs webpack to compile and bundle JavaScript files
- `npm run copy-main-files` - Directly copies critical MJS files from src/main to pack
- `npm run postpack-extension` - Runs post-processing on the output directory
- `npm run validate-build` - Validates the build output for completeness
- `npm run build-extension` - Complete build process combining all steps

## Webpack Configuration

The `webpack.config.mjs` file handles:

1. Entry point discovery and bundling
2. Copying static files from template directory
3. Explicit copying of critical files like background.mjs

## Critical Files

These files are essential for extension functionality and must be present in the pack directory:

- `background.mjs` - Service worker (required for Chrome MV3)
- `options.mjs` - Options page functionality
- `inject-value.mjs` - Value injection functionality
- `paste.mjs` - Clipboard paste functionality
- `manifest.json` - Extension manifest

## Troubleshooting

If the extension fails to load with "failed to load extension" or "could not load background script":

1. Run the validation script: `npm run validate-build`
2. Check the pack directory for missing files
3. Verify manifest.json has correct service_worker configuration
4. Look for webpack compilation errors in the console output

## Recent Improvements

1. Added explicit copying of critical .mjs files from src/main
2. Created validation script to verify build completeness
3. Added fail-safe for background.mjs file copy
4. Updated webpack configuration for proper ES module handling
5. Improved build scripts for more reliable output

## Best Practices

1. Always run `npm run build-extension` for a complete build
2. Use VS Code tasks for consistent builds during development
3. Validate the build output before testing
4. Check browser console for loading errors

## Technical Summary - ES Module Resolution Fix (May 2025)

1. Core Issue: Module Resolution
- Problem: Webpack couldn't resolve './lib/' imports in background.mjs
- Root Cause: Incorrect relative path resolution from src/main directory
- Fix: Updated import paths from './lib/' to '../lib/' to correctly resolve relative to the file location

2. Webpack Configuration Improvements:
- Added src/lib directory to entry points scanning
- Switched to development mode for better debugging
- Enabled source maps with devtool: 'source-map'
- Simplified copy plugin configuration to avoid duplicate file copying

3. Verification Process:
- Added diagnostic logging to track module loading sequence
- Confirmed successful module imports through console logs
- Validated correct file copying and import path fixing
- Build process now completes successfully with:
  * All modules properly bundled
  * Dependencies correctly resolved
  * Source maps generated for debugging
  * Import paths properly fixed in compiled files

4. Architecture Changes:
- Moved from individual file copying to proper module bundling
- Maintained ES module support through webpack's module configuration
- Preserved the extension's module type requirements while fixing path resolution
