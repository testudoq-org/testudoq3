const copyToClipboard = require('./copy-request-handler');

/**
 * Handles a paste request by copying the request value to the clipboard and
 * executing the 'paste.js' script in the specified tab.
 *
 * @param {Object} browserInterface - The browser interface object.
 * @param {number} tabId - The ID of the tab in which the paste request was made.
 * @param {Object} request - The request object.
 * @return {Promise} A promise that resolves to the result of the executed script.
 */
module.exports = function pasteRequestHandler(browserInterface, tabId, request) {
	// Copy the request value to the clipboard
	copyToClipboard(browserInterface, tabId, request);

	// Execute the 'paste.js' script in the specified tab
	return browserInterface.executeScript(tabId, '/paste.js');
};
