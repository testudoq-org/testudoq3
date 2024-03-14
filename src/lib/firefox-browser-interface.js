/* eslint-disable no-tabs */
module.exports = function BrowserInterface(browser) {
	const self = this;

	/**
   * Saves the provided options to the browser's sync storage.
   *
   * @param {Object} options - The options to save.
   */
	self.saveOptions = function (options) {
		// Saves the provided options to the browser's sync storage.
		// The options object is stored in the 'sync' storage area.
		browser.storage.sync.set(options);
	};

	/**
   * Asynchronously retrieves the options stored in the browser's sync storage.
   *
   * @return {Promise} A Promise that resolves to an Object containing the
   *         options. The Promise is rejected if an error occurs.
   */
	self.getOptionsAsync = function () {
		// Retrieves the options stored in the browser's sync storage using
		// the 'get' method of the 'storage.sync' API, which returns a Promise.
		// The 'get' method takes a single argument, which is the key of the data
		// to retrieve. Since we want to retrieve all keys, we pass 'null'.
		return browser.storage.sync.get(null);
	};

	/**
   * Opens the options page of the extension.
   *
   * This function uses the 'openOptionsPage' method of the 'runtime'
   * interface, which is specific to the Firefox WebExtension API.
   * It is used to open the options page of the extension.
   */
	self.openSettings = function () {
		// Open the options page of the extension.
		// The 'openOptionsPage' method is used to open the options page.
		// It opens the options page in a new tab.
		browser.runtime.openOptionsPage();
	};

	/**
   * Opens the specified URL in a new browser tab.
   *
   * @param {string} url - The URL to open.
   */
	self.openUrl = function (url) {
		// Uses the 'create' method of the 'tabs' interface, which is specific
		// to the Firefox WebExtension API. It creates a new browser tab with the
		// specified URL.
		// The 'create' method takes an object as a parameter, which specifies the
		// properties of the new tab. In this case, we only need to specify the
		// 'url' property, so we pass an object with a single property, 'url',
		// which is set to the provided URL.
		browser.tabs.create({
			url // The URL of the new tab
		});
	};

	/**
   * Adds a listener to the browser's storage to be notified when changes occur.
   *
   * @param {function} listener - The callback function to be called when changes occur.
   *                             The function will receive the changes as its first argument.
   *
   * This function adds a listener to the browser's 'onChanged' event.
   * When a change occur in the storage, it calls the provided 'listener'
   * function with the changes as its first argument.
   * The listener function is only called when the change occur in the 'sync' storage area.
   */
	self.addStorageListener = function (listener) {
		// Add a listener to the browser's 'onChanged' event.
		// When a change occur in the storage, it calls the provided 'listener' function
		// with the changes as its first argument.
		// The listener function is only called when the change occur in the 'sync' storage area.
		browser.storage.onChanged.addListener((changes, areaName) => {
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
   *                            or rejects with an error if the network request fails.
   * @throws {Error} Network error reading the remote URL - If the network request fails.
   */
	self.getRemoteFile = function (url) {
		// Uses the Fetch API to make a CORS GET request to the specified URL.
		// If the response is successful (status code 200-299), it resolves the promise
		// with the text content of the response. Otherwise, it throws an error with a message
		// indicating a network error reading the remote URL.
		return fetch(url, {
			mode: 'cors' // Set the mode to 'cors' to allow the request to be made.
		})
			.then((response) => {
				if (response.ok) {
					// Resolve the promise with the text content of the response.
					return response.text();
				}
				// Throw an error with a message indicating a network error reading the remote URL.
				throw new Error('Network error reading the remote URL');
			});
	};

	/**
   * Closes the current browser window.
   *
   * @returns {void}
   */
	self.closeWindow = function () {
		// Uses the 'windows.getCurrent' method to get the ID of the current window.
		// Then, uses the 'windows.remove' method to close the window with the retrieved ID.

		// Get the ID of the current window.
		browser.windows.getCurrent((window) => {
			// Close the window with the retrieved ID.
			browser.windows.remove(window.id);
		});
	};

	/**
   * Asynchronously reads the contents of a file and returns a promise that resolves
   * with the file contents, or rejects with an error if reading the file fails.
   *
   * @param {File} fileInfo - The file object to read.
   * @returns {Promise<string>} A promise that resolves with the file contents,
   *                             or rejects with an error if reading the file fails.
   */
	self.readFile = function (fileInfo) {
		// Create a new FileReader instance.
		return new Promise((resolve, reject) => {
			// Create a new FileReader instance.
			const fileReader = new FileReader();

			// Define event handlers for the FileReader instance.
			// Resolve the promise with the file contents when the FileReader completes reading the file.
			fileReader.onload = () => resolve(fileReader.result);
			// Reject the promise with an error if reading the file fails.
			fileReader.onerror = reject;

			// Start reading the file as text with UTF-8 encoding.
			fileReader.readAsText(fileInfo, 'UTF-8');
		});
	};


	/**
   * Asynchronously executes a script in a specified tab.
   *
   * @param {number} tabId - The ID of the tab to execute the script in.
   * @param {string} source - The script code to be executed.
   * @return {Promise} A promise that resolves with the results of the script
   * execution, or rejects with an error if there is an issue executing the script.
   */
	self.executeScript = function (tabId, source) {
		// Use the 'tabs.executeScript' method to execute the script in the specified tab.
		// The 'code' property specifies the script code to be executed.
		return browser.tabs.executeScript(tabId, {
			code: source
		});
	};

	/**
   * Asynchronously sends a message to a specified tab.
   *
   * @param {number} tabId - The ID of the tab to send the message to.
   * @param {Object} message - The message to send.
   * @return {Promise} A promise that resolves with the result of the message
   * send, or rejects with an error if there is an issue sending the message.
   */
	self.sendMessage = function (tabId, message) {
		// Use the 'tabs.sendMessage' method to send the message to the specified tab.
		// The method takes the tab ID and the message as parameters and returns a promise
		// that resolves with the result of the message send, or rejects with an error.
		return browser.tabs.sendMessage(tabId, message);
	};


	/**
   * Asynchronously requests permissions from the user.
   *
   * @param {Array} permissionsArray - The array of permissions to request.
   * @return {Promise} A promise that resolves if the permissions are granted,
   * 					 or rejects with an error if there is an issue requesting the permissions.
   */
	self.requestPermissions = function (permissionsArray) {
		// Use the 'browser.permissions.request' method to request the specified permissions.
		// The 'permissions' property specifies the array of permissions to request.
		// The method returns a promise that resolves if the permissions are granted,
		// or rejects with an error if there is an issue requesting the permissions.
		return browser.permissions.request({
			permissions: permissionsArray
		});
	};

	/**
   * Asynchronously removes permissions from the user.
   *
   * @param {Array} permissionsArray - The array of permissions to remove.
   * @return {Promise} A promise that resolves if the permissions are removed,
   * 					 or rejects with an error if there is an issue removing the permissions.
   */
	self.removePermissions = function (permissionsArray) {
		// Use the 'browser.permissions.remove' method to remove the specified permissions.
		// The 'permissions' property specifies the array of permissions to remove.
		// The method returns a promise that resolves if the permissions are removed,
		// or rejects with an error if there is an issue removing the permissions.
		return browser.permissions.remove({
			permissions: permissionsArray
		});
	};

	/**
   * Asynchronously copies the provided text to the user's clipboard.
   *
   * @param {string} text - The text to be copied to the clipboard.
   * @return {Promise} A promise that resolves if the text is successfully
   * copied to the clipboard, or rejects with an error if there is an issue
   * copying the text.
   */
	self.copyToClipboard = function (text) {
		// Use the 'navigator.clipboard.writeText' method to copy the provided text
		// to the user's clipboard. This method returns a promise that resolves if
		// the text is successfully copied to the clipboard, or rejects with an
		// error if there is an issue copying the text.
		return navigator.clipboard.writeText(text);
	};

	/**
   * Asynchronously displays a message in an alert dialog.
   *
   * @param {string} text - The text to display in the alert dialog.
   * @return {void} This function does not return anything.
   */
	self.showMessage = function (text) {
		// Displays a message in an alert dialog.
		// This function takes a parameter 'text' which is the text to display.
		// It uses the JavaScript built-in 'alert' function to display the text.
		// The 'alert' function displays a dialog with a message and an OK button.
		// The 'alert' function does not return a value, so it does not return anything.
		alert(text);
	};
};
