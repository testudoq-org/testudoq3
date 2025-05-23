# VSCode Configuration Update Plan

## Context
The project has moved to a new build system using npm scripts and webpack configuration. The VSCode launch.json and tasks.json need to be updated to align with this new approach.

## Current Build Process
- Uses `npm run build:dev` which:
  1. Runs `npm run version:dev` to update version numbers
  2. Runs `webpack --config webpack.dev.js` to build the extension
- Output directory is now `packages/dev-pack` (previously was `pack`)

## Required Changes

### tasks.json Updates
1. Remove obsolete tasks:
   - `prepack-and-pack-extension`
   - `buildExtension`
   - `printWebRootAndBuildExtension`
2. Add new tasks:
   - `build-dev`: Run `npm run build:dev` command
   - Update Firefox build task to work with new directory structure

### launch.json Updates
1. Update path references:
   - Change `/pack` to `/packages/dev-pack` in:
     - `runtimeArgs`
     - `outFiles`
2. Update Chrome configuration:
   - Change `preLaunchTask` to use new `build-dev` task
3. Update Firefox configuration:
   - Update extension loading paths to use new directory structure

## Implementation Steps
1. Switch to Code mode
2. Update tasks.json with new configuration
3. Update launch.json with new paths and task references
4. Test both Chrome and Firefox launch configurations
