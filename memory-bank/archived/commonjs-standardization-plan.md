# CommonJS Standardization Plan

This document outlines the steps to standardize the TestudoQ project to use CommonJS modules exclusively, updating documentation and configuration files accordingly.

## Plan Steps:

1.  **Update `CONTRIBUTING.md`**:
    *   Add a new "Module Format Standards" section detailing CommonJS usage (`require`/`module.exports`).
    *   Content to add:
        ```markdown
        ## Module Format Standards
        TestudoQ consistently uses CommonJS module format (require/module.exports) throughout the codebase. When creating new files or modifying existing ones:

        - Use `const module = require('../path/to/module')` for imports
        - Use `module.exports = ...` for exporting functionality
        - Avoid using ES6 module syntax (import/export)

        This ensures compatibility with the existing codebase and testing infrastructure.
        ```

2.  **Update `.github/copilot-instructions.md`**:
    *   Modify the "Coding Guidelines" section:
        *   Change `- Use ES6+ JavaScript features` to `- Use ES6+ JavaScript features (with CommonJS modules)`.
        *   Add the new guideline: `- **Use CommonJS module format (require/module.exports) consistently**`.

3.  **Update `memory-bank/techContext.md`**:
    *   Modify the "Technologies" section:
        *   Change `- JavaScript (ES6+)` to `- JavaScript (ES6+ features with CommonJS module system)`.

4.  **Update `.eslintrc.json`**:
    *   Change `"sourceType": "module"` to `"sourceType": "script"` to reflect the CommonJS environment.
    *   Add rules to explicitly disallow ES module syntax (example rules provided below, may need adjustment based on installed ESLint plugins):
        ```json
        "rules": {
          // ... existing rules ...
          "import/no-commonjs": "off",
          "import/no-nodejs-modules": "off",
          "import/no-unresolved": "off",
          "node/no-unsupported-features/es-syntax": ["error", {"version": ">=8.0.0", "ignores": ["modules"]}]
        }
        ```

## Visual Plan (Mermaid Flowchart):

```mermaid
graph TD
    A[Start: Standardize to CommonJS] --> B{Gather Info};
    B --> C[Analyze Files: CONTRIBUTING.md, copilot-instructions.md, techContext.md, webpack.config.js, package.json, .eslintrc.json, src/*.js];
    C --> D{Identify Changes};
    D --> E1[Plan: Update CONTRIBUTING.md];
    D --> E2[Plan: Update .github/copilot-instructions.md];
    D --> E3[Plan: Update memory-bank/techContext.md];
    D --> E4[Plan: Update .eslintrc.json];
    E1 & E2 & E3 & E4 --> F{Review Plan with User};
    F -- Approve --> G[Confirm Plan];
    F -- Revise --> D;
    G --> H[End Planning Phase];
