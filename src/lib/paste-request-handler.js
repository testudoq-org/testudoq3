const copyToClipboard = require('./copy-request-handler');

/**
 * Handles pasting a value from the clipboard.
 * Copies the value to the clipboard and executes the /paste.js script in the specified tab.
 *
 * @param {Object} browserInterface - The browser interface object
 * @param {number} tabId - The id of the tab where the paste operation should occur
 * @param {Object} request - The request object containing the data to be pasted
 * @return {Promise} A promise that resolves when the /paste.js script is executed
 */
module.exports = function pasteRequestHandler(browserInterface, tabId, request) {
	console.log('Starting pasteRequestHandler');
	console.log('browserInterface:', browserInterface);
	console.log('tabId:', tabId);
	console.log('request:', request);

	// Copy the value to the clipboard
	copyToClipboard(browserInterface, tabId, request)
		.then(() => {
			console.log('copyToClipboard completed');
			// Execute the /paste.js script
			return browserInterface.executeScript(tabId, 'paste.js');
		})
		.then(() => {
			console.log('executeScript completed');
		})
		.catch((error) => {
			console.error('Error while pasting:', error);
			console.log('Error stack trace:', error.stack);
		});
};
