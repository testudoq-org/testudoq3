# Context Menu Fix: Ensuring Visibility of Menu Items

## Issue Analysis

The TestudoQ extension's context menu was experiencing inconsistent visibility for several key menu items:

- "Operational Mode" submenu
- "Help/Support" menu items
- Separators between menu sections

These items would sometimes be invisible when right-clicking on non-editable elements (e.g., page background), but visible when clicking on editable fields.

## Root Causes

1. **Duplicate Function Definition**
   - The `getVisibleContexts()` function was defined twice in `context-menu.mjs`
   - JavaScript hoisting caused the second definition to overwrite the first
   - Neither definition was being properly used throughout the menu creation process

2. **Missing Context Specifications**
   - Menu items weren't consistently given proper context specifications
   - The `ALL_CONTEXTS` array wasn't being properly applied

3. **Menu Builder Interaction**
   - Menu builders expected context specifications but were receiving inconsistent inputs
   - Default contexts in builders sometimes excluded non-editable elements

## Solution Implemented

1. **Corrected Function Usage**
   - Removed the duplicate `getVisibleContexts()` function
   - Enhanced the function with proper JSDoc documentation
   - Added explicit calls to `getVisibleContexts()` in all menu creation paths

2. **Consistent Context Application**
   - Updated `addOperationalSubMenu()` to use contexts from `getVisibleContexts('operational')`
   - Updated `addGenericMenus()` to use contexts from `getVisibleContexts('help')`
   - Added explicit context for separators using `getVisibleContexts('separator')`

3. **Logging Improvements**
   - Added detailed logging for context specification in menu creation
   - Made context list explicit in log messages for easier debugging

## Expected Results

With these changes, the Gremlins Attack and all other menu items should now consistently appear in all browser contexts:

- When right-clicking on page backgrounds
- When right-clicking on text selections
- When right-clicking on links
- When right-clicking on editable fields

## Additional Notes

The context menu system now properly uses the `ALL_CONTEXTS` array which includes:
- 'page'
- 'selection'
- 'link'
- 'editable'

This ensures that all menu items are visible across all right-click scenarios, improving the usability and consistency of the TestudoQ extension.
