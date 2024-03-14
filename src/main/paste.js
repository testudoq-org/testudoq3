// paste.js
/*
This function, fallbackPasteFromClipboard, attempts to paste text from the clipboard
using a workaround method if the Clipboard API (navigator.clipboard.readText()) is not supported
or if the user denies permission.

Here's a breakdown of what it does:

1. It creates a new textarea element and sets its style to be completely invisible and positioned
   off-screen.
2. It appends this invisible textarea to the document.
3. It focuses the textarea, which triggers the browser's built-in paste functionality.
4. It retrieves the text that was just pasted from the textarea.
5. It removes the invisible textarea from the document.
6. It trims any leading or trailing spaces from the pasted text and returns it.
*/

/**
 * Fallback function for pasting text from the clipboard.
 * This function creates a hidden textarea, appends it to the document,
 * focuses it to trigger the browser's built-in paste functionality,
 * retrieves the pasted text, removes the textarea from the document,
 * and trims any leading/trailing spaces from the pasted text before returning it.
 *
 * @return {string} The pasted text with leading/trailing spaces removed.
 */
function fallbackPasteFromClipboard() {
    console.log('fallbackPasteFromClipboard: Starting...');
  
    // Create a hidden textarea
    const hiddenTextarea = document.createElement('textarea');
    
    // Set the textarea's style to be completely invisible and positioned off-screen
    hiddenTextarea.style.position = 'absolute';
    hiddenTextarea.style.left = '-9999px';
    
    // Append the textarea to the document
    console.log('fallbackPasteFromClipboard: Appending textarea to document');
    document.body.appendChild(hiddenTextarea);
    
    // Focus the textarea to trigger the browser's built-in paste functionality
    console.log('fallbackPasteFromClipboard: Focusing hiddenTextarea');
    hiddenTextarea.focus();
    
    // Execute paste using document.execCommand('paste')
    console.log('fallbackPasteFromClipboard: Executing document.execCommand("paste")');
    document.execCommand('paste');
    
    // Retrieve pasted text
    const pastedText = hiddenTextarea.value;
    console.log(`fallbackPasteFromClipboard: Pasted text: ${pastedText}`);
    
    // Remove the textarea from the document
    console.log('fallbackPasteFromClipboard: Removing textarea from document');
    document.body.removeChild(hiddenTextarea);
    
    // Trim leading/trailing spaces and return the pasted text
    console.log('fallbackPasteFromClipboard: Trimming pastedText and returning');
    return pastedText.trim();
  }
  
  
  /**
   * Asynchronously attempts to paste text from the clipboard.
   * If the Clipboard API is supported and the user grants permission,
   * the function uses it to get the clipboard data.
   * If the Clipboard API is not supported or the user denies permission,
   * the function falls back to using document.execCommand('paste').
   *
   * @return {Promise<string>} The pasted text with leading/trailing spaces trimmed.
   */
  async function pasteFromClipboard() {
    try {
      // Try using Clipboard API
      console.log('pasteFromClipboard: Attempting to use Clipboard API');
      const clipboardData = await navigator.clipboard.readText();
      console.log(`pasteFromClipboard: Clipboard data retrieved: ${clipboardData}`);
      return clipboardData.trim(); // Remove leading/trailing spaces
    } catch (error) {
      // If Clipboard API has issues, fall back to document.execCommand('paste')
      console.warn('Clipboard API not supported or permission denied. Falling back to document.execCommand("paste").');
      console.log('pasteFromClipboard: Falling back to document.execCommand("paste")');
      return fallbackPasteFromClipboard();
    }
  }
  
  // Export the main function
  export default pasteFromClipboard;
  
  