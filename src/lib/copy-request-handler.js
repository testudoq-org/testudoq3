const getRequestValue = require('./get-request-value');

/**
 * This module exports a function that handles a copy request by copying a
 * value to the clipboard.
 *
 * @module copy-request-handler
 */

/**
 * Function that handles a copy request by copying a value to the clipboard.
 *
 * @param {Object} browserInterface - The browser interface object.
 * @param {number} tabId - The ID of the tab in which the copy request was made.
 * @param {Object} request - The request object.
 * @return {undefined} This function does not return a value.
 */
module.exports = function copyRequestHandler(browserInterface, tabId, request) {
	// Get the value of the request and copy it to the clipboard.
	// The getRequestValue function is exported from the 'get-request-value.js' file.
	browserInterface.copyToClipboard(getRequestValue(request));
};
