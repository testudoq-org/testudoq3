# TestudoQ Build Process Documentation

## Overview

The TestudoQ build process has been fully updated to support ES modules and modern browser extension requirements. This document outlines the build system components, processes, and best practices.

## Directory Structure

### Source Directories
```plaintext
src/
  ├── main/           # Core ES modules (.mjs)
  │   ├── background.mjs
  │   ├── options.mjs
  │   └── ...
  ├── lib/           # Utility modules (.mjs)
  │   ├── context-menu.mjs
  │   ├── gremlins-handler.mjs
  │   └── ...
  └── content-scripts/ # Content script modules (.mjs)
      ├── inject-value.mjs
      ├── paste.mjs
      └── ...
```

### Template Directory
```plaintext
template/
  ├── manifest.json    # MV3 manifest
  ├── config.json     # Extension configuration
  ├── gremlins.min.js # Third-party library
  └── ...            # Static assets
```

### Output Structure
```plaintext
pack/
  ├── manifest.json
  ├── background.mjs
  ├── options.mjs
  ├── content-scripts/
  └── lib/
```

## Build Process

### NPM Scripts
```json
{
  "scripts": {
    "clean": "rimraf pack/*",
    "prepack-extension": "node scripts/prepare-output.mjs",
    "pack-extension": "webpack --config webpack.config.mjs",
    "copy-main-files": "node scripts/copy-main.mjs",
    "postpack-extension": "node scripts/post-process.mjs",
    "validate-build": "node scripts/validate.mjs",
    "build-extension": "npm run clean && npm run prepack-extension && npm run pack-extension && npm run copy-main-files && npm run postpack-extension && npm run validate-build"
  }
}
```

### Webpack Configuration
```javascript
// webpack.config.mjs
export default {
  entry: {
    background: './src/main/background.mjs',
    options: './src/main/options.mjs'
  },
  output: {
    path: './pack',
    filename: '[name].mjs'
  },
  experiments: {
    outputModule: true
  },
  module: {
    rules: [
      {
        test: /\.mjs$/,
        type: 'javascript/esm',
        exclude: /node_modules/
      }
    ]
  }
};
```

## Critical Files Checklist

✅ Service Worker:
- background.mjs (ES module)
- Manifest configuration correct
- Module imports working

✅ Content Scripts:
- All .mjs extensions
- Proper module type
- Correct paths in manifest

✅ Static Assets:
- manifest.json updated
- config.json present
- gremlins.min.js accessible

## Recent Improvements (May 2025)

### 1. ES Module Migration (Completed)
- ✅ All JavaScript files converted to .mjs
- ✅ Import/export statements standardized
- ✅ Module resolution paths fixed
- ✅ Build system updated for ES modules

### 2. Build Process Enhancements
- ✅ Webpack ES module configuration
- ✅ Improved file copying logic
- ✅ Better error handling
- ✅ Source map generation

### 3. Validation Improvements
- ✅ Enhanced build validation
- ✅ Module resolution checking
- ✅ File presence verification
- ✅ Manifest validation

## Troubleshooting Guide

### Common Issues

1. **Module Resolution Errors**
   ```javascript
   // Wrong
   import { helper } from './lib/helper';
   
   // Correct
   import { helper } from '../lib/helper.mjs';
   ```

2. **Missing Files**
   - Run `npm run validate-build`
   - Check console for copy errors
   - Verify webpack output

3. **Manifest Issues**
   - Ensure type: "module" is set
   - Verify .mjs extensions
   - Check content script paths

### Error Recovery

1. **Build Failures**
   ```bash
   npm run clean
   npm run build-extension
   ```

2. **Module Loading Issues**
   - Check browser console
   - Verify import paths
   - Validate module syntax

3. **Extension Loading Errors**
   - Check manifest.json
   - Verify file presence
   - Review browser logs

## Best Practices

1. **Build Process**
   - Always use `npm run build-extension`
   - Validate before testing
   - Check console output

2. **Module Management**
   - Use .mjs extension
   - Include file extensions in imports
   - Follow ES module syntax

3. **Testing**
   - Verify in Chrome and Firefox
   - Check module loading
   - Monitor console logs

## Performance Considerations

1. **Bundle Size**
   - Monitor module dependencies
   - Use code splitting where appropriate
   - Track bundle statistics

2. **Load Time**
   - Optimize module loading
   - Minimize static assets
   - Use efficient imports

3. **Development Speed**
   - Use watch mode
   - Enable hot reloading
   - Maintain source maps

## Next Steps

1. **Optimization**
   - Implement chunk splitting
   - Add bundle analysis
   - Optimize asset loading

2. **Tooling**
   - Add build profiling
   - Enhance error reporting
   - Improve debugging support

3. **Documentation**
   - Update build docs
   - Add troubleshooting guides
   - Document best practices
