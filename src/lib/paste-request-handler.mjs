import copyToClipboard from './copy-request-handler.mjs';

/**
 * Handles a paste request by copying the request value to the clipboard and
 * executing the 'paste.js' script in the specified tab.
 *
 * @param {Object} browserInterface - The browser interface object.
 * @param {number} tabId - The ID of the tab in which the paste request was made.
 * @param {Object} request - The request object.
 * @return {Promise} A promise that resolves to the result of the executed script.
 */
export default async function pasteRequestHandler(browserInterface, tabId, request) {
	try {
		console.log('[pasteRequestHandler] Starting paste operation with:', {
			tabId,
			request: JSON.stringify(request, null, 2)
		});

		// Copy the request value to the clipboard
		console.log('[pasteRequestHandler] Attempting to copy to clipboard...');
		await copyToClipboard(browserInterface, tabId, request);
		console.log('[pasteRequestHandler] Clipboard copy successful');

		// Execute the 'paste.js' script using chrome.scripting API
		console.log('[pasteRequestHandler] Attempting to execute paste script...');
		const result = await browserInterface.executeScript(tabId, {
			target: { tabId },
			files: ['/content-scripts/paste.mjs']
		});
		console.log('[pasteRequestHandler] Script execution result:', result);
		return result;
	} catch (error) {
		console.error('[pasteRequestHandler] Failed:', error);
		throw error;
	}
}
