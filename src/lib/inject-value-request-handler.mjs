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
		// Execute script using chrome.scripting API
		await browserInterface.executeScript(tabId, '/content-scripts/inject-value.mjs');

		// Send the message after script injection
		return await browserInterface.sendMessage(tabId, requestValue);
	} catch (error) {
		console.error('[injectValueRequestHandler] Failed:', error);
		throw error;
	}
}
