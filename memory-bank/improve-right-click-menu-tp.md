# Test Plan for `context-menu.mjs` Changes

This test plan verifies the recent fixes in [`src/lib/context-menu.mjs`](src/lib/context-menu.mjs:277) ensuring:

- Consistent menu-building order
- Removal of item-limit restrictions
- Uniform application of `ALL_CONTEXTS`
- Detailed logging of each creation step

---

## 1. Setup Requirements

1. Enable ES6 modules and Jasmine for `.mjs` in `jasmine.json`:
   ```json
   {
     "spec_dir": "test",
     "spec_files": ["**/*-spec.mjs"],
     "helpers": ["../node_modules/@babel/register"]
   }
   ```
2. Install:
   ```
   npm install jasmine @babel/register
   ```
3. Provide a mock browser interface at [`test/utils/mock-browser-interface.mjs`](test/utils/mock-browser-interface.mjs):
   - Methods: `openSettings()`, `openUrl(url)`, `storage.local.get/set`, `getOptionsAsync()`, `addStorageListener()`.
4. Create a fake menu builder stub exposing:
   - `rootMenu()`, `subMenu()`, `separator()`, `menuItem()`, `choice()`, and a call-order tracker.

---

## 2. Functional Tests (Jasmine)

### 2.1 Verify “Operational mode” Submenu Order

```javascript
import ContextMenu from '../src/lib/context-menu.mjs';
import mockBrowser from './utils/mock-browser-interface.mjs';

describe('ContextMenu – Operational Mode Order', () => {
  it('adds Operational mode submenu immediately after rootMenu', async () => {
    const builder = mockBrowser.getMenuBuilder();
    const menu = new ContextMenu({}, mockBrowser, builder, () => [], false);
    await menu.init();
    const calls = builder.getCallOrder(); // e.g., ['rootMenu', 'subMenu', ...]
    expect(calls[0]).toBe('rootMenu');
    expect(calls[1]).toBe('subMenu');
  });
});
```

### 2.2 Verify “Help/Support” Item with `ALL_CONTEXTS`

```javascript
it('always creates Help/Support item with ALL_CONTEXTS', async () => {
  const builder = mockBrowser.getMenuBuilder();
  const menu = new ContextMenu({}, mockBrowser, builder, () => [], false);
  await menu.init();
  const helpCall = builder.findCall('menuItem', 'Help/Support');
  expect(helpCall.params.contexts).toEqual(['page','selection','link','editable']);
});
```

### 2.3 Independent of Configuration Processing

```javascript
it('adds generic items even when standardConfig is empty', async () => {
  const builder = mockBrowser.getMenuBuilder();
  const menu = new ContextMenu([], mockBrowser, builder, () => [], true);
  await menu.init();
  expect(builder.called('subMenu', 'Operational mode')).toBeTrue();
  expect(builder.called('menuItem', 'Help/Support')).toBeTrue();
});
```

---

## 3. Logging Tests

- Spy on `console.debug` and `console.log`:

```javascript
it('logs each generic item creation', async () => {
  spyOn(console, 'debug');
  const builder = mockBrowser.getMenuBuilder();
  const menu = new ContextMenu({}, mockBrowser, builder, () => [], false);
  await menu.init();
  expect(console.debug).toHaveBeenCalledWith(
    '[ContextMenu] Adding Help/Support in contexts:',
    jasmine.any(Array)
  );
  expect(console.debug).toHaveBeenCalledWith(
    '[ContextMenu] Adding Operational mode in contexts:',
    jasmine.any(Array)
  );
});
```

---

## 4. Positive & Negative Testing

### 4.1 Positive Cases

- Simulate right-click on:
  - Page background
  - Selected text
  - Link element
  - Editable field  
  **Expectation**: All generic items appear.

### 4.2 Negative / Edge Cases

- **Malformed config** (e.g., missing `HANDLER_CONFIG` entries)  
  *Expectation*: Generic items still appear; errors logged but do not prevent menu creation.
- **Excessive entries** (simulate >500 items)  
  *Expectation*: No silent drops; all items display due to removed limit.
- **`getOptionsAsync()` returns null/invalid**  
  *Expectation*: Graceful rebuild with generic items only; error logged.

---

## 5. End-to-End Validation

Use [`test/e2e/context-menu-integration.spec.mjs`](test/e2e/context-menu-integration.spec.mjs):

```javascript
describe('E2E: Right-click Menu Integration', () => {
  it('shows Operational mode & Help/Support on page', async () => {
    await loadExtension();
    await rightClick('body');
    const items = await getContextMenuItems();
    expect(items).toContain('Operational mode');
    expect(items).toContain('Help/Support');
  });
});
```

---
