import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { FakeBrowserAPI as FakeChromeApi } from '../../utils/fake-chrome-api.mjs';
import ChromeMenuBuilder from '../../../src/lib/chrome-menu-builder.mjs';

describe('ChromeMenuBuilder', function () {
	let underTest, chrome, clickHandler;
	const lastMenu = function () {
		if (chrome && chrome.contextMenus && chrome.contextMenus.create && chrome.contextMenus.create.mock) {
			const calls = chrome.contextMenus.create.mock.calls;
			return calls.length > 0 ? calls[calls.length - 1][0] : undefined;
		}
		return undefined;
	};

	// General beforeEach to set up a basic chrome instance for all tests
	beforeEach(function () {
		chrome = new FakeChromeApi();
		chrome.storage.local.get.mockResolvedValue({});
		chrome.storage.local.set.mockResolvedValue(undefined);
		if (chrome.runtime) {
			chrome.runtime.lastError = undefined;
		}
	});

	describe('constructor', () => {
		it('should register an onClicked listener', () => {
			chrome.contextMenus.onClicked.addListener.mockClear(); 
			underTest = new ChromeMenuBuilder(chrome);
			expect(chrome.contextMenus.onClicked.addListener).toHaveBeenCalledTimes(1);
		});
	});

	// Top-level beforeEach for setting up underTest and clickHandler if not done by more specific blocks.
	beforeEach(function() {
		if (!underTest) { 
			underTest = new ChromeMenuBuilder(chrome);
		}
		if (!clickHandler || chrome.contextMenus.onClicked.addListener.mock.calls.length > 0) {
			const listeners = chrome.contextMenus.onClicked.addListener.mock.calls;
			if (listeners.length > 0) {
				clickHandler = listeners[listeners.length - 1][0];
			} else if (underTest) { 
				// This case implies underTest was created, but its listener wasn't captured or was cleared.
				// Re-create to ensure clickHandler is from the current instance.
				underTest = new ChromeMenuBuilder(chrome);
				// The constructor *always* adds a listener. If mock.calls is empty, something is very wrong
				// or addListener was cleared *after* construction and before this beforeEach.
				// For safety, we grab the first (and should be only) listener if underTest was just made.
				if (chrome.contextMenus.onClicked.addListener.mock.calls.length > 0) {
					clickHandler = chrome.contextMenus.onClicked.addListener.mock.calls[0][0];
				} else {
					// This state should ideally not be reached if constructor works as expected.
					// Consider if a test is clearing addListener too aggressively.
					// For now, to prevent errors, we ensure clickHandler is at least attempted to be set.
					// If it remains undefined, tests relying on it will fail, pointing to setup issues.
					console.warn('ChromeMenuBuilder top beforeEach: onClicked.addListener.mock.calls is empty after new ChromeMenuBuilder. clickHandler might be undefined.');
				}
			}
		}
	});


	describe('menu state management', () => {
		beforeEach(async () => { 
			chrome.storage.local.get.mockReset().mockResolvedValue({});
			chrome.storage.local.set.mockReset().mockResolvedValue(undefined);
			chrome.contextMenus.onClicked.addListener.mockClear();
			
			underTest = new ChromeMenuBuilder(chrome);
			if (chrome.contextMenus.onClicked.addListener.mock.calls.length > 0) {
				clickHandler = chrome.contextMenus.onClicked.addListener.mock.calls[0][0];
			} else { 
				// This should not happen if constructor works
				underTest = new ChromeMenuBuilder(chrome); 
				clickHandler = chrome.contextMenus.onClicked.addListener.mock.calls[0][0];
			}
			await new Promise(resolve => setTimeout(resolve, 0));
		});

		it('loads stored menu state on initialization', async () => {
			const storedState = {
				chrome_menu_state: { values: { 'menu1': 'value1' },	lastUpdate: Date.now()	}
			};
			chrome.storage.local.get.mockResolvedValue(storedState);
			chrome.contextMenus.onClicked.addListener.mockClear(); 
			underTest = new ChromeMenuBuilder(chrome);
			await new Promise(resolve => setTimeout(resolve, 0)); 
			expect(chrome.storage.local.get).toHaveBeenCalledWith('chrome_menu_state');
		});

		it('handles storage load errors gracefully', async () => {
			const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
			chrome.storage.local.get.mockRejectedValue(new Error('Storage error'));
			chrome.contextMenus.onClicked.addListener.mockClear();
			underTest = new ChromeMenuBuilder(chrome);
			await new Promise(resolve => setTimeout(resolve, 0));
			// Test that we can still create items, implying graceful recovery
			const menuId = await underTest.menuItem('test', 'root', () => {}, 'value');
			expect(menuId).toBeDefined();
			expect(consoleErrorSpy).toHaveBeenCalledWith('[MenuBuilder Debug] Failed to load state:', expect.any(Error));
			consoleErrorSpy.mockRestore();
		});

		it('saves menu state after adding menu items', async () => {
			const menuId = await underTest.menuItem('test', 'root', () => {}, 'testValue');
			await new Promise(resolve => setTimeout(resolve, 0)); 
			expect(chrome.storage.local.set).toHaveBeenCalledWith(
				expect.objectContaining({
					chrome_menu_state: expect.objectContaining({
						values: expect.objectContaining({ [menuId]: 'testValue' }),
						lastUpdate: expect.any(Number)
					})
				})
			);
		});

		it('handles storage save errors gracefully', async () => {
			chrome.storage.local.set.mockRejectedValue(new Error('Storage error'));
			await expect(underTest.menuItem('test', 'root', () => {}, 'value'))
				.rejects
				.toThrow(/^Failed to create menu item: Failed to save menu state: Storage error/);
		});
	});

	describe('rootMenu', function () {
		beforeEach(() => {
			chrome.contextMenus.create.mockClear();
			underTest = new ChromeMenuBuilder(chrome);
		});
		it('creates a menu item without a parent', async () => { 
			const menuId = await underTest.rootMenu('test me');
			expect(chrome.contextMenus.create).toHaveBeenCalledTimes(1);
			const result = lastMenu();
			expect(result.id).toBe(menuId);
			expect(result.contexts).toEqual(['page', 'selection', 'link', 'editable']);
			expect(result.title).toBe('test me');
			expect(result.parentId).toBeUndefined(); 
			expect(result.onclick).toBeUndefined();
		});

		it('generates unique IDs for each root menu', async () => {
			const id1 = await underTest.rootMenu('menu1');
			const id2 = await underTest.rootMenu('menu1');
			expect(id1).not.toEqual(id2);
		});
	});

	describe('subMenu', function () {
		beforeEach(() => {
			chrome.contextMenus.create.mockClear();
			underTest = new ChromeMenuBuilder(chrome);
		});
		it('creates a menu item with a parent', async () => { 
			const menuId = await underTest.subMenu('test me', 'root');
			expect(chrome.contextMenus.create).toHaveBeenCalledTimes(1);
			const result = lastMenu();
			expect(result.id).toBe(menuId);
			expect(result.contexts).toEqual(['page', 'selection', 'link', 'editable']);
			expect(result.title).toBe('test me');
			expect(result.parentId).toBe('root');
			expect(result.onclick).toBeUndefined();
		});

		it('generates unique IDs for submenus', async () => {
			const id1 = await underTest.subMenu('sub1', 'root');
			const id2 = await underTest.subMenu('sub1', 'root');
			expect(id1).not.toEqual(id2);
		});
	});

	describe('separator', function () {
		beforeEach(() => {
			chrome.contextMenus.create.mockClear();
			underTest = new ChromeMenuBuilder(chrome);
		});
		it('creates a separator under a parent', async () => { 
			const menuId = await underTest.separator('root');
			expect(chrome.contextMenus.create).toHaveBeenCalledTimes(1);
			const result = lastMenu();
			expect(result.id).toBe(menuId);
			expect(result.contexts).toEqual(['page', 'selection', 'link', 'editable']);
			expect(result.parentId).toBe('root');
			expect(result.type).toBe('separator');
		});

		it('generates unique IDs for separators', async () => {
			const id1 = await underTest.separator('root');
			const id2 = await underTest.separator('root');
			expect(id1).not.toEqual(id2);
		});

		it('creates a separator with custom contexts when options are provided', async () => { 
			const customContexts = ['link', 'image'];
			await underTest.separator('root', { contexts: customContexts });
			const result = lastMenu();
			expect(result.contexts).toEqual(customContexts);
			expect(result.parentId).toBe('root');
			expect(result.type).toBe('separator');
		});

		it('creates a separator with default contexts when options.contexts is omitted', async () => { 
			await underTest.separator('root');
			const result = lastMenu();
			expect(result.contexts).toEqual(['page', 'selection', 'link', 'editable']);
			expect(result.parentId).toBe('root');
			expect(result.type).toBe('separator');
		});

		it('creates a separator with default contexts when options is provided but options.contexts is omitted', async () => { 
			await underTest.separator('root', {});
			const result = lastMenu();
			expect(result.contexts).toEqual(['page', 'selection', 'link', 'editable']);
			expect(result.parentId).toBe('root');
			expect(result.type).toBe('separator');
		});
	});

	describe('menuItem', function () {
		beforeEach(() => {
			chrome.contextMenus.create.mockClear();
			chrome.contextMenus.onClicked.addListener.mockClear();
			underTest = new ChromeMenuBuilder(chrome);
			const listeners = chrome.contextMenus.onClicked.addListener.mock.calls;
			if (listeners.length > 0) {
				clickHandler = listeners[listeners.length - 1][0];
			} else {
				throw new Error('menuItem tests: onClicked.addListener was not called by ChromeMenuBuilder constructor');
			}
		});
		it('creates a clickable menu item and checks properties passed to chrome API', async function () {
			const menuId = await underTest.menuItem('test me', 'root', jest.fn(), 'definedValueForTest');
			expect(chrome.contextMenus.create).toHaveBeenCalledTimes(1);
			const result = lastMenu();
			expect(result.id).toBe(menuId);
			expect(result.contexts).toEqual(['page', 'selection', 'link', 'editable']);
			expect(result.title).toBe('test me');
			expect(result.parentId).toBe('root');
			expect(result.onclick).toBeUndefined();
		});

		it('passes the tabId and a value object to the click handler', async () => {
			const onClick = jest.fn();
			const testValue = 'some value';
			const menuId = await underTest.menuItem('test me', 'root', onClick, testValue);
			const tabId = 5;
			await clickHandler({menuItemId: menuId}, {id: tabId});
			expect(onClick).toHaveBeenCalledWith(tabId, { menuId: menuId, value: testValue });
		});

		it('executes the click handler with its assigned value object', async () => {
			const onClick = jest.fn();
			const testValue = 'definedValueForTest';
			const menuId = await underTest.menuItem('test me', 'root', onClick, testValue);
			const tabId = 5;
			await clickHandler({menuItemId: menuId}, {id: tabId});
			expect(onClick).toHaveBeenCalledWith(tabId, { menuId: menuId, value: testValue });
		});

		it('handles click handler errors gracefully', async () => {
			const erroringOnClick = jest.fn(() => {
				throw new Error('Handler error');
			});
			const testValue = 'definedValueForTest';
			const menuId = await underTest.menuItem('test error', 'root', erroringOnClick, testValue);
			const tabId = 5;
			await expect(clickHandler({menuItemId: menuId}, {id: tabId})).rejects.toThrow('Handler error');
		});
	});

	describe('value tracking', () => {
		beforeEach(() => {
			chrome.contextMenus.create.mockClear();
			chrome.storage.local.set.mockClear();
			chrome.contextMenus.onClicked.addListener.mockClear();
			underTest = new ChromeMenuBuilder(chrome);
			const listeners = chrome.contextMenus.onClicked.addListener.mock.calls;
			if (listeners.length > 0) {
				clickHandler = listeners[listeners.length - 1][0];
			} else {
				throw new Error('value tracking tests: onClicked.addListener was not called by ChromeMenuBuilder constructor');
			}
		});
		it('tracks menu item value in storage', async () => {
			const value = 'test-value';
			const menuId = await underTest.menuItem('test', 'root', () => {}, value);
			await new Promise(resolve => setTimeout(resolve, 0)); 
			expect(chrome.storage.local.set).toHaveBeenCalledWith(
				expect.objectContaining({
					chrome_menu_state: expect.objectContaining({
						values: expect.objectContaining({ [menuId]: value }),
						lastUpdate: expect.any(Number)
					})
				})
			);
		});

		it('retrieves menu item value for the handler', async () => {
			const storedValue = 'stored-value';
			const mockItemHandler = jest.fn();
			const menuId = await underTest.menuItem('test', 'root', mockItemHandler, storedValue);
			const tabId = 5;
			await clickHandler({menuItemId: menuId}, {id: tabId});
			expect(mockItemHandler).toHaveBeenCalledWith(tabId, { menuId: menuId, value: storedValue });
		});
	});

	describe('choice', () => {
		beforeEach(() => {
			chrome.contextMenus.create.mockClear();
			chrome.contextMenus.onClicked.addListener.mockClear();
			underTest = new ChromeMenuBuilder(chrome);
			const listeners = chrome.contextMenus.onClicked.addListener.mock.calls;
			if (listeners.length > 0) {
				clickHandler = listeners[listeners.length - 1][0];
			} else {
				throw new Error('choice tests: onClicked.addListener was not called by ChromeMenuBuilder constructor');
			}
		});

		it('creates a radio button menu item', async () => { 
			const menuId = await underTest.choice('option1', 'root', () => {}, true);
			expect(chrome.contextMenus.create).toHaveBeenCalledTimes(1);
			const menu = lastMenu();
			expect(menu.id).toBe(menuId);
			expect(menu.type).toBe('radio');
			expect(menu.checked).toBe(true);
			expect(menu.title).toBe('option1');
			expect(menu.parentId).toBe('root');
			expect(menu.contexts).toEqual(['page', 'selection', 'link', 'editable']);
		});

		it('stores click handler and value, passes value object to handler', async () => {
			const onClick = jest.fn();
			const menuId = await underTest.choice('option1', 'root', onClick, true); 
			console.log('Actual menuId in test (choice) IMMEDIATELY AFTER ASSIGNMENT:', menuId); 
			const tabId = 5;
			await clickHandler({menuItemId: menuId}, {id: tabId});
			expect(onClick).toHaveBeenCalledWith(tabId, { menuId: menuId, value: true });
		});
	});

	describe('removeAll', () => {
		beforeEach(() => {
			underTest = new ChromeMenuBuilder(chrome);
		});
		it('removes all menu items and clears state', async () => {
			await underTest.removeAll();
			expect(chrome.storage.local.remove).toHaveBeenCalledWith('chrome_menu_state');
			expect(chrome.contextMenus.removeAll).toHaveBeenCalled();
		});

		it('handles removeAll errors gracefully when contextMenus.removeAll fails', async () => {
			const errorMessage = 'Fake contextMenus.removeAll error';
			chrome.contextMenus.removeAll.mockImplementationOnce((callback) => {
				if (chrome.runtime) {
					chrome.runtime.lastError = { message: errorMessage };
				}
				if (callback) { 
					callback(); 
				}
			});
			await expect(underTest.removeAll()).rejects.toThrow(errorMessage);
		});

		it('handles removeAll errors gracefully when storage.remove fails', async () => {
			const errorMessage = 'Fake storage.local.remove error';
			chrome.storage.local.remove.mockImplementationOnce(() => {
				if (chrome.runtime) {
					chrome.runtime.lastError = { message: errorMessage };
				}
				return Promise.reject(new Error(errorMessage));
			});
			await expect(underTest.removeAll()).rejects.toThrow(errorMessage);
		});
	});

	describe('selectChoice', () => {
		beforeEach(() => {
			underTest = new ChromeMenuBuilder(chrome);
		});
		it('updates radio button checked state', async () => {
			const menuId = 'choice1';
			await underTest.selectChoice(menuId); 
			expect(chrome.contextMenus.update).toHaveBeenCalledWith(menuId, {checked: true});
		});
	});

	describe('Context-specific standard menu items', function () {
		const contextsToTest = ['page', 'selection', 'link', 'editable'];
		const CUSTOMIZE_MENUS_TITLE = 'Customize menus';
		const HELP_SUPPORT_TITLE = 'Help/Support';
		const SEPARATOR_TYPE = 'separator';

		contextsToTest.forEach(currentContext => {
			describe(`for '${currentContext}' context`, function () {
				let createdItemsForContext, mockParentId;

				beforeEach(async function () {
					chrome.contextMenus.create.mockClear();
					chrome.contextMenus.onClicked.addListener.mockClear();

					underTest = new ChromeMenuBuilder(chrome);
					const listeners = chrome.contextMenus.onClicked.addListener.mock.calls;
					if (listeners.length > 0) {
						clickHandler = listeners[listeners.length - 1][0];
					} else {
						throw new Error(`Context-specific tests ('${currentContext}'): onClicked.addListener was not called`);
					}

					mockParentId = `test-parent-for-${currentContext}-${Date.now()}`;

					await underTest.separator(mockParentId, { contexts: [currentContext] });
					await underTest.menuItem(
						CUSTOMIZE_MENUS_TITLE,
						mockParentId,
						jest.fn(),
						{ testValue: 'customize', contexts: [currentContext] }
					);
					await underTest.menuItem(
						HELP_SUPPORT_TITLE,
						mockParentId,
						jest.fn(),
						{ testValue: 'help', contexts: [currentContext] }
					);
					
					createdItemsForContext = chrome.contextMenus.create.mock.calls.map(call => call[0]);
				});

				it('should create a separator item with the correct type, and context', function () {
					const separator = createdItemsForContext.find(item =>
						item.type === SEPARATOR_TYPE &&
						item.parentId === mockParentId &&
						JSON.stringify(item.contexts) === JSON.stringify([currentContext])
					);
					expect(separator).toBeDefined();
					expect(separator.type).toBe(SEPARATOR_TYPE);
					expect(separator.contexts).toEqual([currentContext]);
					expect(separator.parentId).toBe(mockParentId);
				});

				it('should create a "Customize menus" item with the correct title, and context', function () {
					const customizeItem = createdItemsForContext.find(item =>
						item.title === CUSTOMIZE_MENUS_TITLE &&
						item.parentId === mockParentId &&
						JSON.stringify(item.contexts) === JSON.stringify([currentContext])
					);
					expect(customizeItem).toBeDefined();
					expect(customizeItem.title).toBe(CUSTOMIZE_MENUS_TITLE);
					expect(customizeItem.contexts).toEqual([currentContext]);
					expect(customizeItem.parentId).toBe(mockParentId);
				});

				it('should create a "Help/Support" item with the correct title, and context', function () {
					const helpItem = createdItemsForContext.find(item =>
						item.title === HELP_SUPPORT_TITLE &&
						item.parentId === mockParentId &&
						JSON.stringify(item.contexts) === JSON.stringify([currentContext])
					);
					expect(helpItem).toBeDefined();
					expect(helpItem.title).toBe(HELP_SUPPORT_TITLE);
					expect(helpItem.contexts).toEqual([currentContext]);
					expect(helpItem.parentId).toBe(mockParentId);
				});
			});
		});
	});
});
