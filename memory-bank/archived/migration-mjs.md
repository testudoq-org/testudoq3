# CommonJS to ES Modules Migration Plan

## 1. Introduction

### Goals
- Migrate existing CommonJS modules to ES modules (ESM) for Manifest V3 compatibility
- Modernize codebase to leverage ES6+ features
- Improve code maintainability and module resolution
- Enable better tree-shaking and bundle optimization

### Necessity
- Manifest V3 requires ES modules for service workers
- Better alignment with modern JavaScript ecosystem
- Enhanced developer experience with native async/await support
- Improved bundle size through better dead code elimination

### Expected Outcomes
- Full ESM compatibility across the codebase
- Reduced bundle size through better tree-shaking
- Improved development experience with modern syntax
- Better testing infrastructure with Jest ESM support

## 2. General Recommendations & Preparation

### Version Control
- Use current a dedicated branch
- Use atomic commits with clear messages
- Tag significant migration milestones
- Maintain detailed changelog in `memory-bank/migration-status.md`

### Prerequisites
- Node.js version: >=18.0.0 (Latest LTS)

## 3. Migration Progress Tracking

### Phase 0: Setup (COMPLETED)
- [x] Create migration progress section in this document
- [x] Update package.json with type: "module" and Node.js version requirements
- [x] Create jest.config.js file for ESM support
- [x] Update .babelrc configuration
- [x] Create webpack.config.mjs for ESM support

### Phase 1: Core Utility Modules (COMPLETED)
- [x] Convert logger.js → logger.mjs
- [x] Convert trigger-events.js → trigger-events.mjs
- [x] Convert get-request-value.js → get-request-value.mjs
- [x] Convert inject-value-to-active-element.js → inject-value-to-active-element.mjs
- [x] Convert process-menu-object.js → process-menu-object.mjs
- [x] Update test files for utilities

### Phase 2: Handler Modules (COMPLETED)
- [x] Convert inject-value-request-handler.js → inject-value-request-handler.mjs
- [x] Convert paste-request-handler.js → paste-request-handler.mjs
- [x] Convert copy-request-handler.js → copy-request-handler.mjs
- [x] Convert gremlins-attack-handler.js → gremlins-attack-handler.mjs

### Phase 3: Configuration and State Management (COMPLETED)
- [x] Convert configuration-manager.js → configuration-manager.mjs
- [x] Convert state-manager.js → state-manager.mjs
- [x] Convert resource-manager.js → resource-manager.mjs
- [x] Convert permission-validator.js → permission-validator.mjs

### Phase 4: Browser Interfaces (COMPLETED)
- [x] Convert chrome-browser-interface.js → chrome-browser-interface.mjs
- [x] Convert firefox-browser-interface.js → firefox-browser-interface.mjs
- [x] Convert chrome-menu-builder.js → chrome-menu-builder.mjs
- [x] Convert firefox-menu-builder.js → firefox-menu-builder.mjs
- [x] Convert context-menu.js → context-menu.mjs
- [x] Convert init-config-widget.js → init-config-widget.mjs

### Phase 5: Main Application Files (COMPLETED)
- [x] Update background.js → background.mjs
- [x] Update inject-value.js → inject-value.mjs
- [x] Update options.js → options.mjs
- [x] Update paste.js → paste.mjs

### Phase 5A: Template and UI Script Migration (COMPLETED)
- [x] Convert `template/options-gremlins-bookmarklet-handler.js` → `template/options-gremlins-bookmarklet-handler.mjs`
- [x] Convert `template/prompt.js` → `template/prompt.mjs`
- [x] Convert `template/content-scripts/gremlins-handler.js` → `template/content-scripts/gremlins-handler.mjs`
- [x] Convert `template/popup/popup-init.js` → `template/popup/popup-init.mjs`
  - [x] Ensure `template/popup/popup.html` loads `popup-init.mjs` using `<script type="module">`
- [x] Convert `template/popup/popup.js` → `template/popup/popup.mjs`
  - [x] Ensure `template/popup/popup.html` loads `popup.js` using `<script type="module">`
- [x] Document `template/gremlins.min.js` as a third-party library that will not be converted. Ensured its usage remains compatible.

#### Phase 5A Completion Summary
✅ Successfully completed all tasks:
1. Removed duplicate .js files from template directory:
   - prompt.js
   - options-gremlins-bookmarklet-handler.js
   - popup.js
   - popup-init.js
   - gremlins-handler.js

