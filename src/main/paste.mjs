/**
 * This function handles the pasting of text from the clipboard.
 * It reads the text from the clipboard and processes it as needed.
 *
 * @return {Promise<void>} - A promise that resolves when the text from the clipboard is processed.
 * @throws {Error} - If there is an error reading the text from the clipboard.
 */
export const handlePaste = async () => {
	try {
		// Read text from clipboard using the Clipboard API.
		const textFromClipboard = await navigator.clipboard.readText(),
			// Process the pasted text as needed.
			// In this example, let's assume the pasted text is structured as "Menu: Submenu".
			// We'll split the text to extract only the submenu item.
			parts = textFromClipboard.split(':'),
			submenuText = parts.length > 1 ? parts[1].trim() : textFromClipboard;

		// Log the extracted submenu text to the console.
		console.log('Pasted submenu text:', submenuText);
		return submenuText;
	} catch (error) {
		// If there is an error reading the text from the clipboard,
		// log the error to the console.
		console.error('Error reading text from clipboard:', error);
		throw error;
	}
};

// Initialize paste handler on DOMContentLoaded
document.addEventListener('DOMContentLoaded', handlePaste);
