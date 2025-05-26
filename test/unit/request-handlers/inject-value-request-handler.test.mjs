// test/unit/request-handlers/inject-value-request-handler.test.mjs
import { describe, it, expect, beforeEach, jest as jestGlobals } from '@jest/globals';
import injectValueRequestHandler from '../../../src/lib/inject-value-request-handler.mjs';

// Use jestGlobals.fn() instead of jest.fn()
const { fn } = jestGlobals;

describe('injectValueRequestHandler', () => {
	let mockBrowserInterface;
	const tabId = 123;
	const requestValue = { data: 'testData' };
	const expectedReturnValue = { success: true };
	const scriptPath = '/content-scripts/inject-value.mjs';

	beforeEach(() => {
		mockBrowserInterface = {
			executeScript: fn().mockResolvedValue(undefined),
			sendMessage: fn().mockResolvedValue(expectedReturnValue)
		};
	});

	it('should call executeScript and then sendMessage on success, and return sendMessage result', async () => {
		expect.assertions(3);
		const result = await injectValueRequestHandler(mockBrowserInterface, tabId, requestValue);

		expect(mockBrowserInterface.executeScript).toHaveBeenCalledWith(tabId, scriptPath);
		expect(mockBrowserInterface.sendMessage).toHaveBeenCalledWith(tabId, requestValue);
		expect(result).toBe(expectedReturnValue);
	});

	it('should throw the original error if executeScript rejects', async () => {
		expect.assertions(2);
		const executionError = new Error('Execution failed');
		mockBrowserInterface.executeScript.mockRejectedValue(executionError);

		await expect(injectValueRequestHandler(mockBrowserInterface, tabId, requestValue))
			.rejects.toBe(executionError);
		expect(mockBrowserInterface.sendMessage).not.toHaveBeenCalled();
	});

	it('should throw the original error if sendMessage rejects', async () => {
		expect.assertions(3);
		const sendMessageError = new Error('Send failed');
		mockBrowserInterface.sendMessage.mockRejectedValue(sendMessageError);

		await expect(injectValueRequestHandler(mockBrowserInterface, tabId, requestValue))
			.rejects.toBe(sendMessageError);
		expect(mockBrowserInterface.executeScript).toHaveBeenCalledWith(tabId, scriptPath);
		expect(mockBrowserInterface.sendMessage).toHaveBeenCalledWith(tabId, requestValue);
	});
});
