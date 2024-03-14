/**
 * Request handler for injecting a value into a tab.
 *
 * @param {Object} browserInterface - The browser interface object.
 * @param {number} tabId - The ID of the tab to inject the value into.
 * @param {Object} requestValue - The value to be injected.
 * @return {Promise} A promise that resolves to the result of executing the script and sending the message.
 */
module.exports = function injectValueRequestHandler(browserInterface, tabId, requestValue) {
	/**
	 * Executes the 'inject-value.js' script in the given tab, then sends a message 
	 * with the given request value to the same tab.
	 */
	return browserInterface.executeScript(tabId, '/inject-value.js') // Execute script
		.then(() => browserInterface.sendMessage(tabId, requestValue)); // Send message
};
