/* global chrome */
const executeRequest = require('../lib/inject-value-to-active-element'),

	/**
 * Listener function for handling incoming requests.
 *
 * @param {Object} request - The request object containing the data.
 * @param {Object} [sender] - The sender of the request.
 * @param {Function} [sendResponse] - The function to send the response.
 * @returns {boolean} Indicates if the response will be sent asynchronously.
 */
	listener = function (request, sender, sendResponse) {
	// Log the received request
		console.log('Received request:', request);

		try {
		// Execute the request
			const result = executeRequest(request);
			// Send a response if needed
			if (sendResponse) {
				sendResponse({ result: result });
			}
		} catch (error) {
			console.error('Error executing request:', error);
			if (sendResponse) {
				sendResponse({ error: error.message });
			}
		}

		// Return true if the response will be sent asynchronously
		return true;
	};

// Log that the listener is being added
console.log('Adding listener');
chrome.runtime.onMessage.addListener(listener);
