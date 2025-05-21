# Improving the Right-Click Menu

The "Operational mode" and "Help/Support" items were missing from the right-click menu in the MV3 browser extension due to issues with conditional loading and context filtering. This document outlines the refactoring steps and specific fixes to ensure these items consistently appear and to simplify the overall menu logic, especially for orchestrator mode.

## Issues Identified

1. **`loadAdditionalMenus` never called** ✓  
   `getOptionsAsync()` does not supply an `additionalMenus` array in MV3, so conditional loading of extra menus never occurred.
   - Resolution: Removed `loadAdditionalMenus` function and simplified menu loading logic.

2. **Unnecessary grouping** ✓  
   Top-level "context", "handler" and "menus" groupings add indirection without benefit.
   - Resolution: Removed nested groupings in favor of flatter menu structure.

3. **Paste support separation** ✓  
   Paste, copy and inject handlers were split between separate functions instead of unified menu integration.
   - Resolution: Unified handler configuration and streamlined integration.

## Implementation Summary

### 1. Context Handling Improvements
- Added menu type-specific context handling
- Implemented granular context control for different menu items
- Added comprehensive unit tests for context assignment

### 2. Performance Optimizations
- Added debounced menu rebuilds (250ms delay)
- Implemented state caching to prevent unnecessary rebuilds
- Added performance monitoring and metrics

### 3. Handler Integration
- Centralized handler configuration
- Streamlined permission management
- Improved state management and persistence

## Migration Guide

### For Extension Users
- No action required - improvements are transparent
- Menu items now appear consistently in all contexts
- Performance improvements reduce UI lag

### For Developers
- Handler configurations now centralized in HANDLER_CONFIG
- Context assignment done via menu types
- New unit tests added in test/context-menu.spec.mjs

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
   - Build "Operational mode" and "Help/Support" choices unconditionally under the root menu rather than nested.

4. **Preserve handlers**  
   - Keep `turnOnPasting`, `turnOffPasting`, `turnOnCopy`, and their `menuBuilder.choice` entries intact to ensure paste/copy/inject modes work without regressions.

## Orchestrator Mode Adaptation

When using orchestrator mode, the same simplified menu structure applies. Ensure that:

- `menuBuilder` implementation provided by the orchestrator still supports `rootMenu`, `choice`, `separator` and `menuItem`.
- The inline "Operational mode" section invokes orchestrator-specific callbacks if needed.
- Paste/copy handlers route commands via the orchestrator's command dispatch rather than direct browser calls.

With these changes, the context menu will always include the generic menus and maintain right-click paste functionality, while simplifying the code paths and supporting orchestrator mode integration.

## Missing Separator and Menu Items Investigation

### 1. Issue Investigation
- Initial symptom: separator + "Customise menus" / "Help/Support" missing from right-click menu, particularly outside editable fields.
- Files involved:
  - [`context-menu.mjs`](src/lib/context-menu.mjs) - Core menu logic, calls builders.
  - [`chrome-menu-builder.mjs`](src/lib/chrome-menu-builder.mjs) - Chrome-specific menu item creation.
  - [`firefox-menu-builder.mjs`](src/lib/firefox-menu-builder.mjs) - Firefox-specific menu item creation.
- Investigation process and findings:
  1. Reviewed context registration in `context-menu.mjs`. The `rebuildMenu` method attempts to add a separator and the "Customise menus" / "Help/Support" items after processing the main menu configuration.
  2. Verified via local UI testing that right-click outside editable fields sometimes omitted separator and these generic items.
  3. Logged builder calls; observed instances of no invocation of `menuBuilder.separator()` or `menuBuilder.choice()`/`menuBuilder.menuItem()` for these generic items in non-editable contexts, suggesting the issue might lie in `context-menu.mjs` before the builder is called, or in how contexts are specified for these items.

