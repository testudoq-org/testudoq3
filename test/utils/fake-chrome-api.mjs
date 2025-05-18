import { jest } from '@jest/globals';

export default class FakeChromeApi {
	constructor() {
		const createEvent = () => ({
			addListener: jest.fn(),
			removeListener: jest.fn()
		});

		this.runtime = {
			onMessage: createEvent()
		};

		this.scripting = {
			executeScript: jest.fn().mockResolvedValue([{ result: true }])
		};

		this.contextMenus = {
			create: jest.fn(),
			removeAll: jest.fn().mockResolvedValue(undefined),
			onClicked: createEvent(),
			update: jest.fn().mockResolvedValue(undefined),
			getAll: jest.fn().mockResolvedValue([])
		};

		this.tabs = {
			sendMessage: jest.fn().mockResolvedValue({ success: true }),
			executeScript: jest.fn().mockResolvedValue([{ result: true }]),
			query: jest.fn().mockResolvedValue([{ id: 1 }])
		};

		this.storage = {
			local: {
				get: jest.fn().mockResolvedValue({}),
				set: jest.fn().mockResolvedValue(undefined),
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

		// Mock clipboard API
		if (typeof navigator === 'undefined') {
			global.navigator = {};
		}
		navigator.clipboard = {
			writeText: jest.fn().mockResolvedValue(undefined),
			readText: jest.fn().mockResolvedValue('Mocked clipboard text')
		};
	}
}