2. Updated webpack.config.mjs to correctly handle .mjs files from template directory

3. Verified HTML files use proper module syntax:
   - popup.html correctly uses type="module" for popup-init.mjs and popup.mjs
   - options.html correctly uses type="module" for options-gremlins-bookmarklet-handler.mjs and prompt.mjs

4. Verified manifest.json configuration:
   - Service worker uses .mjs extension
   - Content scripts reference .mjs files
   - type: "module" properly set

5. Fixed accessibility issues in options.html:
   - Corrected invalid ARIA roles
   - Updated role attributes to use standard values
   - Improved form accessibility

### Issues requiring attention:
1. ❌ Duplicate .js files still exist in the template directory:
   - prompt.js
   - options-gremlins-bookmarklet-handler.js
   - popup.js
   - popup-init.js
   - gremlins-handler.js

2. ❌ Build process isn't correctly using .mjs files from the template directory:
   - options-gremlins-bookmarklet-handler.js (should be .mjs)
   - prompt.js (should be .mjs)
   - gremlins-handler.js (should be .mjs)
   - popup-init.js (should be .mjs)
   - popup.js (should be .mjs)

To complete the migration, you should:
1. Remove the duplicate .js files in the template directory
2. Update your build process to ensure it correctly handles .mjs files
3. Run a complete test of the extension to verify functionality
### Manifest.json Update Considerations (Related to Phase 5A and previous phases)
- **Service Worker:**
  - [x] Update `background.service_worker` in `manifest.json` from `"background.js"` to `"background.mjs"`.
- **Content Scripts:**
  - [x] Update `manifest.json` `content_scripts` array to use `.mjs` extensions and correct root paths for all relevant files:
    - Files from previous phases (from `src/main/`):
      - `inject-value.js` → `inject-value.mjs`
      - `paste.js` → `paste.mjs`
      - `options.js` → `options.mjs`
    - Files from new Phase 5A (from `template/`):
      - `prompt.js` → `prompt.mjs`
      - `options-gremlins-bookmarklet-handler.js` → `options-gremlins-bookmarklet-handler.mjs`
      - `content-scripts/gremlins-handler.js` → `content-scripts/gremlins-handler.mjs`
- **Popup HTML (`template/popup/popup.html`):**
  - [x] Update `<script>` tags in `template/popup/popup.html` to use `type="module"` when loading `popup-init.mjs` and `popup.mjs`.

### Phase 6: Build Configuration (IN PROGRESS)
- [x] Create webpack.config.mjs for ESM support
- [ ] Ensure application builds extension with ESM
- [ ] Ensure that launch.json debugging works with ESM and new mjs approach
- [ ] Test building extension with ESM
- [ ] Ensure all files are migrated to .mjs and remove duplicate .js files that have been migrated to .mjs

### File Extension Convention
- **Approach**: All JavaScript files will be renamed from `.js` to `.mjs`
- **Rationale**:
  - Explicit file extensions provide better clarity about module type
  - Avoids reliance on package.json "type" field
  - Ensures consistent behavior across different environments
  - Simplifies mixed-mode scenarios during transition
- **Implementation**:
  ```javascript
  // Old: my-module.js
  const { helper } = require('./helper');
  
  // New: my-module.mjs
  import { helper } from './helper.mjs';
  ```
- **Exception**: Test files will maintain `.js` extension for Jest compatibility

### Timeline Estimation
- Phase 1 (Jest Migration): 1-2 weeks
- Phase 2 (Module Conversion): 2-3 weeks
- Total: 3-5 weeks depending on complexity

#### Timeline Adjustment Factors
- **Codebase Size**: Add 1 week per 50k lines of code
- **Dependencies**: Add 2-3 days per major ESM-incompatible dependency
- **Integration Complexity**: Add 1-2 weeks if extensive browser API integration exists
- **Team Familiarity**: Reduce by 20% if team has prior ESM migration experience

#### Project-Specific Considerations
- Browser API integration complexity
- Third-party library ESM compatibility
- Test coverage adequacy
- Deployment pipeline modifications
- Browser compatibility requirements

### Testing Strategy
1. Unit Tests:
   - Convert to ES module syntax
   - Update import statements
   - Verify test coverage

2. Integration Tests:
   - End-to-end functionality
   - Browser compatibility
   - Service worker behavior

3. Performance Tests:
   - Bundle size comparison
   - Load time metrics
   - Memory usage analysis
