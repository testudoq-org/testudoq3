// paste.js

/**
 * This function handles the pasting of text from the clipboard.
 * It reads the text from the clipboard and processes it as needed.
 *
 * @return {Promise<void>} - A promise that resolves when the text from the clipboard is processed.
 * @throws {Error} - If there is an error reading the text from the clipboard.
 */
async function handlePaste() {
	try {
		// Read text from clipboard using the Clipboard API.
		// The readText() method returns a promise that resolves with the text data from the clipboard.
		const textFromClipboard = await navigator.clipboard.readText();

		// Process the pasted text as needed.
		// In this example, we are just logging the pasted text to the console.
		console.log('Pasted text:', textFromClipboard);
	} catch (error) {
		// If there is an error reading the text from the clipboard,
		// log the error to the console.
		console.error('Error reading text from clipboard:', error);
	}
}

// Add an event listener to trigger handlePaste when the DOM content is loaded
document.addEventListener('DOMContentLoaded', handlePaste);

