/*global describe, it, expect, beforeEach, jasmine, expectAsync*/
import { FakeChromeApi } from './utils/fake-chrome-api.mjs';
import { ChromeMenuBuilder } from '../src/lib/chrome-menu-builder.mjs';

describe('ChromeMenuBuilder', function () {
	let underTest, chrome, index = 0, clickHandler;
	const lastMenu = function () {
		return chrome.contextMenus.create.calls.argsFor(0)[0];
	};

	beforeEach(function () {
		chrome = new FakeChromeApi();
		chrome.contextMenus.create.and.callFake(() => index++);
		chrome.storage.local.get.and.returnValue(Promise.resolve({}));
		chrome.storage.local.set.and.returnValue(Promise.resolve());
		underTest = new ChromeMenuBuilder(chrome);
		clickHandler = chrome.contextMenus.onClicked.addListener.calls.mostRecent().args[0];
	});

	describe('menu state management', () => {
		it('loads stored menu state on initialization', async () => {
			const storedState = {
				chrome_menu_state: {
					values: { 'menu1': 'value1' }
				}
			};
			chrome.storage.local.get.and.returnValue(Promise.resolve(storedState));
			underTest = new ChromeMenuBuilder(chrome);

			// Wait for async init
			await new Promise(resolve => setTimeout(resolve, 0));
			await clickHandler(
				{menuItemId: await underTest.menuItem('test', 'root', () => {}, 'value2')},
				{id: 5}
			);
			expect(chrome.storage.local.get).toHaveBeenCalledWith('chrome_menu_state');
		});

		it('handles storage load errors gracefully', async () => {
			chrome.storage.local.get.and.returnValue(Promise.reject(new Error('Storage error')));
			underTest = new ChromeMenuBuilder(chrome);
			await new Promise(resolve => setTimeout(resolve, 0));
			const menuId = await underTest.menuItem('test', 'root', () => {}, 'value');
			expect(menuId).toBeDefined();
		});

		it('saves menu state after adding menu items', async () => {
			const menuId = await underTest.menuItem('test', 'root', () => {}, 'testValue');
			expect(chrome.storage.local.set).toHaveBeenCalledWith({
				chrome_menu_state: {
					values: jasmine.objectContaining({
						[menuId]: 'testValue'
					})
				}
			});
		});

		it('handles storage save errors gracefully', async () => {
			chrome.storage.local.set.and.returnValue(Promise.reject(new Error('Storage error')));
			const menuId = await underTest.menuItem('test', 'root', () => {}, 'value');
			expect(menuId).toBeDefined();
		});
	});

	describe('rootMenu', function () {
		it('creates a menu item without a parent', function () {
			underTest.rootMenu('test me');
			expect(chrome.contextMenus.create.calls.count()).toBe(1);
			const result = lastMenu();
			expect(result.contexts).toEqual(['editable']);
			expect(result.title).toBe('test me');
			expect(result.parentId).toBeFalsy();
			expect(result.onclick).toBeUndefined();
		});

		it('generates unique IDs for each root menu', () => {
			const id1 = underTest.rootMenu('menu1'),
				id2 = underTest.rootMenu('menu1');
			expect(id1).not.toEqual(id2);
		});
	});

	describe('subMenu', function () {
		it('creates a menu item with a parent', function () {
			underTest.subMenu('test me', 'root');
			expect(chrome.contextMenus.create.calls.count()).toBe(1);
			const result = lastMenu();
			expect(result.contexts).toEqual(['editable']);
			expect(result.title).toBe('test me');
			expect(result.parentId).toBe('root');
			expect(result.onclick).toBeUndefined();
		});

		it('generates unique IDs for submenus', () => {
			const id1 = underTest.subMenu('sub1', 'root'),
				id2 = underTest.subMenu('sub1', 'root');
			expect(id1).not.toEqual(id2);
		});
	});

	describe('separator', function () {
		it('creates a separator under a parent', function () {
			underTest.separator('root');
			expect(chrome.contextMenus.create.calls.count()).toBe(1);
			const result = lastMenu();
			expect(result.contexts).toEqual(['editable']);
			expect(result.parentId).toBe('root');
			expect(result.type).toBe('separator');
		});

		it('generates unique IDs for separators', () => {
			const id1 = underTest.separator('root'),
				id2 = underTest.separator('root');
			expect(id1).not.toEqual(id2);
		});
	});

	describe('menuItem', function () {
		it('creates a clickable menu item without a click handler', function () {
			underTest.menuItem('test me', 'root', 'some value');
			expect(chrome.contextMenus.create.calls.count()).toBe(1);
			const result = lastMenu();
			expect(result.contexts).toEqual(['editable']);
			expect(result.title).toBe('test me');
			expect(result.parentId).toBe('root');
			expect(result.onclick).toBeUndefined();
		});

		it('passes the value to the click handler', function () {
			const onClick = jasmine.createSpy('click'),
				menuId = underTest.menuItem('test me', 'root', onClick, 'some value');
			clickHandler({menuItemId: menuId}, {id: 5});
			expect(onClick).toHaveBeenCalledWith(5, 'some value');
		});

		it('executes the click handler even without a value', function () {
			const onClick = jasmine.createSpy('click'),
				menuId = underTest.menuItem('test me', 'root', onClick);
			clickHandler({menuItemId: menuId}, {id: 5});
			expect(onClick).toHaveBeenCalledWith(5, undefined);
		});

		it('handles click handler errors gracefully', async () => {
			const onClick = () => {
					throw new Error('Handler error');
				},
				menuId = await underTest.menuItem('test', 'root', onClick);
			await expectAsync(clickHandler({menuItemId: menuId}, {id: 5}))
				.toBeRejectedWithError('Handler error');
		});
	});

	describe('value tracking', () => {
		it('tracks menu item value in storage', async () => {
			const value = 'test-value',
				menuId = await underTest.menuItem('test', 'root', () => {}, value);
			expect(chrome.storage.local.set).toHaveBeenCalledWith({
				chrome_menu_state: {
					values: jasmine.objectContaining({
						[menuId]: value
					})
				}
			});
		});

		it('retrieves menu item value during click handling', async () => {
			const value = 'stored-value',
				menuId = await underTest.menuItem('test', 'root', () => {}, value);
			chrome.storage.local.get.and.returnValue(Promise.resolve({
				chrome_menu_state: {
					values: {
						[menuId]: value
					}
				}
			}));
			await clickHandler({menuItemId: menuId}, {id: 5});
			expect(chrome.storage.local.get).toHaveBeenCalledWith('chrome_menu_state');
		});
	});

	describe('choice', () => {
		it('creates a radio button menu item', () => {
			underTest.choice('option1', 'root', () => {}, true);
			expect(chrome.contextMenus.create.calls.count()).toBe(1);
			const menu = lastMenu();
			expect(menu.type).toBe('radio');
			expect(menu.checked).toBe(true);
			expect(menu.title).toBe('option1');
			expect(menu.parentId).toBe('root');
		});

		it('stores click handler and value', async () => {
			const onClick = jasmine.createSpy('click'),
				menuId = underTest.choice('option1', 'root', onClick, true);
			await clickHandler({menuItemId: menuId}, {id: 5});
			expect(onClick).toHaveBeenCalledWith(5, true);
		});
	});

	describe('removeAll', () => {
		it('removes all menu items and clears state', async () => {
			await underTest.removeAll();
			expect(chrome.storage.local.remove).toHaveBeenCalledWith('chrome_menu_state');
			expect(chrome.contextMenus.removeAll).toHaveBeenCalled();
		});

		it('handles removeAll errors gracefully', async () => {
			chrome.contextMenus.removeAll.and.callFake(cb => cb(new Error('Remove error')));
			await expectAsync(underTest.removeAll()).toBeRejectedWithError('Remove error');
		});
	});

	describe('selectChoice', () => {
		it('updates radio button checked state', async () => {
			const menuId = 'choice1';
			await underTest.selectChoice(menuId);
			expect(chrome.contextMenus.update).toHaveBeenCalledWith(menuId, {checked: true});
		});
	});
});
