# Test Plan

## Popup UI Testing (Fixed)
### Gremlins Attack Launch
1. Open extension popup
2. Configure attack settings:
   - Select species (clicker, toucher, etc.)
   - Select mogwais
   - Choose strategy
   - Set duration
3. Click "Start Gremlins"
4. Verify:
   - Gremlins.js loads successfully
   - Attack starts as configured
   - Duration timer works
   - Attack stops automatically
   - UI updates properly

### Error Handling
1. Test network issues:
   - Disable network to test gremlins.js loading
   - Verify error message shown
2. Test invalid configurations:
   - No species selected
   - Invalid duration
   - Missing parameters
3. Verify cleanup:
   - After failed attack
   - After successful attack
   - On page navigation

## Content Script Integration (Fixed)
1. Verify script loading order:
   - Check console logs
   - Confirm no module errors
   - Validate initialization sequence
2. Test message passing:
   - Between popup and content scripts
   - Between content scripts and background
   - Error propagation
3. Check state management:
   - Attack state tracking
   - Configuration persistence
   - Cleanup on tab close

## Context Menu Integration (Pending)

This section outlines the checks and implementation details for the context menu integration, ensuring compatibility with the ES6 module approach.

### Implementation Checks

1.  **Service Worker Registration (`background.mjs`)**
    *   Confirm `manifest.json` uses `"background": { "service_worker": "background.mjs", "type": "module" }`.
    *   Verify `chrome.runtime.onInstalled` (or `onStartup`) is listening at the top level.
    *   Ensure `await chrome.contextMenus.removeAll()` runs before menu creation.
2.  **Async Configuration Load (`config.json`)**
    *   Use `await fetch(chrome.runtime.getURL('config.json')).then(r => r.json())`.
    *   Guard with `try...catch` and log via `console.error`.
3.  **Menu Object Processing (`process-menu-object.mjs`)**
    *   Ensure ES module import: `import { buildMenuItems } from './process-menu-object.mjs';`
    *   Validate output is an array of `{ id, title, contexts, parentId?, documentUrlPatterns? }`.
4.  **Context Menu Creation (`chrome-menu-builder.mjs` / `context-menu.mjs`)**
    *   Loop through processed items and call `await chrome.contextMenus.create(item);`.
    *   Check `contexts` and `documentUrlPatterns` match config.
    *   For Firefox, mirror logic in `firefox-menu-builder.js`.
5.  **Global Click Listener (`background.mjs`)**
    *   At the top level, outside async callbacks: `chrome.contextMenus.onClicked.addListener((info, tab) => { ... });`
    *   Avoid registering inside `onInstalled`.
6.  **Click Dispatch & Handler Invocation**
    *   Right-click in various contexts (`page`, `selection`, `link`, `image`).
    *   Select a menu item; verify `info.menuItemId` matches config.
    *   Dispatch to `handleGremlinsAttack(info, tab)` in `gremlins-attack-handler.mjs`.
    *   Confirm `chrome.scripting.executeScript({ target: { tabId: tab.id }, files: [...] })`.
7.  **Visibility & Permissions**
    *   Test `documentUrlPatterns` filtering.
    *   Ensure `"contextMenus"` and `"scripting"` are in `permissions`.
    *   Verify host permissions (e.g., `"<all_urls>"`) for script injection.

### Config.json Accessibility

1.  **File Location Verification**
    *   Confirm `config.json` exists at the correct path relative to the extension root.
    *   Verify file permissions allow reading by the extension.
    *   Test with `chrome.runtime.getURL('config.json')` in the browser console.
2.  **Format & Structure Validation**
    *   Validate JSON syntax with a linter.
    *   Confirm required fields exist: menu structure, IDs, handler mappings.
    *   Check for encoding issues (UTF-8 expected).
3.  **Web Accessible Resources**
    *   Verify `manifest.json` includes:
        ```json
        "web_accessible_resources": [{
          "resources": ["config.json"],
          "matches": ["<all_urls>"]
        }]
        ```
    *   Test access via `fetch(chrome.runtime.getURL('config.json'))`.

### Service Worker Event Handling

