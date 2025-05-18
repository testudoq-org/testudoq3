/**
 * Request handler for injecting a value into a tab.
 *
 * @param {Object} browserInterface - The browser interface object.
 * @param {number} tabId - The ID of the tab to inject the value into.
 * @param {Object} requestValue - The value to be injected.
 * @return {Promise} A promise that resolves to the result of executing the script and sending the message.
 */
export default async function injectValueRequestHandler(browserInterface, tabId, requestValue) {
	try {
		console.log('[injectValueRequestHandler] Starting injection operation with:', {
			tabId,
			request: JSON.stringify(requestValue, null, 2)
		});

		// Execute script with correct path
		await browserInterface.executeScript(tabId, {
			target: { tabId },
			files: ['/content-scripts/inject-value.mjs']
		});

		// Send message
		return browserInterface.sendMessage(tabId, requestValue);
	} catch (error) {
		console.error('[injectValueRequestHandler] Failed:', error);
		throw error;
	}
}
