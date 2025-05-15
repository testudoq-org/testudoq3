console.log('paste.mjs loaded');
/* global chrome */

const pasteHandler = {
	/**
	 * Handles the pasting of text from the clipboard.
	 * @returns {Promise<string>} The processed text from clipboard
	 * @throws {Error} If there is an error reading the clipboard
	 */
	async handlePaste() {
		try {
			const textFromClipboard = await navigator.clipboard.readText(),
				parts = textFromClipboard.split(':'),
				submenuText = parts.length > 1 ? parts[1].trim() : textFromClipboard;

			console.log('Pasted submenu text:', submenuText);
			return submenuText;
		} catch (error) {
			console.error('Error reading text from clipboard:', error);
			throw error;
		}
	}
};

// Initialize paste handler on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		if (request.command === 'paste') {
			pasteHandler.handlePaste()
				.then(result => sendResponse({ success: true, text: result }))
				.catch(error => sendResponse({ success: false, error: error.message }));
			return true;
		}
	});
});