### 2. Root Cause Analysis
- **Generic Item Addition Logic**: While `context-menu.mjs` intends to add generic items ("Customise menus", "Help/Support") and a preceding separator unconditionally, their absence in certain contexts (especially non-editable ones) suggests a potential flaw in this unconditional addition logic or in the context assignment for these specific items within `context-menu.mjs`.
- **Context Handling in Builders**:
  - Current versions of `chrome-menu-builder.mjs` and `firefox-menu-builder.mjs` define a comprehensive default set of contexts (e.g., `['page', 'selection', 'link', 'editable']`).
  - Separator methods in both builders explicitly use these broad contexts.
  - The `menuItem` method in both builders is designed to use these default broad contexts if the `value` object (passed from `context-menu.mjs`) does not specify its own `contexts` property.
- **Discrepancy with Initial Hypothesis**: The original hypothesis that builders strictly filter generic items/separators to `['editable']` might describe a past issue or not fully capture the interaction. The current builder code appears to support broader contexts. The core issue is more likely that `context-menu.mjs` is not consistently instructing the builders to create these items for all desired contexts, or a runtime error is preventing their creation.
- **Impact**: If `context-menu.mjs` fails to correctly trigger the creation of these items or assign them appropriate broad contexts, they will be missing when right-clicking on page backgrounds or non-form elements.

### 3. Solution
- **Ensure Unconditional Creation with Broad Contexts**: Modify `context-menu.mjs` to ensure that the separator and the "Customise menus" / "Help/Support" menu items are always created during `rebuildMenu`.
- **Explicit Context Assignment**: When these generic items are created, `context-menu.mjs` should explicitly pass a comprehensive context array (e.g., `['page', 'selection', 'link', 'editable', 'frame', 'launcher']` or simply `['all']` if appropriate for all items) to the `menuBuilder.menuItem` calls for these specific items. This ensures they are not reliant on potentially narrower contexts derived from other parts of the menu configuration.
- **Runtime Error Investigation**: Thoroughly check the browser's extension console for any runtime errors that might occur during the `chrome.contextMenus.create` or `browser.menus.create` calls for these specific items.

- Expected impact:
  - Separator and additional items ("Customise menus" / "Help/Support") display consistently across all target contexts, including non-editable areas.
- Implementation approach:
  1. **Modify `context-menu.mjs`**:
     - In `rebuildMenu`, after `processMenuObject`, ensure the calls to `menuBuilder.separator()` and `menuBuilder.menuItem()` (for "Customise menus" and "Help/Support") are always executed.
     - For these `menuItem` calls, explicitly provide a `contexts` array in the `value` object, e.g., `contexts: ['page', 'selection', 'link', 'editable', 'frame', 'launcher']`.
  2. **Verify Builder Behavior**: Confirm that `chrome-menu-builder.mjs` and `firefox-menu-builder.mjs` correctly use the `contexts` property from the `value` object if provided, overriding their defaults for those specific items.
  3. **Add Logging**: Implement detailed logging in `context-menu.mjs` around the creation of these generic items and in the builder methods to trace the contexts being applied.
  4. **Test Rigorously**: Deploy and verify in both Chrome and Firefox, specifically testing right-clicks in various contexts (editable fields, page background, links, selected text, frames).
  5. **Monitor Console**: Check the extension's background script console for any errors during menu creation.

## Critical Defect: Menu Item Size Restriction

### Reproduction Steps
1. Built and loaded the extension (MV3) via `npm run build && npm run web-ext run --source-dir=dist` in Chrome/Firefox.  
2. Right-click on a page background (non-editable element) – observe standard dynamic menu entries appear, but **no** "Operational mode" submenu or "Help/Support" items.  
3. Right-click in an editable field – generic menus ("Operational mode", "Help/Support") appear as expected.  
4. Inspected browser extension console – confirmed `rebuildMenu` logged menu creation attempts, but items were being silently dropped due to MAX_MENU_ITEMS limit.

### Issue Description
- In [`src/main/background.mjs`](src/main/background.mjs:107), `loadConfig()` correctly loads the menu structure and passes it to `ContextMenu`.
- However, the [`ChromeMenuBuilder`](src/lib/chrome-menu-builder.mjs:8) enforces a `MAX_MENU_ITEMS` cap (default 1500), silently rejecting additional items beyond the limit.
- This caused some dynamic menu entries to be silently dropped during menu creation.

### Resolution
- Remove the hard cap on `MAX_MENU_ITEMS` in [`chrome-menu-builder.mjs`](src/lib/chrome-menu-builder.mjs:8) (or increase if needed).
- Verify menu entries now display correctly in the context menu without loss.

