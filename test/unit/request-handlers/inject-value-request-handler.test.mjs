import { describe, it, beforeEach, afterEach, expect, jest } from '@jest/globals';
import injectValueRequestHandler from '../../../src/lib/inject-value-request-handler.mjs';
import { FakeBrowserAPI } from '../../utils/fake-chrome-api.mjs';

describe('injectValueRequestHandler', () => {
	const tabId = 123,
		requestValue = { value: 'test-value' };
	let browserInterface;

	beforeEach(() => {
		browserInterface = new FakeBrowserAPI();
	});
	describe('when successful', () => {
		it('executes script with correct file path', async () => {
			await injectValueRequestHandler(browserInterface, tabId, requestValue);
			expect(browserInterface.scripting.executeScript).toHaveBeenCalledWith({ target: { tabId: tabId }, files: ['/content-scripts/inject-value.mjs'] });
		});

		it('sends message to tab with request value', async () => {
			await injectValueRequestHandler(browserInterface, tabId, requestValue);
			expect(browserInterface.sendMessage).toHaveBeenCalledWith(tabId, requestValue);
		});

		it('returns result from sendMessage', async () => {
			const expectedResult = { success: true };
			// Ensure sendMessage is a mock that can be configured for a resolved value
			if (browserInterface.sendMessage.mockResolvedValue) { // Check if it's a Jest mock
				browserInterface.sendMessage.mockResolvedValue(expectedResult);
			} else {
				// Fallback or error if not a Jest mock, this part might need adjustment
				// based on FakeBrowserAPI's actual implementation.
				// For now, assuming it will be a Jest mock.
				// If FakeBrowserAPI uses sinon, this would be:
				// browserInterface.sendMessage.resolves(expectedResult);
				// For this refactor, we'll assume it's a Jest mock.
			}
			const result = await injectValueRequestHandler(browserInterface, tabId, requestValue);
			expect(result).toEqual(expectedResult);
		});
	});

	describe('when failures occur', () => {
		let consoleErrorSpy;

		beforeEach(() => {
			// Spy on console.error and provide a mock implementation to suppress output
			consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
		});

		afterEach(() => {
			// Restore the original console.error function
			consoleErrorSpy.mockRestore();
		});

		it('throws error if executeScript fails', async () => {
			const error = new Error('Script execution failed');
			browserInterface.scripting.executeScript.mockRejectedValue(error); // FakeBrowserAPI uses Jest mocks

			await expect(injectValueRequestHandler(browserInterface, tabId, requestValue))
				.rejects.toThrow(error);
			expect(consoleErrorSpy).toHaveBeenCalledWith('[injectValueRequestHandler] Failed:', error);
			expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
		});

		it('throws error if sendMessage fails', async () => {
			const error = new Error('Message send failed');
			browserInterface.sendMessage.mockRejectedValue(error); // FakeBrowserAPI uses Jest mocks

			await expect(injectValueRequestHandler(browserInterface, tabId, requestValue))
				.rejects.toThrow(error);
			expect(consoleErrorSpy).toHaveBeenCalledWith('[injectValueRequestHandler] Failed:', error);
			expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
		});
	});
});
