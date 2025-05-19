# Planning Summary: Migration Phase 5A and Manifest Updates

This document summarizes the planning process for identifying JavaScript files in the `template/` directory for ES module migration, assessing impacts on `manifest.json`, and drafting additions to `memory-bank/migration-mjs.md`.

## 1. Initial Task Overview

The core task was to:
- Review `memory-bank/migration-mjs.md`.
- Identify JavaScript files in `src/lib`, `src/main`, and `src/template` requiring migration to ES module syntax or conversion to `.mjs`.
- Assess impacts on the browser extension's `manifest.json` related to module usage.
- Update `memory-bank/migration-mjs.md` to document these findings, including any `manifest.json` considerations, and add a 'Phase 5A' to cover the migration of these identified files.

## 2. Information Gathering & Analysis

- **Reviewed `memory-bank/migration-mjs.md`**: Confirmed that most files in `src/lib` and `src/main` were already migrated.
- **Identified Target `template/` Files**: The following `.js` files in the `template/` directory were identified as primary candidates for migration:
    - `template/options-gremlins-bookmarklet-handler.js`
    - `template/prompt.js`
    - `template/content-scripts/gremlins-handler.js`
    - `template/popup/popup-init.js`
    - `template/popup/popup.js`
    - `template/gremlins.min.js` (initially considered, later clarified)
- **Reviewed `template/manifest.json`**: Key observations included:
    - Service worker (`background.js`) declaration and `type: "module"`.
    - Content script paths needing updates for both previously migrated `src/main/` files and the `template/` files.
    - `gremlins.min.js` listed in `web_accessible_resources`.
    - Popup HTML (`popup/popup.html`) and its associated scripts.

## 3. Clarifications

The following points were clarified:
1.  **`template/gremlins.min.js`**: Confirmed to be a third-party library and will **not** be converted to `.mjs`. Its entry in `web_accessible_resources` will remain unchanged unless its usage dictates otherwise (unlikely).
2.  **Manifest Paths for Migrated `src/main/` Files**: Confirmed that paths in `manifest.json` for files like `background.mjs`, `inject-value.mjs` should be root paths (e.g., `background.mjs`), implying a build step copies them to the extension's root.

## 4. Finalized Additions for `memory-bank/migration-mjs.md`

The following sections and items were planned for addition to `memory-bank/migration-mjs.md`, to be inserted after the existing 'Phase 5' and before 'Phase 6':

```markdown
### Phase 5A: Template and UI Script Migration (NEW)
- [ ] Convert `template/options-gremlins-bookmarklet-handler.js` → `template/options-gremlins-bookmarklet-handler.mjs`
- [ ] Convert `template/prompt.js` → `template/prompt.mjs`
- [ ] Convert `template/content-scripts/gremlins-handler.js` → `template/content-scripts/gremlins-handler.mjs`
- [ ] Convert `template/popup/popup-init.js` → `template/popup/popup-init.mjs`
  - [ ] Ensure `template/popup/popup.html` loads `popup-init.mjs` using `<script type="module">`
- [ ] Convert `template/popup/popup.js` → `template/popup/popup.mjs`
  - [ ] Ensure `template/popup/popup.html` loads `popup.js` (if it's a separate script loaded by the HTML) using `<script type="module">`
- [ ] Document `template/gremlins.min.js` as a third-party library that will not be converted. Ensure its usage remains compatible.

### Manifest.json Update Considerations (Related to Phase 5A and previous phases)
- **Service Worker:**
  - [ ] Update `background.service_worker` in `manifest.json` from `"background.js"` to `"background.mjs"`.
- **Content Scripts:**
  - [ ] Update `manifest.json` `content_scripts` array to use `.mjs` extensions and correct root paths for all relevant files:
    - Files from previous phases (from `src/main/`):
      - `inject-value.js` → `inject-value.mjs`
      - `paste.js` → `paste.mjs`
      - `options.js` → `options.mjs`
    - Files from new Phase 5A (from `template/`):
      - `prompt.js` → `prompt.mjs`
      - `options-gremlins-bookmarklet-handler.js` → `options-gremlins-bookmarklet-handler.mjs`
      - `content-scripts/gremlins-handler.js` → `content-scripts/gremlins-handler.mjs`
- **Popup HTML (`template/popup/popup.html`):**
  - [ ] Document the necessity to update `<script>` tags in `template/popup/popup.html` to use `type="module"` when loading `popup-init.mjs` and `popup.mjs`.
```

## 5. Next Steps (Post-Planning)
The next step is to switch to a suitable mode (e.g., "Code" mode) to implement the changes in `memory-bank/migration-mjs.md`.