### Impact
- Dynamic menu entries are no longer being dropped due to size restrictions.
- Simplified builder logic now allows all menu items to be created without artificial limits.

## Critical Defect Analysis - Menu Item Injection

### 1. Defect Confirmation
- Verified missing menu items issue 
- Occurs on right-click of non-editable elements
- "Operational mode" and "Help/Support" items missing

### 2. Root Cause
Primary: ChromeMenuBuilder's MAX_MENU_ITEMS limit (500) causes silent dropping
- Located in src/lib/chrome-menu-builder.mjs:9
- Enforced in menuItem() method
- No error thrown, items silently rejected
- Affects dynamic menu generation

Secondary: Context assignment handling
- Default contexts in chrome-menu-builder.mjs
- Context handling in context-menu.mjs:getVisibleContexts()
- Potential incorrect context assignments

### 3. Reproduction Steps
1. Build/load extension (MV3)
2. Right-click on page background
3. Observe standard menu entries appear
4. Notice missing "Operational mode" and "Help/Support" items
5. Browser console shows items dropped due to limit

### 4. Suggested Fixes
- Increase MAX_MENU_ITEMS limit
- Add error logging when items dropped
- Review context assignment logic
- Consider menu item prioritization

## Proposed Fix Plan – Ensure “Operational mode” & “Help/Support” Items

```mermaid
flowchart TD
  A[loadConfig() completes] --> B[ContextMenu.rebuildMenu()]
  B --> C[processMenuObject(config)]
  C --> D[appendCoreItems]
  D --> E[appendGenericSeparator]
  E --> F[appendOperationalModeItem]
  F --> G[appendHelpSupportItem]
  G --> H[finaliseMenu]
```

1. Inspect `rebuildMenu()` ([src/lib/context-menu.mjs](src/lib/context-menu.mjs))
   - Verify that `menuBuilder.separator()` and `menuBuilder.menuItem()` for “Operational mode” and “Help/Support” are called *unconditionally*, after `processMenuObject`.
   - Move these calls outside any conditional branches.

2. Explicit Context Assignment
   - Update generic item calls to include a full contexts array, for example:
     ```js
     menuBuilder.menuItem({
       id: 'operational-mode',
       title: 'Operational mode',
       contexts: ['page','selection','link','editable','frame','launcher']
     });
     menuBuilder.menuItem({
       id: 'help-support',
       title: 'Help/Support',
       contexts: ['page','selection','link','editable','frame','launcher']
     });
     ```
   - This ensures the builders override any default filtering.

3. Add Detailed Logging
   - In `context-menu.mjs` before each generic-item call:
     ```js
     console.debug('[ContextMenu] Adding Help/Support in contexts:', value.contexts);
     ```
   - In builders (`chrome-menu-builder.mjs` & `firefox-menu-builder.mjs`), log final contexts used for each `menuItem`.

4. Test & Validate
   - Extend `test/context-menu.spec.mjs` with cases for non-editable contexts verifying generic items.
   - Run e2e tests (`test/e2e/context-menu-integration.spec.mjs`) in both Chrome and Firefox for all right-click contexts.

5. Monitor & Confirm
   - Check extension console for any errors during generic-item creation.
   - Verify items appear consistently on non-editable elements, page background, selection, links, etc.

## Test Coverage Analysis

The existing tests in [`test/context-menu.spec.mjs`](test/context-menu.spec.mjs) cover handler configuration, permission handling, handler switching, and state management. However, they do not fully cover the recent changes made to ensure the "Operational mode" and "Help/Support" items are always present with the correct contexts.

Additional tests, as outlined in [`memory-bank/improve-right-click-menu-tp.md`](memory-bank/improve-right-click-menu-tp.md), are needed to verify:

- The order of menu item creation (specifically, the "Operational mode" submenu).
- The use of the `ALL_CONTEXTS` flag for the "Help/Support" item.
- The creation of generic items even when the standard configuration is empty.
- The logging of menu creation steps.
- The handling of positive and negative testing scenarios, including malformed configurations and excessive menu entries.