1.  **Lifecycle Events**
    *   Test menu creation on each lifecycle event:
        *   `chrome.runtime.onInstalled`
        *   `chrome.runtime.onStartup`
        *   After service worker idle timeout (typically 30 seconds).
    *   Verify click handler persistence across service worker restarts.
2.  **Event Registration Timing**
    *   Ensure `onClicked` listener is registered at the top-level scope.
    *   Confirm menu creation completes before handling clicks.
    *   Test race conditions with rapid browser startup and immediate context menu usage.
3.  **Persistent State Management**
    *   Use `chrome.storage.local` for any state that must persist between service worker activations.
    *   Test with service worker termination/restart scenarios.
    *   Verify state is properly restored when handling menu clicks.

### Debugging Tools & Techniques

1.  **Service Worker Inspection**
    *   Use `chrome://extensions` → Extension → "Service Worker" link.
    *   Monitor console logs for errors during startup and menu operations.
    *   Test with "Update Service Worker" button to simulate reinstallation.
2.  **Menu Creation Verification**
    *   Add logging to each step of the menu creation process:
        ```js
        console.log('Config loaded:', config);
        console.log('Menu items processed:', menuItems);
        console.log('Menu item created:', itemId);
        ```
    *   Verify each menu ID creation attempt.
3.  **Extension State Debugging**
    *   Use Storage API Explorer in DevTools.
    *   Examine active listeners via console in service worker.
    *   Validate extension context and permissions.

### Manifest V3 & ES Module Considerations

1.  **`manifest.json` Checks**
    *   `"manifest_version": 3`
    *   `"background"` → `"type": "module"`
    *   Required permissions:
        *   `"contextMenus"`
        *   `"scripting"`
        *   Host patterns used by gremlins attack
2.  **Module Syntax**
    *   No `require()`, only `import…from`.
    *   Correct relative paths (e.g., `'../lib/…'`).
    *   For JSON: either dynamic `fetch()` or
        ```js
        import config from '../config.json' assert { type: 'json' };
        ```
3.  **Service Worker Lifecycle**
    *   Test under: install, update, disable/re-enable, browser restart.
    *   Menus must recreate on each `onInstalled`/`onStartup`.
    *   Avoid persistent globals; rely on parameters or `chrome.storage`.
4.  **Async & Error Handling**
    *   Wrap fetch, create, scripting calls in `try…catch`.
    *   Use `async/await` consistently.
    *   Log errors via `console.error`—viewable in DevTools under Service Worker.
5.  **Race Conditions**
    *   Ensure config load completes before `create()` loop.
    *   Sequence menu removal → config load → item creation.

### Configuration Flow

1.  Menu selection to attack launch
2.  Parameter passing
3.  State management
4.  UI feedback

### Error Cases

1.  Invalid context
2.  Missing permissions
3.  Configuration errors
4.  Runtime failures

#### Config Loading Failures

*   Missing `config.json` file
*   Malformed JSON (syntax errors)
*   Missing required properties in config
*   Network errors during fetch
*   Path resolution errors

#### Permission Issues

*   Missing `"contextMenus"` permission
*   Missing `"scripting"` permission
*   Missing host permissions for target pages
*   User-denied optional permissions

#### Module Import Failures

*   Incorrect paths in import statements
*   Missing `.mjs` extensions where required
*   Circular dependencies
*   Legacy CommonJS syntax in converted modules

#### Runtime Execution Errors

*   Context menu handler exceptions
*   Script injection failures
*   Target tab closed during operation
*   Service worker terminated during operation
*   Cross-origin restrictions blocking execution

## Browser Compatibility
- Chrome (primary)
- Firefox (if supported)
- Edge (if supported)

## Performance
1. Script load times
2. Memory usage during attack
3. CPU usage monitoring
4. Impact on page performance

## Security
1. Content script isolation
2. Permission boundaries
3. Cross-origin considerations
4. Input sanitization

## Documentation
- [ ] Update user guide with popup UI instructions
- [ ] Note context menu integration as coming soon
- [ ] Document error messages and resolutions
- [ ] Add troubleshooting section

## Known Issues
1. Context menu integration not working
   - Planned for next update
   - Use popup UI meanwhile
2. Error handling improvements needed
   - More specific error messages
   - Better user feedback
3. Performance optimization opportunities
   - Script loading optimization
   - Resource cleanup
