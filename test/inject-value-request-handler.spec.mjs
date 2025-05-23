import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import injectValueRequestHandler from '../template/lib/inject-value-request-handler.mjs';
import { FakeBrowserAPI } from './utils/fake-chrome-api.mjs';

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
			expect(browserInterface.executeScript).to.have.been.calledWith(tabId, '/content-scripts/inject-value.mjs');
		});

		it('sends message to tab with request value', async () => {
			await injectValueRequestHandler(browserInterface, tabId, requestValue);
			expect(browserInterface.sendMessage).to.have.been.calledWith(tabId, requestValue);
		});

		it('returns result from sendMessage', async () => {
			const expectedResult = { success: true },
				result = await injectValueRequestHandler(browserInterface, tabId, requestValue);
			browserInterface.sendMessage.resolves(expectedResult);
			expect(result).to.deep.equal(expectedResult);
		});
	});

	describe('when failures occur', () => {
		it('throws error if executeScript fails', async () => {
			const error = new Error('Script execution failed');
			browserInterface.executeScript.rejects(error);

			await expect(injectValueRequestHandler(browserInterface, tabId, requestValue))
				.to.be.rejectedWith(error);
		});

		it('throws error if sendMessage fails', async () => {
			const error = new Error('Message send failed');
			browserInterface.sendMessage.rejects(error);

			await expect(injectValueRequestHandler(browserInterface, tabId, requestValue))
				.to.be.rejectedWith(error);
		});
	});
});
