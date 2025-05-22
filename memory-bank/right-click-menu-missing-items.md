# Missing Items in Chrome Context Menu (MV3 Extension)

## Problem

Several items (Separator, "Customize menus," and "Help/Support") are missing from the Chrome context menu in the MV3 extension. The main issue is that [`chrome-menu-builder.mjs`](src/lib/chrome-menu-builder.mjs) does not respect the contexts explicitly passed for separators, instead using hardcoded contexts. This makes the code in [`context-menu.mjs`](src/lib/context-menu.mjs) misleading and introduces brittleness.

## Current Implementation

In [`chrome-menu-builder.mjs`](src/lib/chrome-menu-builder.mjs), the `separator` function creates a separator menu item with hardcoded contexts:

```javascript
self.separator = function (parentMenu) {
  return chrome.contextMenus.create({
    id: parentMenu + Math.random(),
    type: 'separator',
    parentId: parentMenu,
    contexts: ['page', 'selection', 'link', 'editable'] // Hardcoded contexts
  });
};
```

This contrasts with the `menuItem` function, which correctly uses the contexts passed in the `value` parameter:

```javascript
self.menuItem = async function (title, parentMenu, clickHandler, value) {
  const useContexts = value && value.contexts ? value.contexts : contexts;
  // ...
  const menuConfig = {
    id,
    title,
    parentId: parentMenu,
    contexts: useContexts // Contexts from value parameter
  };
  // ...
};
```

In [`context-menu.mjs`](src/lib/context-menu.mjs), the `rebuildMenu` function adds a separator with explicit `ALL_CONTEXTS`:

```javascript
menuBuilder.separator(rootMenu, { contexts: ALL_CONTEXTS });
```

However, because the `separator` function in [`chrome-menu-builder.mjs`](src/lib/chrome-menu-builder.mjs) ignores this context and uses the hardcoded contexts, the separator may not appear in all desired contexts. The same applies to "Customize menus," and "Help/Support" menu items.

## Solution

Update the `separator` function in [`chrome-menu-builder.mjs`](src/lib/chrome-menu-builder.mjs) to accept and use context information passed from [`context-menu.mjs`](src/lib/context-menu.mjs), making it consistent with how other menu items are handled.

The updated `separator` function should look like this:

```javascript
self.separator = function (parentMenu, value) {
  const useContexts = value && value.contexts ? value.contexts : ['page', 'selection', 'link', 'editable'];
  return chrome.contextMenus.create({
    id: parentMenu + Math.random(),
    type: 'separator',
    parentId: parentMenu,
    contexts: useContexts // Use contexts from value parameter
  });
};
```

And the call to `menuBuilder.separator` in [`context-menu.mjs`](src/lib/context-menu.mjs) should be updated to:

```javascript
menuBuilder.separator(rootMenu, { contexts: ALL_CONTEXTS });
```

This change will ensure that the separator respects the contexts specified in [`context-menu.mjs`](src/lib/context-menu.mjs), resolving the issue of missing menu items.
