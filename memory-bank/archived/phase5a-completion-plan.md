# Plan to Complete ES Module Migration for Template Files

**Phase 1: Cleanup Duplicate Files**
*   The core issue is the presence of redundant `.js` files alongside their migrated `.mjs` counterparts in the `template/` directory.
*   **Action:** Delete the following `.js` files:
    *   `template/prompt.js`
    *   `template/options-gremlins-bookmarklet-handler.js`
    *   `template/popup/popup.js`
    *   `template/popup/popup-init.js`
    *   `template/content-scripts/gremlins-handler.js`

**Phase 2: Update and Verify Build Process**
*   The build process needs to correctly handle and output `.mjs` files from the `template/` directory. The primary configuration for this is likely in `webpack.config.mjs`.
*   **Actions:**
    1.  **Review `webpack.config.mjs`:** Analyze how files from the `template/` directory (especially scripts) are currently being processed and copied to the build output directory (e.g., `pack/`).
    2.  **Modify `webpack.config.mjs`:**
        *   Ensure that Webpack is configured to recognize and correctly process `.mjs` files within the `template/` directory structure.
        *   Ensure that these `.mjs` files are copied or bundled into the output directory maintaining their `.mjs` extension.
    3.  **Verify `manifest.json` and HTML Files:** Double-check that `template/manifest.json`, `template/popup/popup.html`, and `template/options.html` correctly reference the `.mjs` versions of their respective scripts.

**Phase 3: Final Verification and Testing**
*   **Actions:**
    1.  **Perform a Full Build:** After the changes, execute the project's build command.
    2.  **Inspect Build Output:** Check the build output directory (e.g., `pack/`) to confirm that the template scripts (e.g., `prompt.mjs`, `popup.mjs`, etc.) are present with the `.mjs` extension and that their `.js` counterparts are absent.
    3.  **Comprehensive Testing:** Conduct thorough testing of the extension in the browser to ensure all functionalities related to these scripts are working correctly.

**Visual Plan:**

```mermaid
graph TD
    A[Start: Address ES Module Issues] --> B{Identify Tasks};
    B -- Task 1: Duplicate .js files --> C[Phase 1: Cleanup Files];
    C --> C1[Action: Delete template/prompt.js];
    C --> C2[Action: Delete template/options-gremlins-bookmarklet-handler.js];
    C --> C3[Action: Delete template/popup/popup.js];
    C --> C4[Action: Delete template/popup/popup-init.js];
    C --> C5[Action: Delete template/content-scripts/gremlins-handler.js];
    B -- Task 2: Build process uses .js --> D[Phase 2: Update Build Process];
    D --> D1[Action: Review webpack.config.mjs];
    D1 --> D2[Action: Modify webpack.config.mjs for template .mjs files];
    D2 --> D3[Action: Verify manifest.json & HTML script references];
    C5 --> E{Files Cleaned?};
    D3 --> F{Build Process Updated?};
    E -- Yes --> G[Proceed to Verification];
    F -- Yes --> G;
    G --> H[Phase 3: Verification & Testing];
    H --> H1[Action: Perform Full Build];
    H1 --> H2[Action: Inspect Build Output for .mjs files];
    H2 --> H3[Action: User to Conduct Comprehensive Extension Test];
    H3 --> I[End: Migration Tasks Completed];
