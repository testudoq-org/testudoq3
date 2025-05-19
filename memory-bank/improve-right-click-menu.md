# Improving the Right-Click Menu

The built MV3 `.mjs` browser extension never executed the `loadAdditionalMenus` call, so the “Operational mode” and “Help/Support” items were missing. This section outlines the refactoring to resolve that issue and simplify the menu logic, especially for orchestrator mode.

## Issues Identified

1. **`loadAdditionalMenus` never called**  
   `getOptionsAsync()` does not supply an `additionalMenus` array in MV3, so conditional loading of extra menus never occurred.

2. **Unnecessary grouping**  
   Top-level “context”, “handler” and “menus” groupings add indirection without benefit. Remove these values,

3. **Paste support separation**  
   Paste, copy and inject handlers were split between separate functions instead of unified menu integration.

## Refactoring Steps

```mermaid
flowchart TD
  A[init()] --> B[loadState()]
  B --> C[getOptionsAsync()]
  C --> D[rebuildMenu()]
  D --> E[removeAll()]
  D --> F[rootMenu("Testudoq")]
  D --> G[processMenuObject(standardConfig)]
  D --> H[addGenericMenusInline]
  D --> I[saveState()]
```

1. **Remove**  
   - `loadAdditionalMenus` function and all references.  
   - `options.additionalMenus` checks in `rebuildMenu`.  

2. **Inline `addGenericMenus`**  
   - Copy its body directly into `rebuildMenu` after `processMenuObject(...)`.

3. **Merge menus**  
   - Build “Operational mode” and “Help/Support” choices unconditionally under the root menu rather than nested.

4. **Preserve handlers**  
   - Keep `turnOnPasting`, `turnOffPasting`, `turnOnCopy`, and their `menuBuilder.choice` entries intact to ensure paste/copy/inject modes work without regressions.

## Orchestrator Mode Adaptation

When using orchestrator mode, the same simplified menu structure applies. Ensure that:

- `menuBuilder` implementation provided by the orchestrator still supports `rootMenu`, `choice`, `separator` and `menuItem`.
- The inline “Operational mode” section invokes orchestrator-specific callbacks if needed.
- Paste/copy handlers route commands via the orchestrator’s command dispatch rather than direct browser calls.

With these changes, the context menu will always include the generic menus and maintain right-click paste functionality, while simplifying the code paths and supporting orchestrator mode integration.

## Missing Separator and Menu Items Investigation

### 1. Issue Investigation
- Initial symptom: separator + “Customise menus” / “Help/Support” missing from right-click menu  
- Files involved:  
  - [`context-menu.mjs`](src/lib/context-menu.mjs)  
  - [`chrome-menu-builder.mjs`](src/lib/chrome-menu-builder.mjs)  
  - [`firefox-menu-builder.mjs`](src/lib/firefox-menu-builder.mjs)  
- Investigation process and findings:  
  1. Reviewed context registration in `context-menu`, discovered only `editable` context passed to builders.  
  2. Verified via local UI testing that right-click outside editable fields omitted separator and items.  
  3. Logged builder calls; observed no invocation of `menuBuilder.separator()` or `menuBuilder.choice()` for custom items in non-editable context.  

### 2. Root Cause Analysis
- Builder files filter menu items by context: only contexts including `'editable'` are allowed.  
- In each builder:  
  - In [`chrome-menu-builder.mjs`](src/lib/chrome-menu-builder.mjs): context check at definition of `separator` and extra menu block using `contexts: ['editable']`.  
  - In [`firefox-menu-builder.mjs`](src/lib/firefox-menu-builder.mjs): similar filter in `createMenu()` before adding separators.  
- Impact: right-click on page background or non-form elements skipped adding separator and “Customise menus” / “Help/Support”.  

### 3. Solution
- Proposed fix: broaden context array passed to menus to include non-editable contexts (e.g. `contexts: ['editable','all']`).  
- Expected impact:  
  - Separator and additional items display on all target contexts.  
  - Restores consistent display of “Customise menus” / “Help/Support”.  
- Implementation approach:  
  1. Update context arrays in each builder file.  
  2. Add unit tests in [`test/context-menu.spec.mjs`](test/context-menu.spec.mjs) to assert visibility in non-editable contexts.  
  3. Deploy and verify in both Chrome and Firefox extension builds.
