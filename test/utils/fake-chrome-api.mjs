import { jest } from '@jest/globals';

export class FakeBrowserAPI {
	constructor() {
		const createEvent = () => ({
			addListener: jest.fn(),
			removeListener: jest.fn()
		});

		// Top-level sendMessage, used by inject-value-request-handler.test.mjs
		// Consider if this should be namespaced under runtime or tabs eventually.
		this.sendMessage = jest.fn().mockResolvedValue({ success: true });

		this.runtime = {
			onMessage: createEvent(),
			sendMessage: jest.fn().mockResolvedValue({ success: true }), // Added for chrome.runtime.sendMessage
			lastError: undefined // Ensure lastError can be checked
		};

		this.scripting = {
			executeScript: jest.fn().mockResolvedValue([{ result: true }])
		};

		this.contextMenus = {
			create: jest.fn((options, callback) => {
				// The real API calls the callback with no arguments if successful,
				// or sets runtime.lastError.
				// When used with await, it resolves (often to undefined, or the id if specified).
				// For testing, returning the ID is most useful if the SUT expects it.
				// The SUT's ChromeMenuBuilder expects the ID to be returned from the awaited call.
				if (callback) {
					callback(); // Simulate callback invocation
				}
				return Promise.resolve(options.id); // Resolve with the ID provided in options
			}),
			removeAll: jest.fn((callback) => {
				// Simulate async behavior and callback for removeAll
				if (typeof callback === 'function') {
					Promise.resolve().then(callback); // Call callback asynchronously
				}
				return Promise.resolve(undefined);
			}),
			onClicked: createEvent(),
			update: jest.fn().mockResolvedValue(undefined),
			getAll: jest.fn().mockResolvedValue([])
		};

		this.tabs = {
			query: jest.fn().mockResolvedValue([{ id: 1 }])
			// chrome.tabs.sendMessage could be added here if needed
		};

		this.storage = {
			local: {
				get: jest.fn().mockResolvedValue({}),
				set: jest.fn().mockResolvedValue(undefined),
				remove: jest.fn().mockResolvedValue(undefined), // Added missing 'remove'
				clear: jest.fn().mockResolvedValue(undefined)
			},
			sync: {
				get: jest.fn().mockResolvedValue({}),
				set: jest.fn().mockResolvedValue(undefined)
			},
			onChanged: createEvent()
		};

		this.permissions = {
			request: jest.fn().mockResolvedValue(true),
			remove: jest.fn().mockResolvedValue(true),
			contains: jest.fn().mockResolvedValue(true)
		};
	}
}
