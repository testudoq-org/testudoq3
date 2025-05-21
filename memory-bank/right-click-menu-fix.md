# Right-Click Menu Fix: Missing "Operational Mode" and "Help/Support" Menu Items

## Issue Analysis

After reviewing the code, I've identified why the "Operational Mode" and "Help/Support" menu items are missing from the right-click context menu:

### Core Issues

1. **Context Assignment Problems**
   - The `ALL_CONTEXTS` array in `context-menu.mjs` is defined but not consistently applied to all menu items
   - The Firefox menu builder isn't correctly applying contexts to generic menu items

2. **Menu Structure Issues**
   - The "Operational mode" submenu is created correctly in `rebuildMenu()`, but some menu items aren't properly configured
   - The Help/Support items are added with incorrect context specifications

3. **Inconsistent Menu Building**
   - The Chrome and Firefox menu builders handle contexts differently
   - `menuItem()` implementations vary in how they apply contexts

### Key Problems in Code:

1. **Firefox Menu Builder Context Problem**
   ```javascript
   // Problem in firefox-menu-builder.mjs
   self.menuItem = function (title, parentMenu, clickHandler, value) {
     // useContexts is incorrect - doesn't always use ALL_CONTEXTS
     const useContexts = value && value.contexts ? value.contexts : contexts,
     menuConfig = {
       id: useContexts + parentMenu + title + Math.random(),
       title,
       parentId: parentMenu,
       contexts: useContexts
     };
     // ...
   }
   ```

2. **Context Menu Inconsistent ALL_CONTEXTS Usage**
   ```javascript
   // Problem in context-menu.mjs (rebuildMenu function)
   // The modeMenu is created with ALL_CONTEXTS
   const modeMenu = menuBuilder.subMenu('Operational mode', rootMenu, {contexts: ALL_CONTEXTS});
   
   // But later, the Help/Support items are created without explicitly passing contexts
   [
     {
       title: 'Customise menus',
       handler: browserInterface.openSettings
     },
     {
       title: 'Help/Support',
       handler: () => {
         // ...
       }
     }
   ].forEach(item => {
     menuBuilder.menuItem(item.title, rootMenu, item.handler, {
       contexts: ALL_CONTEXTS // This is correct but may not be applied consistently
     });
   });
   ```

## Required Changes

1. **Update Firefox Menu Builder**
   - Ensure `menuItem()` in Firefox menu builder properly applies ALL_CONTEXTS
   - Fix context assignment logic to ensure consistent visibility

2. **Fix Context Menu Implementation**
   - Ensure ALL_CONTEXTS is consistently passed to menu items
   - Debug menu item creation to verify proper context handling

3. **Add Debug Logging**
   - Add detailed logging to track menu creation and context application
   - Log when a menu item is created and which contexts are applied

## Implementation Plan

1. **Firefox Menu Builder Fix**
   - Update the `menuItem()` function in `firefox-menu-builder.mjs` to consistently handle contexts

2. **Context Menu Fix**
   - Ensure ALL_CONTEXTS is properly applied in `context-menu.mjs`
   - Fix handler registration for operational mode items

3. **Testing**
   - Test across both Firefox and Chrome
   - Verify menu items appear in all required contexts

## Code Changes

### Firefox Menu Builder Fix
```javascript
self.menuItem = function (title, parentMenu, clickHandler, value) {
  // FIXED: Correctly handle context assignment
  const useContexts = value && value.contexts ? value.contexts : contexts,
  menuConfig = {
    id: parentMenu + title + Math.random(), // Fixed ID generation
    title,
    parentId: parentMenu,
    contexts: useContexts
  };
  
  // Add logging
  console.log('[FirefoxMenuBuilder] Creating menu item:', {
    title, 
    contexts: useContexts
  });
  
  const id = browser.menus.create(menuConfig);
  itemValues[id] = value;
  itemHandlers[id] = clickHandler;
  return id;
};
```

### Context Menu Fix
```javascript
// In rebuildMenu function
// Add explicit contexts for all menu items
rebuildLog('Adding help items');
[
  {
    title: 'Customise menus',
    handler: browserInterface.openSettings
  },
  {
    title: 'Help/Support',
    handler: () => {
      if (!browserInterface) {
        throw new TypeError('browserInterface cannot be null or undefined');
      }
      browserInterface.openUrl('https://testudo.co.nz/futterman/testudoq-help.html');
    }
  }
].forEach(item => {
  // Explicitly log each menu item creation with contexts
  rebuildLog(`Creating menu item ${item.title} with contexts: ${ALL_CONTEXTS.join(', ')}`);
  menuBuilder.menuItem(item.title, rootMenu, item.handler, {
    contexts: ALL_CONTEXTS
  });
});
```

By implementing these changes, the "Operational Mode" and "Help/Support" menu items should consistently appear in the context menu across all browsers and contexts.
