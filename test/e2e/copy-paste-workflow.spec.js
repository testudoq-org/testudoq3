/* global describe, it, beforeEach, afterEach, expect, document */
import { jest } from '@jest/globals';
import FakeChromeApi from '../utils/fake-chrome-api.js';

describe('Copy/Paste Workflow', () => {
	let chrome, targetInput;

	beforeEach(() => {
		chrome = new FakeChromeApi();
		global.chrome = chrome;

		// Setup test DOM
		targetInput = document.createElement('input');
		targetInput.id = 'targetInput';
		document.body.appendChild(targetInput);
	});

	afterEach(() => {
		document.body.removeChild(targetInput);
		jest.clearAllMocks();
	});

	describe('Context Menu Creation', () => {
		const testConfig = {
			Testudoq: {
				Vantiv: {
					'Credit Card': {
						Visa: '4457010000000009'
					}
				}
			}
		};

		it('initializes context menu with correct structure', async () => {
			chrome.storage.local.get.mockResolvedValue({ config: testConfig });

			// Trigger menu initialization
			await chrome.runtime.onMessage.addListener.mock.calls[0][0]({
				type: 'INIT_MENU',
				config: testConfig
			});

			const createCalls = chrome.contextMenus.create.mock.calls;
			expect(createCalls.length).toBeGreaterThan(0);

			// Verify menu hierarchy
			expect(createCalls[0][0].title).toBe('Testudoq');
			expect(createCalls[1][0].title).toBe('Vantiv');
			expect(createCalls[2][0].title).toBe('Credit Card');
			expect(createCalls[3][0].title).toBe('Visa');
		});
	});

	describe('Paste Operation', () => {
		const testValue = '4457010000000009';

		it('completes paste operation successfully', async () => {
			// Mock clipboard read
			chrome.tabs.query.mockResolvedValue([{ id: 1 }]);
			navigator.clipboard.readText.mockResolvedValue(testValue);

			// Trigger paste operation
			await chrome.runtime.onMessage.addListener.mock.calls[0][0]({
				type: 'PASTE_VALUE',
				value: testValue,
				tabId: 1
			});

			// Verify script injection
			expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
				target: { tabId: 1 },
				files: ['/content-scripts/paste.mjs']
			});

			// Verify clipboard operations
			expect(navigator.clipboard.readText).toHaveBeenCalled();
			expect(targetInput.value).toBe(testValue);
		});

		it('handles clipboard permission errors gracefully', async () => {
			navigator.clipboard.readText.mockRejectedValue(new Error('Permission denied'));

			await chrome.runtime.onMessage.addListener.mock.calls[0][0]({
				type: 'PASTE_VALUE',
				value: testValue,
				tabId: 1
			});

			expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
				type: 'SHOW_ERROR',
				message: 'Could not access clipboard'
			});
		});

		it('handles script injection failures', async () => {
			chrome.scripting.executeScript.mockRejectedValue(new Error('Script injection failed'));

			await chrome.runtime.onMessage.addListener.mock.calls[0][0]({
				type: 'PASTE_VALUE',
				value: testValue,
				tabId: 1
			});

			expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
				type: 'SHOW_ERROR',
				message: 'Action failed: Script injection failed'
			});
		});
	});

	describe('Complete Copy/Paste Flow', () => {
		const testValue = '4457010000000009';

		it('executes full copy-paste workflow', async () => {
			// Setup initial conditions
			chrome.tabs.query.mockResolvedValue([{ id: 1 }]);
			navigator.clipboard.readText.mockResolvedValue(testValue);

			// Simulate context menu click
			await chrome.contextMenus.onClicked.addListener.mock.calls[0][0]({
				menuItemId: 'visa-card',
				value: testValue
			}, { id: 1 });

			// Verify script injection
			expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
				target: { tabId: 1 },
				files: ['/content-scripts/paste.mjs']
			});

			// Verify final state
			expect(targetInput.value).toBe(testValue);
			expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
				type: 'PASTE_COMPLETE',
				success: true
			});
		});
	});
});
