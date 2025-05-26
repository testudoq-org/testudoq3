import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import ContextMenu from '../../../src/lib/context-menu.mjs';
import ChromeMenuBuilder from '../../../src/lib/chrome-menu-builder.mjs';
import {standardConfig, emptyConfig, largeConfig} from '../../utils/test-configs.mjs'; // Assuming test-configs.mjs is in test/utils
import FakeBrowserInterface from '../../utils/fake-browser-interface.mjs';
import FakeChromeAPI from '../../utils/fake-chrome-api.mjs';


// Mock the ChromeMenuBuilder
jest.mock('../../../src/lib/chrome-menu-builder.mjs');

describe('ContextMenu', () => {
	let contextMenu;
	let mockMenuBuilder;
	let mockBrowserInterface;
	let mockChrome;
	let storageCallback; // To capture the storage listener

	beforeEach(() => {
		mockMenuBuilder = {
			rootMenu: jest.fn().mockReturnThis(),
			menuItem: jest.fn().mockReturnThis(),
			separator: jest.fn().mockReturnThis(),
			removeAll: jest.fn().mockResolvedValue(undefined),
			getMenuState: jest.fn().mockReturnValue({ items: [], values: {} })
		};
		ChromeMenuBuilder.mockImplementation(() => mockMenuBuilder);

		mockChrome = new FakeChromeAPI();
		global.chrome = mockChrome;


		mockBrowserInterface = new FakeBrowserInterface(mockChrome);
		// Spy on specific methods of the mockBrowserInterface instance
		jest.spyOn(mockBrowserInterface, 'loadConfig').mockResolvedValue(standardConfig);
		jest.spyOn(mockBrowserInterface, 'saveConfig');
		jest.spyOn(mockBrowserInterface, 'loadOptions').mockResolvedValue({});
		jest.spyOn(mockBrowserInterface, 'saveOptions');
		jest.spyOn(mockBrowserInterface, 'sendMessage');
		jest.spyOn(mockBrowserInterface, 'addStorageListener');
		jest.spyOn(mockBrowserInterface, 'addMessageListener');
		jest.spyOn(mockBrowserInterface, 'openPage');
		jest.spyOn(mockBrowserInterface, 'getManifest').mockReturnValue({ version: '1.0.0' });
		jest.spyOn(mockBrowserInterface.storage.local, 'get');
		jest.spyOn(mockBrowserInterface.storage.local, 'set');
		jest.spyOn(mockBrowserInterface.storage.local, 'remove');


		// Capture the storage listener
		storageCallback = undefined; // Reset before each test
		mockBrowserInterface.addStorageListener.mockImplementation(callback => {
			storageCallback = callback;
		});

		contextMenu = new ContextMenu(mockBrowserInterface, mockMenuBuilder);
		// Reset any internal state if necessary, e.g., by re-instantiating or calling a reset method
	});

	afterEach(() => {
		jest.clearAllMocks();
		delete global.chrome;
		// contextMenu.destroy(); // If a destroy method exists to clean up listeners
	});

	describe('Initialization', () => {
		it('should initialize with default config if no stored config', async () => {
			mockBrowserInterface.loadConfig.mockResolvedValue(null); // Simulate no stored config
			await contextMenu.init();
			expect(mockMenuBuilder.removeAll).toHaveBeenCalled();
			expect(mockMenuBuilder.rootMenu).toHaveBeenCalledWith('Testudoq', expect.any(Function), expect.objectContaining({contexts: ['all']}));
			// Check for default items if any, or footer items
			expect(mockMenuBuilder.menuItem).toHaveBeenCalledWith('Customize menus', expect.any(Function), expect.objectContaining({ parentId: expect.any(String), value: 'testudo-customize-menus' }));
		});

		it('should load config from storage and build menus', async () => {
			mockBrowserInterface.loadConfig.mockResolvedValue(standardConfig);
			await contextMenu.init();
			expect(mockMenuBuilder.removeAll).toHaveBeenCalled();
			expect(mockMenuBuilder.rootMenu).toHaveBeenCalledTimes(1 + standardConfig.menus.length); // Main root + one per top-level item that's a submenu
			expect(mockMenuBuilder.menuItem).toHaveBeenCalled(); // Check for specific items based on standardConfig
		});

		it('should handle empty config correctly', async () => {
			mockBrowserInterface.loadConfig.mockResolvedValue(emptyConfig);
			await contextMenu.init();
			expect(mockMenuBuilder.removeAll).toHaveBeenCalled();
			// Check that only the static footer is created, or a minimal menu structure
			expect(mockMenuBuilder.menuItem).toHaveBeenCalledWith('Customize menus', expect.any(Function), expect.objectContaining({ value: 'testudo-customize-menus' }));
		});

		it('should handle large configurations by truncating if necessary (conceptual)', async () => {
			// This test is more conceptual as truncation logic might be complex
			// and depends on browser limits which are hard to simulate perfectly.
			// We'll assume the menu builder or browser handles actual truncation.
			// The ContextMenu class should pass the large config to the builder.
			mockBrowserInterface.loadConfig.mockResolvedValue(largeConfig); // largeConfig has 6000 items
			await contextMenu.init();
			expect(mockMenuBuilder.removeAll).toHaveBeenCalled();
			// Expect many calls, but not necessarily 6000 if there's internal batching/limits
			// For this example, we'll just check it was called.
			expect(mockMenuBuilder.rootMenu).toHaveBeenCalled();
			expect(mockMenuBuilder.menuItem).toHaveBeenCalled();
		});


		it('should set up storage listener for config changes', async () => {
			await contextMenu.init();
			expect(mockBrowserInterface.addStorageListener).toHaveBeenCalled();
			expect(storageCallback).toBeDefined(); // Check if the callback was captured
			expect(typeof storageCallback).toBe('function');
		});

		it('should set up message listener for requests', async () => {
			await contextMenu.init();
			expect(mockBrowserInterface.addMessageListener).toHaveBeenCalled();
		});

		it('should log debug information during initialization if debug mode is enabled', async () => {
			const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
			// To enable debug mode, we might need to pass an option or set a flag
			// For now, let's assume ContextMenu has a way to enable debug logging,
			// or that some logs are always present.
			// Let's modify ContextMenu to accept an options object with a debug flag.
			const opts = { debug: true };
			contextMenu = new ContextMenu(mockBrowserInterface, mockMenuBuilder, opts);
			mockBrowserInterface.loadConfig.mockResolvedValue(emptyConfig); // Use a simple config

			await contextMenu.init();

			// Check for specific debug messages. This depends on the actual logging statements.
			// Example:
			// expect(consoleDebugSpy).toHaveBeenCalledWith(expect.stringContaining('[ContextMenu] Initializing'));
			// expect(consoleDebugSpy).toHaveBeenCalledWith(expect.stringContaining('[ContextMenu] Building menus from config'));

			// For now, let's check if it was called at all, as specific messages might change.
			// The provided log output shows console.log for debug, not console.debug
			const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
			await contextMenu.init(); // Re-init with the spy active
			expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[ContextMenu Debug]'));


			consoleDebugSpy.mockRestore();
			consoleLogSpy.mockRestore();
		});
	});

	describe('Menu Rebuilding', () => {
		it('should rebuild menus when storage changes', async () => {
			await contextMenu.init(); // Initial build
			expect(storageCallback).toBeDefined();
			if (!storageCallback) { // Guard for type safety, though previous expect should catch it
				throw new Error('storageCallback was not defined after init');
			}

			// Simulate storage change
			mockBrowserInterface.loadConfig.mockResolvedValue(emptyConfig); // New config
			await storageCallback({ userConfig: {} }, 'local');


			expect(mockMenuBuilder.removeAll).toHaveBeenCalledTimes(2); // Initial + rebuild
			// Check if menus are rebuilt according to emptyConfig (e.g., only footer)
			expect(mockMenuBuilder.menuItem).toHaveBeenLastCalledWith('Help/Support', expect.any(Function), expect.objectContaining({ value: 'testudo-help-support'}));
		});

		it('should handle errors during rebuild gracefully', async () => {
			await contextMenu.init();
			expect(storageCallback).toBeDefined();
			if (!storageCallback) {
				throw new Error('storageCallback was not defined after init');
			}

			mockMenuBuilder.removeAll.mockRejectedValueOnce(new Error('Menu removal failed'));
			mockBrowserInterface.loadConfig.mockResolvedValue(standardConfig); // Ensure it tries to build something

			await expect(storageCallback({ userConfig: {} }, 'local')).resolves.toBeUndefined(); // Should not throw, but handle error

			// Check that it attempted to rebuild (removeAll was called)
			expect(mockMenuBuilder.removeAll).toHaveBeenCalledTimes(2); // Initial + failed rebuild attempt
			// Check for error logging or fallback behavior if any
			// (e.g., console.error was called, or a default menu was attempted)
			// This depends on the error handling in rebuildMenu
		});
	});

	describe('Request Handling', () => {
		const mockRequest = { type: 'INJECT_VALUE', payload: { value: 'test value' } };
		const mockTab = { id: 1 };
		const mockSender = { tab: mockTab };
		const sendResponse = jest.fn();

		beforeEach(async () => {
			// Ensure contextMenu is initialized and message listener is set up
			await contextMenu.init();
			// Capture the message listener
			// Assuming addMessageListener's callback is the request handler
			if (mockBrowserInterface.addMessageListener.mock.calls.length > 0) {
				contextMenu.requestHandler = mockBrowserInterface.addMessageListener.mock.calls[0][0];
			}
		});

		it('should delegate INJECT_VALUE to injectValueRequestHandler', async () => {
			if (!contextMenu.requestHandler) {
				throw new Error('Request handler not set up');
			}
			await contextMenu.requestHandler(mockRequest, mockSender, sendResponse);
			expect(mockBrowserInterface.sendMessage).toHaveBeenCalledWith(mockTab.id, {
				type: 'INJECT_VALUE_COMMAND',
				payload: mockRequest.payload // Removed trailing comma here
			});
			expect(sendResponse).toHaveBeenCalledWith({ status: 'success', type: 'INJECT_VALUE' });
		});

		it('should handle unknown request types', async () => {
			if (!contextMenu.requestHandler) {
				throw new Error('Request handler not set up');
			}
			const unknownRequest = { type: 'UNKNOWN_ACTION' };
			await contextMenu.requestHandler(unknownRequest, mockSender, sendResponse);
			expect(sendResponse).toHaveBeenCalledWith({ status: 'error', message: 'Unknown request type: UNKNOWN_ACTION' });
		});

		it('should handle errors in request handlers', async () => {
			if (!contextMenu.requestHandler) {
				throw new Error('Request handler not set up');
			}
			mockBrowserInterface.sendMessage.mockRejectedValueOnce(new Error('Send failed'));
			await contextMenu.requestHandler(mockRequest, mockSender, sendResponse);
			expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ status: 'error', message: expect.stringContaining('Send failed') }));
		});

		// Test for OPEN_OPTIONS_PAGE
		it('should open options page for OPEN_OPTIONS_PAGE request', async () => {
			if (!contextMenu.requestHandler) {
				throw new Error('Request handler not set up');
			}
			const optionsRequest = { type: 'OPEN_OPTIONS_PAGE' };
			await contextMenu.requestHandler(optionsRequest, mockSender, sendResponse);
			expect(mockBrowserInterface.openPage).toHaveBeenCalledWith('options.html');
			expect(sendResponse).toHaveBeenCalledWith({ status: 'success', type: 'OPEN_OPTIONS_PAGE' });
		});

		// Test for OPEN_HELP_PAGE
		it('should open help page for OPEN_HELP_PAGE request', async () => {
			if (!contextMenu.requestHandler) {
				throw new Error('Request handler not set up');
			}
			const helpRequest = { type: 'OPEN_HELP_PAGE' };
			await contextMenu.requestHandler(helpRequest, mockSender, sendResponse);
			expect(mockBrowserInterface.openPage).toHaveBeenCalledWith('help.html'); // Or your help page URL
			expect(sendResponse).toHaveBeenCalledWith({ status: 'success', type: 'OPEN_HELP_PAGE' });
		});
	});

	describe('Error Handling and Recovery', () => {
		it('should attempt to rebuild with standard config if initial rebuild fails', async () => {
			mockBrowserInterface.loadConfig.mockResolvedValue(standardConfig); // Initial load
			await contextMenu.init(); // First init is fine

			expect(storageCallback).toBeDefined();
			if (!storageCallback) {
				throw new Error('storageCallback was not defined after init');
			}

			// Simulate storage change leading to a failed rebuild
			mockBrowserInterface.loadConfig.mockResolvedValue(null); // This would cause it to try and load default
			mockMenuBuilder.removeAll.mockImplementationOnce(async () => { // First call in init is fine
				return undefined;
			}).mockImplementationOnce(async () => { // Second call in rebuild
				throw new Error('Primary rebuild removeAll failed');
			});


			await storageCallback({ userConfig: {} }, 'local');


			// It should have tried the primary rebuild (which failed at removeAll),
			// then attempted a fallback rebuild.
			// removeAll called for initial init, primary rebuild (failed), fallback rebuild
			expect(mockMenuBuilder.removeAll).toHaveBeenCalledTimes(3);
			// Check that it tried to build the standard config as a fallback
			expect(mockMenuBuilder.rootMenu).toHaveBeenCalledWith('Testudoq', expect.any(Function), expect.objectContaining({contexts: ['all']}));
		});

		it('should throw error if menu rebuild and recovery both fail', async () => {
			// Setup for initial successful init
			mockBrowserInterface.loadConfig.mockResolvedValue(standardConfig);
			await contextMenu.init();

			expect(storageCallback).toBeDefined();
			if (!storageCallback) {
				throw new Error('storageCallback was not defined after init');
			}

			// Setup for primary rebuild failure
			mockBrowserInterface.loadConfig.mockResolvedValue(null); // Config that might cause issues or just different
			mockMenuBuilder.removeAll
				.mockReset() // Reset previous calls from init
				.mockImplementationOnce(() => { throw new Error('Primary rebuild removeAll failed'); }); // Fail during the first part of rebuild

			// Setup for fallback rebuild failure
			// This means the second attempt to removeAll (for fallback) also fails
			mockMenuBuilder.removeAll.mockImplementationOnce(() => { throw new Error('Fallback rebuild removeAll failed'); });


			// Expect the storage callback (which triggers rebuild) to ultimately lead to an error being logged.
			const consoleErrorSpy = jest.spyOn(console, 'error');
			await storageCallback({ userConfig: {} }, 'local');
			expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('[ContextMenu] Initialization failed:'), expect.any(Error));
			consoleErrorSpy.mockRestore();
		});


		it('should skip rebuild if already in progress', async () => {
			mockBrowserInterface.loadConfig.mockResolvedValue(standardConfig);
			let resolveRebuild;
			mockMenuBuilder.removeAll.mockImplementationOnce(async () => { // First call in init
				return undefined;
			}).mockImplementationOnce(async () => { // Second call, during the first rebuild
				return new Promise(resolve => { resolveRebuild = resolve; }); // Hangs here
			});

			const initPromise = contextMenu.init(); // Start initialization
			// Wait a bit for init to potentially call addStorageListener and for the first rebuild to start
			await new Promise(resolve => setTimeout(resolve, 20));


			expect(storageCallback).toBeDefined();
			if (!storageCallback) {
				throw new Error('storageCallback was not defined after initPromise started and yielded');
			}
			// Trigger listener while rebuild is "in progress"
			const rebuildPromise1 = storageCallback({ userConfig: {} }, 'local');
			// Trigger listener again immediately
			const rebuildPromise2 = storageCallback({ userConfig: {} }, 'local');

			// Resolve the first rebuild
			if (resolveRebuild) {
				resolveRebuild();
			} else {
				// This case should ideally not happen if the mock is set up correctly and init proceeds as expected.
				// If resolveRebuild is not set, it means the second mock implementation of removeAll was not hit as expected.
			}


			await rebuildPromise1;
			await rebuildPromise2; // This should have been a no-op or resolved quickly
			await initPromise; // Await full completion of the initial init call

			// removeAll should be called for:
			// 1. Initial init()
			// 2. First storage event (which hangs then completes)
			// The second storage event should be skipped.
			expect(mockMenuBuilder.removeAll).toHaveBeenCalledTimes(2);
		});
	});

	describe('Static Menu Items', () => {
		it('should always add "Customize menus" and "Help/Support" items', async () => {
			mockBrowserInterface.loadConfig.mockResolvedValue(emptyConfig); // No dynamic items
			await contextMenu.init();

			expect(mockMenuBuilder.separator).toHaveBeenCalled();
			expect(mockMenuBuilder.menuItem).toHaveBeenCalledWith(
				'Customize menus',
				expect.any(Function), // Handler
				expect.objectContaining({
					parentId: expect.any(String), // ID of the main root menu
					value: 'testudo-customize-menus',
					contexts: ['all']
				})
			);
			expect(mockMenuBuilder.menuItem).toHaveBeenCalledWith(
				'Help/Support',
				expect.any(Function), // Handler
				expect.objectContaining({
					parentId: expect.any(String),
					value: 'testudo-help-support',
					contexts: ['all']
				})
			);
		});

		it('handlers for static items should trigger correct actions', async () => {
			await contextMenu.init();

			// Find the handlers passed to menuItem for static items
			const customizeCall = mockMenuBuilder.menuItem.mock.calls.find(call => call[2].value === 'testudo-customize-menus');
			const helpCall = mockMenuBuilder.menuItem.mock.calls.find(call => call[2].value === 'testudo-help-support');

			expect(customizeCall).toBeDefined();
			expect(helpCall).toBeDefined();

			const customizeHandler = customizeCall[1];
			const helpHandler = helpCall[1];

			// Simulate click on "Customize menus"
			await customizeHandler(); // No tabId or specific value needed for these global actions
			expect(mockBrowserInterface.openPage).toHaveBeenCalledWith('options.html');

			// Simulate click on "Help/Support"
			await helpHandler();
			expect(mockBrowserInterface.openPage).toHaveBeenCalledWith('help.html'); // Or your help page URL
		});
	});
});
