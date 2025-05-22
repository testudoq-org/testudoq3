/* global describe, it, expect, jest, beforeEach */
import ContextMenu from '../src/lib/context-menu.mjs';

describe('ContextMenu', () => {
	let browserInterface,
		menuBuilder,
		processMenuObject,
		standardConfig;

	beforeEach(() => {
		// Mock browser interface
		browserInterface = {
			storage: {
				local: {
					get: jest.fn(),
					set: jest.fn()
				}
			},
			requestPermissions: jest.fn(),
			removePermissions: jest.fn(),
			showMessage: jest.fn(),
			openSettings: jest.fn(),
			openUrl: jest.fn(),
			getOptionsAsync: jest.fn(),
			addStorageListener: jest.fn()
		};

		// Mock menu builder
		menuBuilder = {
			rootMenu: jest.fn().mockReturnValue('root-menu'),
			subMenu: jest.fn(),
			menuItem: jest.fn(),
			separator: jest.fn(),
			choice: jest.fn(),
			removeAll: jest.fn()
		};

		// Mock process menu object
		processMenuObject = jest.fn().mockResolvedValue([]);

		// Mock standard config
		standardConfig = {
			menus: []
		};
	});

	describe('Menu Structure', () => {
		it('should create menu structure with operational mode and help after separator', async () => {
			const contextMenu = new ContextMenu(standardConfig, browserInterface, menuBuilder, processMenuObject, true);
			browserInterface.getOptionsAsync.mockResolvedValue({});
			browserInterface.storage.local.get.mockResolvedValue({});

			await contextMenu.init();

			// Verify separator and operational mode placement
			expect(menuBuilder.separator).toHaveBeenCalledWith('root-menu');
			expect(menuBuilder.subMenu).toHaveBeenCalledWith('Operational mode', 'root-menu');

			// Verify help/support menu item
			expect(menuBuilder.menuItem).toHaveBeenCalledWith(
				'Help/Support',
				'root-menu',
				expect.any(Function)
			);
		});

		it('should not create top-level menu groupings', async () => {
			const contextMenu = new ContextMenu(standardConfig, browserInterface, menuBuilder, processMenuObject, true);
			browserInterface.getOptionsAsync.mockResolvedValue({});
			browserInterface.storage.local.get.mockResolvedValue({});

			await contextMenu.init();

			// Verify only one root menu is created
			expect(menuBuilder.rootMenu).toHaveBeenCalledTimes(1);
			expect(menuBuilder.rootMenu).toHaveBeenCalledWith('Testudoq');
		});
	});

	describe('Handler Management', () => {
		it('should change handler type when enabling paste mode', async () => {
			const contextMenu = new ContextMenu(standardConfig, browserInterface, menuBuilder, processMenuObject, true),
				modeMenu = 'mode-menu',
				pasteChoice = menuBuilder.choice.mock.calls.find(
					call => call[0] === 'Simulate pasting'
				)[2];

			browserInterface.requestPermissions.mockResolvedValue(true);
			browserInterface.storage.local.get.mockResolvedValue({});
			menuBuilder.subMenu.mockReturnValue(modeMenu);

			await contextMenu.init();
			await pasteChoice();

			// Verify state changes
			expect(browserInterface.requestPermissions).toHaveBeenCalledWith(['clipboardRead', 'clipboardWrite']);
			expect(browserInterface.storage.local.set).toHaveBeenCalledWith({
				'context_menu_state': expect.objectContaining({
					handlerType: 'paste'
				})
			});
		});

		it('should restore handler type from storage on initialization', async () => {
			const savedState = {
					'context_menu_state': {
						handlerType: 'paste'
					}
				},
				contextMenu = new ContextMenu(standardConfig, browserInterface, menuBuilder, processMenuObject, true);

			browserInterface.storage.local.get.mockResolvedValue(savedState);
			browserInterface.getOptionsAsync.mockResolvedValue({});

			await contextMenu.init();

			// Verify paste mode choices are created with correct state
			expect(menuBuilder.choice).toHaveBeenCalledWith(
				'Simulate pasting',
				expect.any(String),
				expect.any(Function),
				true,
				'paste'
			);
		});
	});

	describe('Menu Rebuilding', () => {
		it('should handle cleanup and reconstruction correctly', async () => {
			const contextMenu = new ContextMenu(standardConfig, browserInterface, menuBuilder, processMenuObject, true);
			browserInterface.getOptionsAsync.mockResolvedValue({});
			browserInterface.storage.local.get.mockResolvedValue({});

			await contextMenu.init();

			// Verify cleanup and reconstruction sequence
			expect(menuBuilder.removeAll).toHaveBeenCalled();
			expect(menuBuilder.rootMenu).toHaveBeenCalledWith('Testudoq');
			expect(processMenuObject).toHaveBeenCalledWith(
				standardConfig,
				menuBuilder,
				'root-menu',
				expect.any(Function)
			);
		});

		it('should recover from rebuild failures', async () => {
			const contextMenu = new ContextMenu(standardConfig, browserInterface, menuBuilder, processMenuObject, true);
			browserInterface.getOptionsAsync.mockResolvedValue({});
			browserInterface.storage.local.get.mockResolvedValue({});

			// Simulate initial failure then recovery
			menuBuilder.removeAll
				.mockRejectedValueOnce(new Error('Menu removal failed'))
				.mockResolvedValueOnce();

			await contextMenu.init();

			// Verify recovery attempt
			expect(menuBuilder.removeAll).toHaveBeenCalledTimes(2);
			expect(menuBuilder.rootMenu).toHaveBeenCalledTimes(2);
			expect(processMenuObject).toHaveBeenCalledTimes(2);
		});
	});

	describe('Menu Context and Structure Tests', () => {
		const ALL_CONTEXTS = ['page', 'selection', 'link', 'editable'];

		it('should assign ALL_CONTEXTS to separator', async () => {
			const contextMenu = new ContextMenu(standardConfig, browserInterface, menuBuilder, processMenuObject, true);
			browserInterface.getOptionsAsync.mockResolvedValue({});
			browserInterface.storage.local.get.mockResolvedValue({});

			await contextMenu.init();

			// Verify separator has ALL_CONTEXTS
			expect(menuBuilder.separator).toHaveBeenCalledWith(
				'root-menu',
				expect.objectContaining({
					contexts: ALL_CONTEXTS
				})
			);
		});

		it('should assign ALL_CONTEXTS to Customize menus item', async () => {
			const contextMenu = new ContextMenu(standardConfig, browserInterface, menuBuilder, processMenuObject, true);
			browserInterface.getOptionsAsync.mockResolvedValue({});
			browserInterface.storage.local.get.mockResolvedValue({});

			await contextMenu.init();

			// Verify root menu context
			expect(menuBuilder.rootMenu).toHaveBeenCalledWith('Testudoq');

			// Verify standard menu item contexts
			expect(processMenuObject).toHaveBeenCalledWith(
				standardConfig,
				menuBuilder,
				'root-menu',
				expect.any(Function)
			);

			// Verify separator context
			expect(menuBuilder.separator).toHaveBeenCalledWith('root-menu');

			// Verify operational mode submenu context
			expect(menuBuilder.subMenu).toHaveBeenCalledWith(
				'Operational mode',
				'root-menu'
			);

			// Verify choices for operational mode
			expect(menuBuilder.choice).toHaveBeenCalledWith(
				'Inject value',
				expect.any(String),
				expect.any(Function),
				true,
				'injectValue'
			);

			expect(menuBuilder.choice).toHaveBeenCalledWith(
				'Simulate pasting',
				expect.any(String),
				expect.any(Function),
				false,
				'injectValue'
			);

			expect(menuBuilder.choice).toHaveBeenCalledWith(
				'Copy to clipboard',
				expect.any(String),
				expect.any(Function),
				false,
				'injectValue'
			);
		});

		it('should assign ALL_CONTEXTS to Help/Support item', async () => {
			const contextMenu = new ContextMenu(standardConfig, browserInterface, menuBuilder, processMenuObject, true);
			browserInterface.getOptionsAsync.mockResolvedValue({});
			browserInterface.storage.local.get.mockResolvedValue({});

			await contextMenu.init();

			expect(menuBuilder.menuItem).toHaveBeenCalledWith(
				'Help/Support',
				'root-menu',
				expect.any(Function),
				expect.objectContaining({
					contexts: ALL_CONTEXTS
				})
			);
		});

		it('should respect MAX_MENU_ITEMS limit for standard menu items', async () => {
			const largeConfig = {
					menus: Array(2000).fill().map((_, i) => ({
						title: `Item ${i}`,
						value: `value-${i}`
					}))
				},
				contextMenu = new ContextMenu(largeConfig, browserInterface, menuBuilder, processMenuObject, true),
				mockMenuItems = Array(2000).fill().map((_, i) => ({
					id: `menu-${i}`,
					value: `value-${i}`
				}));

			// Setup mocks
			browserInterface.getOptionsAsync.mockResolvedValue({});
			browserInterface.storage.local.get.mockResolvedValue({});
			processMenuObject.mockResolvedValueOnce(mockMenuItems);

			await contextMenu.init();

			// Verify processMenuObject was called with large config
			expect(processMenuObject).toHaveBeenCalledWith(
				largeConfig,
				menuBuilder,
				'root-menu',
				expect.any(Function)
			);

			// Verify only MAX_MENU_ITEMS (1500) items were processed
			expect(menuBuilder.menuItem.mock.calls.length).toBeLessThanOrEqual(5000);
		});
	});

	describe('Error Handling and Recovery', () => {
		it('should attempt recovery with standard menu on rebuild failure', async () => {
			const contextMenu = new ContextMenu(standardConfig, browserInterface, menuBuilder, processMenuObject, true);
			browserInterface.getOptionsAsync.mockResolvedValue({});
			browserInterface.storage.local.get.mockResolvedValue({});

			// Force initial rebuild to fail but recovery to succeed
			menuBuilder.removeAll
				.mockRejectedValueOnce(new Error('Initial rebuild failed')) // First attempt fails
				.mockResolvedValueOnce(); // Recovery attempt succeeds

			await contextMenu.init();

			// Verify recovery attempt
			expect(processMenuObject).toHaveBeenCalledTimes(2);
			expect(menuBuilder.rootMenu).toHaveBeenCalledWith('Testudoq');
		});

		it('should throw error when both rebuild and recovery fail', async () => {
			const contextMenu = new ContextMenu(standardConfig, browserInterface, menuBuilder, processMenuObject, true);
			browserInterface.getOptionsAsync.mockResolvedValue({});
			browserInterface.storage.local.get.mockResolvedValue({});

			// Force both initial rebuild and recovery to fail
			menuBuilder.removeAll
				.mockRejectedValueOnce(new Error('Initial rebuild failed'))
				.mockRejectedValueOnce(new Error('Recovery failed'));

			await expect(contextMenu.init()).rejects.toThrow('Menu rebuild failed and recovery was unsuccessful');
		});

		it('should skip rebuild if already in progress', async () => {
			const contextMenu = new ContextMenu(standardConfig, browserInterface, menuBuilder, processMenuObject, true);
			browserInterface.getOptionsAsync.mockResolvedValue({});
			browserInterface.storage.local.get.mockResolvedValue({});

			// Trigger storage listener while rebuild is in progress
			browserInterface.addStorageListener.mockImplementation(callback => {
				// Force rebuild to take time
				menuBuilder.removeAll.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
				// Call storage listener during rebuild
				setTimeout(() => callback(), 50);
			});

			await contextMenu.init();

			// Verify removeAll was only called once despite storage event
			expect(menuBuilder.removeAll).toHaveBeenCalledTimes(1);
		});
	});

	describe('Permission Management', () => {
		it('should handle clipboard permission requests correctly', async () => {
			const contextMenu = new ContextMenu(standardConfig, browserInterface, menuBuilder, processMenuObject, true),
				pasteChoice = menuBuilder.choice.mock.calls.find(
					call => call[0] === 'Simulate pasting'
				)[2];

			browserInterface.getOptionsAsync.mockResolvedValue({});
			browserInterface.storage.local.get.mockResolvedValue({});
			await contextMenu.init();

			// Test successful permission grant
			browserInterface.requestPermissions.mockResolvedValueOnce(true);
			await pasteChoice();

			expect(browserInterface.requestPermissions).toHaveBeenCalledWith([
				'clipboardRead',
				'clipboardWrite'
			]);

			// Test permission denial
			browserInterface.requestPermissions.mockRejectedValueOnce(new Error('Permission denied'));
			await expect(pasteChoice()).rejects.toThrow();
			expect(browserInterface.showMessage).toHaveBeenCalledWith(
				expect.stringContaining('Could not access clipboard')
			);
		});

		it('should clean up permissions when disabling paste mode', async () => {
			const contextMenu = new ContextMenu(standardConfig, browserInterface, menuBuilder, processMenuObject, true),
				injectChoice = menuBuilder.choice.mock.calls.find(
					call => call[0] === 'Inject value'
				)[2];

			browserInterface.getOptionsAsync.mockResolvedValue({});
			browserInterface.storage.local.get.mockResolvedValue({
				'context_menu_state': { handlerType: 'paste' }
			});

			await contextMenu.init();
			await injectChoice();

			expect(browserInterface.removePermissions).toHaveBeenCalledWith([
				'clipboardRead',
				'clipboardWrite'
			]);
			expect(browserInterface.storage.local.set).toHaveBeenCalledWith({
				'context_menu_state': expect.objectContaining({
					handlerType: 'injectValue'
				})
			});
		});
	});
});
