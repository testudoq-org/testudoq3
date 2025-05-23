# Current Architecture Overview (Post-MJS Migration)

This document outlines the current architecture of the Testudoq browser extension, focusing on changes and patterns adopted after the migration to ES Modules (`.mjs`) and alignment with Manifest V3 (MV3).

## ES Module Structure (`src/`)

The codebase under the `src/` directory is now entirely composed of ES modules using the `.mjs` file extension. This includes:
- **Core Libraries (`src/lib/`)**: Modules responsible for fundamental operations such as context menu creation ([`context-menu.mjs`](src/lib/context-menu.mjs:1)), browser-specific menu building ([`chrome-menu-builder.mjs`](src/lib/chrome-menu-builder.mjs:1), [`firefox-menu-builder.mjs`](src/lib/firefox-menu-builder.mjs:1)), configuration management, and request handling.
- **Main Scripts (`src/main/`)**: Entry points for different parts of the extension, like the background service worker ([`background.mjs`](src/main/background.mjs:1)) and options page logic.
- **Standard `import`/`export` syntax** is used throughout for inter-module dependencies.
- **Asynchronous operations** are primarily handled using `async/await`.

## Manifest V3 (MV3) Patterns

The extension adheres to MV3 principles:
- **Service Worker**: The background script ([`background.mjs`](src/main/background.mjs:1)) operates as a service worker, managing extension state and event handling.
- **Context Menu API**: The `chrome.contextMenus` API (or `browser.menus` for Firefox) is used for creating and managing right-click menu items.
    - The [`ContextMenu`](src/lib/context-menu.mjs:1) module orchestrates menu building.
    - Menu item creation is asynchronous, managed within the `rebuildMenu` flow.
    - The [`ChromeMenuBuilder`](src/lib/chrome-menu-builder.mjs:1) (and its Firefox counterpart) acts as a factory for creating menu elements, abstracting browser differences.

## Context Menu Implementation Details

- **Dynamic Menu Building**: The `rebuildMenu` function in [`context-menu.mjs`](src/lib/context-menu.mjs:1) is central to constructing the context menu. It dynamically builds the menu based on `standardConfig` and adds static footer items.
- **Static Footer**: A dedicated `addStaticFooter` function in [`context-menu.mjs`](src/lib/context-menu.mjs:1) is responsible for adding a consistent set of footer items:
    - A separator
    - "Customize menus" (linking to options)
    - "Help/Support" (linking to a hardcoded help URL)
    - These items use predefined ID constants (`FOOTER_SEPARATOR_ID`, `FOOTER_CUSTOMIZE_ID`, `FOOTER_HELP_ID`) and are set to appear in `ALL_CONTEXTS`.
- **Asynchronous Flow**: The entire menu creation process, from clearing old items to building new ones, is asynchronous, leveraging `async/await`.

## Removed Features / Obsolete Patterns

During the migration and subsequent refactoring, some features and patterns became obsolete:
- **`addGenericMenus` function**: This function, previously responsible for adding operational mode submenus and other generic items, was removed. Its responsibilities were partly absorbed by `addStaticFooter` and partly deprecated (e.g., the "Operational mode" submenu is no longer present).
- **Erroneous `.slice()` in menu processing**: An incorrect use of `.slice()` on the result of `processMenuObject` (which doesn't return an array) was removed, fixing a bug that prevented static items from appearing.
- **`cacheMenuValue`**: The specific caching strategy tied to this function was revised.
- **Helper functions like `createRebuildLogger`, `clearExistingMenus`**: These were removed as part of simplifying the `rebuildMenu` logic.
- **Click handler type switching for operational modes (`turnOnPasting`, `turnOffPasting`, `turnOnCopy`)**: These functions and the associated `handlerType` state for "Operational mode" were removed as this submenu is no longer part of the context menu.

## Technical Debt / Areas for Future Review

- **Placeholder `loadAdditionalMenus`**: The [`context-menu.mjs`](src/lib/context-menu.mjs:1) file contains extensive JSDoc comments and placeholder notes regarding a `loadAdditionalMenus` function. This functionality (loading menus from sources other than `standardConfig`) is not currently implemented. If required in the future, this section would need a full reimplementation.
- **Potentially Unused Code**: With the removal of the "Operational mode" submenu, related click handlers (`injectValueRequestHandler`, `pasteRequestHandler`, `copyRequestHandler`) and their supporting infrastructure in [`context-menu.mjs`](src/lib/context-menu.mjs:1) might be partially or fully unused. A review is needed to determine if these can be simplified or removed.
- **Configuration Loading**: The mechanism for loading `config.json` and integrating it into `standardConfig` should be clearly documented if it's a core part of dynamic menu generation.

This document provides a snapshot of the current architecture. It should be updated as the codebase evolves.
