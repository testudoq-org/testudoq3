import { jest, describe, it, beforeEach, afterEach, expect } from '@jest/globals';
import { FakeBrowserAPI as FakeChromeApi } from '../utils/fake-chrome-api.mjs';

describe('Copy/Paste Workflow', () => {
	let chrome, targetInput;

	beforeEach(() => {
		chrome = new FakeChromeApi();
		global.chrome = chrome;

		// Setup test DOM
		targetInput = document.createElement('input');
		targetInput.id = 'targetInput';
		document.body.appendChild(targetInput);

		// Ensure navigator.clipboard and its methods are mocked if not already
		// This might be better placed in setupTests.js
		if (!navigator.clipboard) {
			Object.defineProperty(navigator, 'clipboard', {
				value: {
					readText: jest.fn(),
					writeText: jest.fn() // Removed trailing comma
				},
				configurable: true,
				writable: true // Removed trailing comma
			});
		} else {
			if (!navigator.clipboard.readText) {
				navigator.clipboard.readText = jest.fn();
			}
			if (!navigator.clipboard.writeText) {
				navigator.clipboard.writeText = jest.fn();
			}
		}
	});

	afterEach(() => {
		document.body.removeChild(targetInput);
		jest.clearAllMocks();
		// Clean up navigator.clipboard mock if it was created here
		// delete navigator.clipboard; // Or reset to original if that's preferred
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
			// Assuming onMessage.addListener is a jest.fn() from FakeBrowserAPI
			// and its first call's first argument is the listener function.
			if (chrome.runtime.onMessage.addListener.mock.calls.length > 0) {
				await chrome.runtime.onMessage.addListener.mock.calls[0][0]({
					type: 'INIT_MENU',
					config: testConfig
				});
			} else {
				// If addListener was not called yet, this test part might need rethinking
				// or ensure the listener is added before this test runs if applicable.
				// For now, this handles the case where it might not have been called.
				// A more robust way would be to directly invoke the listener if it's stored.
				// This depends on how onMessage.addListener is intended to be used/tested.
				// Let's assume for now it's called elsewhere or this structure is okay.
				// If the listener is added in the code being tested, then this is fine.

				// To make this test more robust, let's assume the listener IS added by the code under test
				// and we need to simulate that. If the listener is supposed to be pre-existing for this test,
				// then the test setup should add it.
				// For now, we'll proceed assuming the application code adds the listener and this test
				// is trying to invoke it. If no listener is added, the test might not check anything.
				// A better approach for testing listeners is often to capture the listener function
				// when addListener is called, and then invoke that captured function directly.
				// Example:
				// const onMessageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
				// await onMessageListener({ type: 'INIT_MENU', config: testConfig });
				// This requires the SUT (System Under Test) to have called addListener.
			}


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
			if (chrome.runtime.onMessage.addListener.mock.calls.length > 0) {
				const onMessageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
				await onMessageListener({
					type: 'PASTE_VALUE',
					value: testValue,
					tabId: 1
				});
			}


			// Verify script injection
			expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
				target: { tabId: 1 },
				files: ['/content-scripts/paste.mjs']
			});

			// Verify clipboard operations
			expect(navigator.clipboard.readText).toHaveBeenCalled();
			expect(targetInput.value).toBe(testValue); // This assumes paste.mjs sets the value
		});

		it('handles clipboard permission errors gracefully', async () => {
			navigator.clipboard.readText.mockRejectedValue(new Error('Permission denied'));

			if (chrome.runtime.onMessage.addListener.mock.calls.length > 0) {
				const onMessageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
				await onMessageListener({
					type: 'PASTE_VALUE',
					value: testValue,
					tabId: 1
				});
			}


			expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
				type: 'SHOW_ERROR',
				message: 'Could not access clipboard'
			});
		});

		it('handles script injection failures', async () => {
			chrome.scripting.executeScript.mockRejectedValue(new Error('Script injection failed'));

			if (chrome.runtime.onMessage.addListener.mock.calls.length > 0) {
				const onMessageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
				await onMessageListener({
					type: 'PASTE_VALUE',
					value: testValue,
					tabId: 1
				});
			}

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
			if (chrome.contextMenus.onClicked.addListener.mock.calls.length > 0) {
				const onClickedListener = chrome.contextMenus.onClicked.addListener.mock.calls[0][0];
				await onClickedListener({
					menuItemId: 'visa-card',
					value: testValue
				}, { id: 1 });
			}


			// Verify script injection
			expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
				target: { tabId: 1 },
				files: ['/content-scripts/paste.mjs']
			});

			// Verify final state
			expect(targetInput.value).toBe(testValue); // Assumes paste.mjs sets value
			expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
				type: 'PASTE_COMPLETE',
				success: true
			});
		});
	});
});
