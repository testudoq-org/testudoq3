/**
 * Constructor function for ChromeBrowserInterface.
 *
 * @param {Object} chrome - The Chrome object to interact with the Chrome browser API.
 */
module.exports = function ChromeBrowserInterface(chrome) {

	const self = this;

	/**
	 * Saves the provided options to the Chrome browser's sync storage.
	 *
	 * @param {Object} options - The options to save.
	 */
	self.saveOptions = function (options) {
		// Saves the provided options to the Chrome browser's sync storage.
		// @param {Object} options - The options to save.
		chrome.storage.sync.set(options);
	};
	/**
	 * Retrieves the options stored in the Chrome browser's sync storage.
	 *
	 * @return {Promise} A promise that resolves to the options object.
	 */
	self.getOptionsAsync = function () {
		// Returns a promise that resolves to the options object stored in the Chrome browser's sync storage.
		// The promise is resolved using the 'resolve' function passed to the Promise constructor.
		return new Promise((resolve) => {
			// Retrieve the options from the Chrome browser's sync storage.
			// The 'get' method takes two arguments: the object key (null, to retrieve all keys),
			// and a callback function to be called with the retrieved data.
			chrome.storage.sync.get(null, resolve);
		});
	};
	/**
	 * Opens the options page of the Chrome extension.
	 *
	 * This function first checks if the `openOptionsPage` method is available in the `chrome.runtime` object.
	 * If it is, it calls that method to open the options page.
	 * If it is not, it constructs a URL using the `getURL` method and opens a new window with that URL.
	 */
	self.openSettings = function () {
		// Check if the `openOptionsPage` method is available in the `chrome.runtime` object.
		if (chrome.runtime.openOptionsPage) {
			// If it is, call the `openOptionsPage` method to open the options page.
			chrome.runtime.openOptionsPage();
		} else {
			// If it is not, construct a URL using the `getURL` method and open a new window with that URL.
			window.open(chrome.runtime.getURL('options.html'));
		}
	};
	/**
	 * Opens the specified URL in a new browser tab using chrome.tabs.create.
	 *
	 * @param {string} url - The URL to open.
	 */
	self.openUrl = function (url) {
		// Check if the `chrome` object and `tabs.create` method are available.
		if (!chrome || !chrome.tabs || !chrome.tabs.create) {
			throw new Error('chrome.tabs.create is not available');
		}
		// Use chrome.tabs.create to open the URL in a new tab.
		chrome.tabs.create({ url: url }, function (tab) {
			if (chrome.runtime.lastError) {
				console.error(`Error opening tab: ${chrome.runtime.lastError.message}`);
			} else {
				console.log(`Tab created with id: ${tab.id}`);
			}
		});
	};
	/**
	 * Adds a listener to the Chrome browser's storage to be notified when changes occur.
	 *
	 * @param {function} listener - The callback function to be called when changes occur.
	 * 								The function will receive the changes as its first argument.
	 *
	 * This function adds a listener to the Chrome browser's `onChanged` event.
	 * When a change occurs in the storage, it calls the provided `listener`
	 * function with the changes as its first argument.
	 * The listener function is only called when the change occurs in the 'sync' storage area.
	 */
	self.addStorageListener = function (listener) {
		// Add a listener to the Chrome browser's onChanged event.
		// When a change occur in the storage, it calls the provided listener function with the changes as its first argument.
		// The listener function is only called when the change occur in the 'sync' storage area.
		chrome.storage.onChanged.addListener(function (changes, areaName) {
			// Check if the change occur in the 'sync' storage area.
			if (areaName === 'sync') {
				// Call the provided listener function with the changes as its first argument.
				listener(changes);
			}
		});
	};
	/**
	 * Fetches the contents of a remote file from the specified URL.
	 *
	 * @param {string} url - The URL of the remote file.
	 * @returns {Promise<string>} A promise that resolves to the contents of the file,
	 * 							  or rejects with an error if the network request fails.
	 *
	 * This function uses the Fetch API to make a CORS GET request to the specified URL.
	 * If the response is successful (status code 200-299), it resolves the promise with
	 * the text content of the response. Otherwise, it throws an error with a message
	 * indicating a network error reading the remote URL.
	 */
	self.getRemoteFile = function (url) {
		// Fetches the contents of a remote file from the specified URL.
		// @param {string} url - The URL of the remote file.
		// @returns {Promise<string>} A promise that resolves to the contents of the file,
		// 							  or rejects with an error if the network request fails.
		return fetch(url, { mode: 'cors' })
			.then(function (response) {
				// Check if the response status code is within the success range (200-299).
				if (response.ok) {
					// Resolve the promise with the text content of the response.
					return response.text();
				} else {
					// Throw an error with a message indicating a network error reading the remote URL.
					throw new Error('Network error reading the remote URL');
				}
			});
	};
	/**
	 * Closes the current browser window.
	 *
	 * @returns {void}
	 */
	self.closeWindow = function () {
		// Invokes the Window.close() method to close the current browser window.
		window.close();
	};
	/**
	 * Asynchronously reads the contents of a file and returns a promise that resolves
	 * with the file contents, or rejects with an error if reading the file fails.
	 *
	 * @param {File} fileInfo - The file object to read.
	 * @returns {Promise<string>} A promise that resolves with the file contents,
	 * 							  or rejects with an error if reading the file fails.
	 */
	self.readFile = async function (fileInfo) {
		// Create a new FileReader instance.
		const reader = new FileReader(),
			// Create a promise that resolves with the file contents when the FileReader
			// completes reading the file, or rejects with an error if reading the file fails.
			promise = new Promise((resolve, reject) => {
				// Define event handlers for the FileReader instance.
				reader.onload = () => resolve(reader.result); // Resolve the promise with the file contents when the FileReader completes reading the file.
				reader.onerror = reject; // Reject the promise with an error if reading the file fails.
			});
		// Start reading the file as text with UTF-8 encoding.
		reader.readAsText(fileInfo, 'UTF-8');
		// Return the promise that resolves with the file contents or rejects with an error.
		return promise;
	};
	/**
	 * Asynchronously executes a script in a specified tab.
	 *
	 * @param {number} tabId - The ID of the tab to execute the script in.
	 * @param {string} source - The path to the script file to execute.
	 * @returns {Promise<Object>} A promise that resolves with the results of the script
	 *                             execution, or rejects with an error if there is an issue
	 *                             executing the script.
	 */
	self.executeScript = function (tabId, source) {
		if (tabId === null || tabId === undefined) {
			return Promise.reject(new Error('tabId is null or undefined'));
		}
		if (source === null || source === undefined) {
			return Promise.reject(new Error('source is null or undefined'));
		}

		return new Promise((resolve, reject) => {
			chrome.scripting.executeScript({
				target: { tabId: tabId },
				files: [source]
			}, (injectionResults) => {
				if (chrome.runtime.lastError) {
					reject(new Error(chrome.runtime.lastError.message));
				} else {
					resolve(injectionResults);
				}
			});
		});
	};

	/**
	 * Sends a message to a specified tab.
	 *
	 * @param {number} tabId - The ID of the tab to send the message to.
	 * @param {Object} message - The message to send.
	 * @throws {Error} If tabId or message is null or undefined.
	 * @throws {Error} If there is an error sending the message.
	 * @return {Promise} A promise that resolves with the result of the message send,
	 * 					 or rejects with an error.
	 */
	self.sendMessage = async function (tabId, message) {
		// Check if the tabId and message parameters are not null or undefined.
		if (tabId === null || tabId === undefined) {
			throw new Error('tabId is null or undefined');
		}
		if (message === null || message === undefined) {
			throw new Error('message is null or undefined');
		}

		// Use the chrome.tabs.sendMessage method to send the message to the specified tab.
		try {
			const result = await chrome.tabs.sendMessage(tabId, message);
			// Resolve the promise with the result of the message send.
			return result;
		} catch (err) {
			// If there is an error sending the message, throw an error with a descriptive message.
			throw new Error(`Failed to send message to tab ${tabId}: ${err.message}`);
		}
	};
	/**
	 * Requests the specified permissions from the user.
	 *
	 * @param {Array} permissionsArray - The array of permissions to request.
	 * @throws {Error} If permissionsArray is null or undefined.
	 * @throws {Error} If the permission request fails.
	 * @throws {Error} If there is an error requesting permissions.
	 * @return {Promise} A promise that resolves if the permissions are granted,
	 * 					 or rejects with an error.
	 */
	self.requestPermissions = async (permissionsArray) => {
		// Check if the permissionsArray parameter is not null or undefined.
		if (!permissionsArray) {
			throw new Error('permissionsArray is null or undefined');
		}

		try {
			// Use the chrome.permissions.request method to request the permissions.
			const result = await chrome.permissions.request({ permissions: permissionsArray });

			// Check if the permission request was successful.
			if (!result) {
				throw new Error('Permission request failed');
			}
		} catch (error) {
			// If there is an error requesting permissions, throw an error with a descriptive message.
			throw new Error(`Failed to request permissions: ${error.message}`);
		}
	};
	/**
	 * Removes the specified permissions from the user.
	 *
	 * @param {Array} permissionsArray - The array of permissions to remove.
	 * @return {Promise} A promise that resolves if the permissions are removed,
	 * 					 or rejects with an error.
	 */
	self.removePermissions = function (permissionsArray) {
		// Use the chrome.permissions.remove method to remove the specified permissions.
		// The permissionsArray parameter contains the array of permissions to remove.
		// The promise is resolved if the permissions are successfully removed.
		// It is rejected with an error if there is an error removing the permissions.
		return new Promise((resolve) => {
			chrome.permissions.remove({ permissions: permissionsArray }, resolve);
		});
	};
	/**
	 * Copies the given text to the clipboard.
	 *
	 * @param {string} text - The text to be copied.
	 * @throws {Error} If the text cannot be copied to the clipboard.
	 */
	self.copyToClipboard = (text) => {
		// Attempt to write the text to the clipboard.
		return navigator.clipboard.writeText(text)
			.catch((err) => {
				// If there is an error copying the text to the clipboard, log the error and throw an error with a descriptive message.
				console.error('Failed to copy text to clipboard:', err.message);
				throw new Error('Unable to copy text to clipboard');
			});
	};
	/**
	 * Shows a message in the active tab of the current window.
	 *
	 * @param {string} text - The text of the message to be displayed.
	 * @throws {Error} If there is an error showing the message.
	 */
	self.showMessage = function (text) {
		// Query the active and current window tabs.
		chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
			// Get the ID of the first (and only) tab in the array.
			const currentTabId = tabs[0].id;

			// Execute a script on the current tab, passing the message text as an argument.
			chrome.scripting.executeScript({
				target: { tabId: currentTabId },
				func: (message) => alert(message),
				args: [text]
			});
		});
	};

};
