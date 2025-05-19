/* global describe, it, beforeEach, expect */
import { jest } from '@jest/globals';
import ContextMenu from '../src/lib/context-menu.mjs';
import FakeChromeApi from './utils/fake-chrome-api.mjs';
import config from '../temp_config.json';

describe('ContextMenu', () => {
	let chromeApi, browserInterface, underTest, processMenuObject, menuBuilder;

	beforeEach(() => {
		// Initialize fake chrome API
		chromeApi = new FakeChromeApi();
		global.chrome = chromeApi;

		processMenuObject = jest.fn();
		menuBuilder = {
			rootMenu: jest.fn(),
			separator: jest.fn(),
			menuItem: jest.fn(),
			removeAll: jest.fn(),
			subMenu: jest.fn(),
			choice: jest.fn()
		};

		browserInterface = {
			getOptionsAsync: jest.fn(),
			openSettings: jest.fn(),
			addStorageListener: jest.fn(),
			executeScript: jest.fn(),
			sendMessage: jest.fn(),
			showMessage: jest.fn(),
			requestPermissions: jest.fn(),
			removePermissions: jest.fn(),
			openUrl: jest.fn()
		};

		// Set up mock implementations
		browserInterface.executeScript.mockResolvedValue({});
		browserInterface.sendMessage.mockResolvedValue({});
		browserInterface.requestPermissions.mockResolvedValue(true);
		browserInterface.removePermissions.mockResolvedValue(true);
		menuBuilder.rootMenu.mockReturnValue({ fake: 'root' });
		menuBuilder.removeAll.mockResolvedValue({});

		underTest = new ContextMenu(config.menus, browserInterface, menuBuilder, processMenuObject);
	});

	describe('Menu Structure', () => {
		it('creates menu structure from config', async () => {
			await underTest.init();
			expect(processMenuObject).toHaveBeenCalledWith(
				config.menus,
				menuBuilder,
				{ fake: 'root' },
				expect.any(Function)
			);
		});

		it('creates Test > SubMenu > Test Item hierarchy', async () => {
			await underTest.init();
			const subMenuCalls = menuBuilder.subMenu.mock.calls;
			expect(subMenuCalls[0][0]).toBe('Test');
			expect(subMenuCalls[1][0]).toBe('SubMenu');
		});
	});

	describe('Copy/Paste Functionality', () => {
		let clickHandler;

		beforeEach(async () => {
			browserInterface.getOptionsAsync.mockResolvedValue({});
			await underTest.init();
			clickHandler = processMenuObject.mock.calls[0][3];
		});
		it('injects content script with correct path for paste operation', async () => {
			await clickHandler(1, 'test_value', true);
			expect(browserInterface.executeScript).toHaveBeenCalledWith(
				1,
				'/content-scripts/paste.mjs'
			);
		});

		it('injects content script with correct path for inject operation', async () => {
			await clickHandler(1, 'test_value', false);
			expect(browserInterface.executeScript).toHaveBeenCalledWith(
				1,
				'/content-scripts/inject-value.mjs'
			);
		});

		it('requests clipboard permissions for paste operations', async () => {
			const turnOnPasting = menuBuilder.choice.mock.calls[1]?.[2];
			if (turnOnPasting) {
				await turnOnPasting();
				expect(browserInterface.requestPermissions)
					.toHaveBeenCalledWith(['clipboardRead', 'clipboardWrite']);
			}
		});

		it('handles clipboard permission denial gracefully', async () => {
			browserInterface.requestPermissions.mockRejectedValue(new Error('Permission denied'));
			const turnOnPasting = menuBuilder.choice.mock.calls[1]?.[2];
			if (turnOnPasting) {
				await turnOnPasting();
				expect(browserInterface.showMessage)
					.toHaveBeenCalledWith('Could not access clipboard');
			}
		});

		it('revokes clipboard permissions when disabling paste', async () => {
			const turnOffPasting = menuBuilder.choice.mock.calls[0]?.[2];
			if (turnOffPasting) {
				await turnOffPasting();
				expect(browserInterface.removePermissions)
					.toHaveBeenCalledWith(['clipboardRead', 'clipboardWrite']);
			}
		});
	});

	describe('Error Handling', () => {
		let clickHandler;

		beforeEach(async () => {
			browserInterface.getOptionsAsync.mockResolvedValue({});
			await underTest.init();
			clickHandler = processMenuObject.mock.calls[0][3];
		});

		it('handles script injection failures', async () => {
			browserInterface.executeScript.mockRejectedValue(new Error('Injection failed'));
			await expect(clickHandler(1, 'test'))
				.rejects.toThrow('Injection failed');
			expect(browserInterface.showMessage)
				.toHaveBeenCalledWith('Action failed: Injection failed');
		});

		it('handles missing target tab errors', async () => {
			browserInterface.executeScript.mockRejectedValue(new Error('Cannot access tab'));
			await expect(clickHandler(1, 'test'))
				.rejects.toThrow('Cannot access tab');
			expect(browserInterface.showMessage)
				.toHaveBeenCalledWith('Action failed: Cannot access tab');
		});
	});
});
