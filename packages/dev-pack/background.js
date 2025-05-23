/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/lib/chrome-browser-interface.js":
/*!*********************************************!*\
  !*** ./src/lib/chrome-browser-interface.js ***!
  \*********************************************/
/***/ ((module) => {

/* global chrome */
module.exports = function ChromeBrowserInterface(chrome) {
const self = this;

/**
 * Gets the ID of the active tab in the current window.
 * 
 * @returns {Promise<number>} A promise that resolves with the active tab ID.
 */
self.getActiveTabId = function() {
return new Promise((resolve, reject) => {
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
if (chrome.runtime.lastError) {
reject(new Error(chrome.runtime.lastError.message));
return;
}
if (!tabs || !tabs.length) {
reject(new Error('No active tab found'));
return;
}
resolve(tabs[0].id);
});
});
};

/**
 * Saves options to Chrome storage.
 * @param {Object} options - The options to save.
 */
self.saveOptions = function(options) {
chrome.storage.sync.set(options);
};

/**
 * Gets options from Chrome storage.
 * @returns {Promise<Object>} A promise resolving to the options.
 */
self.getOptionsAsync = function() {
return new Promise((resolve) => {
chrome.storage.sync.get(null, resolve);
});
};

/**
 * Opens the options/settings page.
 */
self.openSettings = function() {
if (chrome.runtime.openOptionsPage) {
chrome.runtime.openOptionsPage();
} else {
window.open(chrome.runtime.getURL('options.html'));
}
};

/**
 * Opens a URL in a new tab.
 * @param {string} url - The URL to open.
 */
self.openUrl = function(url) {
if (!chrome?.tabs?.create) {
throw new Error('chrome.tabs.create is not available');
}
chrome.tabs.create({ url: url }, (tab) => {
if (chrome.runtime.lastError) {
console.error(`Error opening tab: ${chrome.runtime.lastError.message}`);
} else {
console.log(`Tab created with id: ${tab.id}`);
}
});
};

/**
 * Adds a storage change listener.
 * @param {Function} listener - The listener function.
 */
self.addStorageListener = function(listener) {
chrome.storage.onChanged.addListener((changes, areaName) => {
if (areaName === 'sync') {
listener(changes);
}
});
};

/**
 * Gets remote file content.
 * @param {string} url - The URL of the file.
 * @returns {Promise<string>} The file content.
 */
self.getRemoteFile = function(url) {
return fetch(url, { mode: 'cors' })
.then((response) => {
if (response.ok) {
return response.text();
}
throw new Error('Network error reading the remote URL');
});
};

/**
 * Closes the current window.
 */
self.closeWindow = function() {
window.close();
};

/**
 * Reads a file asynchronously.
 * @param {File} fileInfo - The file to read.
 * @returns {Promise<string>} The file content.
 */
self.readFile = async function(fileInfo) {
const reader = new FileReader(),
promise = new Promise((resolve, reject) => {
reader.onload = () => resolve(reader.result);
reader.onerror = reject;
});

reader.readAsText(fileInfo, 'UTF-8');
return promise;
};

/**
 * Executes a script in a tab.
 * @param {number} tabId - The tab ID.
 * @param {string} source - The script source.
 * @returns {Promise<Object>} The execution result.
 */
self.executeScript = function(tabId, source) {
if (tabId == null) {
return Promise.reject(new Error('tabId is required'));
}
if (!source) {
return Promise.reject(new Error('source is required'));
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
 * Sends a message to a tab.
 * @param {number} tabId - The tab ID.
 * @param {Object} message - The message to send.
 * @returns {Promise<any>} The response.
 */
self.sendMessage = async function(tabId, message) {
if (tabId == null) {
throw new Error('tabId is required');
}
if (!message) {
throw new Error('message is required');
}

try {
return await chrome.tabs.sendMessage(tabId, message);
} catch (err) {
throw new Error(`Failed to send message to tab ${tabId}: ${err.message}`);
}
};

/**
 * Requests permissions.
 * @param {string[]} permissionsArray - The permissions to request.
 */
self.requestPermissions = async function(permissionsArray) {
if (!permissionsArray) {
throw new Error('permissionsArray is required');
}

try {
const result = await chrome.permissions.request({ permissions: permissionsArray });
if (!result) {
throw new Error('Permission request failed');
}
} catch (error) {
throw new Error(`Failed to request permissions: ${error.message}`);
}
};

/**
 * Removes permissions.
 * @param {string[]} permissionsArray - The permissions to remove.
 * @returns {Promise<void>}
 */
self.removePermissions = function(permissionsArray) {
return new Promise((resolve) => {
chrome.permissions.remove({ permissions: permissionsArray }, resolve);
});
};

/**
 * Copies text to clipboard.
 * @param {string} text - The text to copy.
 */
self.copyToClipboard = async function(text) {
try {
await navigator.clipboard.writeText(text);
} catch (err) {
console.error('Failed to copy text to clipboard:', err.message);
throw new Error('Unable to copy text to clipboard');
}
};

/**
 * Shows a message in the active tab.
 * @param {string} text - The message to show.
 */
self.showMessage = function(text) {
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
const currentTabId = tabs[0].id;
chrome.scripting.executeScript({
target: { tabId: currentTabId },
func: (message) => alert(message),
args: [text]
});
});
};

};


/***/ }),

/***/ "./src/lib/chrome-menu-builder.js":
/*!****************************************!*\
  !*** ./src/lib/chrome-menu-builder.js ***!
  \****************************************/
/***/ ((module) => {

/**
 * Initializes a ChromeMenuBuilder with the given chrome object.
 *
 * @param {Object} chrome - the chrome object to use for building menus
 */
module.exports = function ChromeMenuBuilder(chrome) {
	let itemValues = {},
		itemHandlers = {},
		menuCounter = 0;
	const MENU_PREFIX = 'testudo_',
		contexts = ['editable'],
		self = this,
		generateId = (type, title = '') => {
			menuCounter++;
			const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
			return `${MENU_PREFIX}${type}_${sanitizedTitle}_${menuCounter}`;
		};

	/**
	 * Creates a root menu with the given title.
	 *
	 * @param {string} title - The title of the root menu
	 * @return {string} The ID of the created root menu
	 */
	self.rootMenu = function (title) {
		return chrome.contextMenus.create({
			id: generateId('root', title),
			title,
			contexts
		});
	};

	/**
	 * Creates a submenu with the given title and parentMenu.
	 *
	 * @param {string} title - The title of the submenu
	 * @param {string} parentMenu - The ID of the parent menu
	 * @return {string} The ID of the created submenu
	 */
	self.subMenu = function (title, parentMenu) {
		return chrome.contextMenus.create({
			id: generateId('sub', title),
			title,
			parentId: parentMenu,
			contexts
		});
	};

	/**
	 * Creates a separator menu item in the given parent menu.
	 *
	 * @param {string} parentMenu - The ID of the parent menu
	 * @return {string} The ID of the created separator menu item
	 */
	self.separator = function (parentMenu) {
		return chrome.contextMenus.create({
			id: generateId('sep'),
			type: 'separator',
			parentId: parentMenu,
			contexts
		});
	};

	/**
	 * Creates a menu item with the given title, parentMenu, clickHandler and value.
	 *
	 * @param {string} title - The title of the menu item
	 * @param {string} parentMenu - The ID of the parent menu
	 * @param {function} clickHandler - The click handler for the menu item
	 * @param {any} value - The value of the menu item
	 * @return {string} The ID of the created menu item
	 */
	self.menuItem = function (title, parentMenu, clickHandler, value) {
		const id = chrome.contextMenus.create({
			id: generateId('item', title),
			title,
			parentId: parentMenu,
			contexts
		});
		itemValues[id] = value;
		itemHandlers[id] = clickHandler;
		return id;
	};

	/**
	 * Creates a radio button menu item with the given title, parentMenu, clickHandler and value.
	 *
	 * @param {string} title - The title of the radio button menu item
	 * @param {string} parentMenu - The ID of the parent menu
	 * @param {function} clickHandler - The click handler for the radio button menu item
	 * @param {any} value - The value of the radio button menu item
	 * @return {string} The ID of the created radio button menu item
	 */
	self.choice = function (title, parentMenu, clickHandler, value) {
		const id = chrome.contextMenus.create({
			id: generateId('choice', title),
			type: 'radio',
			checked: value,
			title,
			parentId: parentMenu,
			contexts
		});
		itemHandlers[id] = clickHandler;
		itemValues[id] = value;
		return id;
	};

	/**
	 * Removes all context menu items and resets itemHandlers and itemValues.
	 *
	 * @return {Promise} A promise that resolves when all context menu items are removed.
	 */
	self.removeAll = function () {
		itemValues = {};
		itemHandlers = {};
		menuCounter = 0;

		return new Promise((resolve) => {
			chrome.contextMenus.removeAll(resolve);
		});
	};

	chrome.contextMenus.onClicked.addListener((info, tab) => {
		const itemId = info && info.menuItemId;
		if (itemHandlers[itemId]) {
			itemHandlers[itemId](tab.id, itemValues[itemId]);
		}
	});

	/**
	 * Selects a choice by updating the checked state of the given menu item ID.
	 *
	 * @param {string} menuId - The ID of the menu item to update.
	 * @return {Promise} A Promise that resolves when the menu item is updated.
	 */
	self.selectChoice = function (menuId) {
		return chrome.contextMenus.update(menuId, { checked: true });
	};
};


/***/ }),

/***/ "./src/lib/context-menu.js":
/*!*********************************!*\
  !*** ./src/lib/context-menu.js ***!
  \*********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const injectValueRequestHandler = __webpack_require__(/*! ./inject-value-request-handler */ "./src/lib/inject-value-request-handler.js"),
	pasteRequestHandler = __webpack_require__(/*! ./paste-request-handler */ "./src/lib/paste-request-handler.js"),
	copyRequestHandler = __webpack_require__(/*! ./copy-request-handler */ "./src/lib/copy-request-handler.js"),
	gremlinsAttackHandler = __webpack_require__(/*! ./gremlins-attack-handler */ "./src/lib/gremlins-attack-handler.js");

module.exports = function ContextMenu(standardConfig, browserInterface, menuBuilder, processMenuObject, pasteSupported) {
	let handlerType = 'injectValue',
		isRebuilding = false;

	const handlers = {
		injectValue: injectValueRequestHandler,
		paste: pasteRequestHandler,
		copy: copyRequestHandler,
		gremlinsAttack: gremlinsAttackHandler
	};

	function onClick(tabId, itemMenuValue) {
		if (!itemMenuValue) {
			return;
		}
		const requestValue = typeof itemMenuValue === 'string' ? { '_type': 'literal', 'value': itemMenuValue } : itemMenuValue;
		return handlers[handlerType](browserInterface, tabId, requestValue);
	}

	function turnOnPasting() {
		return browserInterface.requestPermissions(['clipboardRead', 'clipboardWrite'])
			.then(() => handlerType = 'paste')
			.catch(() => {
				browserInterface.showMessage('Could not access clipboard');
			});
	}

	function turnOffPasting() {
		handlerType = 'injectValue';
		return browserInterface.removePermissions(['clipboardRead', 'clipboardWrite']);
	}

	function turnOnCopy() {
		handlerType = 'copy';
	}

	function loadAdditionalMenus(additionalMenus, rootMenu) {
		if (additionalMenus) {
			additionalMenus.forEach(configItem => processMenuObject({ [configItem.name]: configItem.config }, menuBuilder, rootMenu, onClick));
		}
	}

	function addGenericMenus(rootMenu) {
		const handlerChoices = {},
			modeMenu = menuBuilder.subMenu('Operational mode', rootMenu);

		menuBuilder.separator(rootMenu);

		if (pasteSupported !== undefined) {
			pasteSupported = pasteSupported || true;
		}

		if (pasteSupported) {
			handlerChoices.injectValue = menuBuilder.choice('Inject value', modeMenu, turnOffPasting, true, handlerType);
			handlerChoices.paste = menuBuilder.choice('Simulate pasting', modeMenu, turnOnPasting, false, handlerType);
			handlerChoices.copy = menuBuilder.choice('Copy to clipboard', modeMenu, turnOnCopy, false, handlerType);
		}

		menuBuilder.menuItem('Customise menus', rootMenu, browserInterface.openSettings);

		menuBuilder.menuItem('Help/Support', rootMenu, () => {
			if (!browserInterface) {
				throw new TypeError('browserInterface cannot be null or undefined');
			}
			browserInterface.openUrl('https://testudo.co.nz/futterman/testudoq-help.html');
		});
	}

	async function rebuildMenu(options) {
		if (isRebuilding) {
			return;
		}

		isRebuilding = true;
		try {
			await menuBuilder.removeAll();
			const rootMenu = menuBuilder.rootMenu('Testudoq');
			if (!options || !options.skipStandard) {
				processMenuObject(standardConfig, menuBuilder, rootMenu, onClick);
			}
			loadAdditionalMenus(options && options.additionalMenus, rootMenu);
			addGenericMenus(rootMenu);
		} finally {
			isRebuilding = false;
		}
	}

	function wireStorageListener() {
		browserInterface.addStorageListener(async () => {
			const options = await browserInterface.getOptionsAsync();
			await rebuildMenu(options);
		});
	}

	this.init = async function () {
		const options = await browserInterface.getOptionsAsync();
		await rebuildMenu(options);
		wireStorageListener();
	};
};


/***/ }),

/***/ "./src/lib/copy-request-handler.js":
/*!*****************************************!*\
  !*** ./src/lib/copy-request-handler.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const getRequestValue = __webpack_require__(/*! ./get-request-value */ "./src/lib/get-request-value.js");

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


/***/ }),

/***/ "./src/lib/firefox-browser-interface.js":
/*!**********************************************!*\
  !*** ./src/lib/firefox-browser-interface.js ***!
  \**********************************************/
/***/ ((module) => {

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


/***/ }),

/***/ "./src/lib/firefox-menu-builder.js":
/*!*****************************************!*\
  !*** ./src/lib/firefox-menu-builder.js ***!
  \*****************************************/
/***/ ((module) => {

/**
 * Constructor function for ChromeMenuBuilder.
 * @param {Object} chrome - The Chrome browser API object.
 */
module.exports = function ChromeMenuBuilder(chrome) {
	// Initialize variables to store item values and handlers
	let itemValues = {},
		itemHandlers = {};

	// Reference to 'this' for accessing methods inside closures
	const self = this,

		// Contexts where the menu items can appear
		contexts = ['editable'];

	/**
   * Creates a root menu.
   * @param {string} title - The title of the root menu.
   * @returns {string} The ID of the created menu.
   */
	self.rootMenu = function (title) {
		return chrome.contextMenus.create({
			id: title + Math.random(),
			title,
			contexts
		});
	};

	/**
   * Creates a sub-menu.
   * @param {string} title - The title of the sub-menu.
   * @param {string} parentMenu - The ID of the parent menu.
   * @returns {string} The ID of the created menu.
   */
	self.subMenu = function (title, parentMenu) {
		return chrome.contextMenus.create({
			id: parentMenu + title + Math.random(),
			title,
			parentId: parentMenu,
			contexts
		});
	};

	/**
   * Creates a separator.
   * @param {string} parentMenu - The ID of the parent menu.
   * @returns {string} The ID of the created separator.
   */
	self.separator = function (parentMenu) {
		return chrome.contextMenus.create({
			id: parentMenu + Math.random(),
			type: 'separator',
			parentId: parentMenu,
			contexts
		});
	};

	/**
   * Creates a menu item.
   * @param {string} title - The title of the menu item.
   * @param {string} parentMenu - The ID of the parent menu.
   * @param {Function} clickHandler - The function to handle click events.
   * @param {any} value - The value associated with the menu item.
   * @returns {string} The ID of the created menu item.
   */
	self.menuItem = function (title, parentMenu, clickHandler, value) {
		const id = chrome.contextMenus.create({
			id: contexts + parentMenu + title + Math.random(),
			title,
			parentId: parentMenu,
			contexts
		});
		itemValues[id] = value;
		itemHandlers[id] = clickHandler;
		return id;
	};

	/**
   * Creates a choice menu item.
   * @param {string} title - The title of the menu item.
   * @param {string} parentMenu - The ID of the parent menu.
   * @param {Function} clickHandler - The function to handle click events.
   * @param {any} value - The value associated with the menu item.
   * @returns {string} The ID of the created menu item.
   */
	self.choice = function (title, parentMenu, clickHandler, value) {
		const id = chrome.contextMenus.create({
			id: `value${Math.random()}`,
			type: 'radio',
			checked: value,
			title,
			parentId: parentMenu,
			contexts
		});
		itemHandlers[id] = clickHandler;
		return id;
	};

	/**
   * Removes all created menu items.
   * @returns {Promise} A promise that resolves when all menu items are removed.
   */
	self.removeAll = function () {
		itemValues = {};
		itemHandlers = {};
		return new Promise((resolve) => chrome.contextMenus.removeAll(resolve));
	};

	// Event listener for menu item clicks
	chrome.contextMenus.onClicked.addListener((info, tab) => {
		const itemId = info && info.menuItemId;
		if (itemHandlers[itemId]) {
			itemHandlers[itemId](tab.id, itemValues[itemId]);
		}
	});

	/**
   * Selects a choice menu item.
   * @param {string} menuId - The ID of the menu item to select.
   * @returns {Promise} A promise that resolves when the menu item is selected.
   */
	self.selectChoice = function (menuId) {
		return chrome.contextMenus.update(menuId, { checked: true });
	};
};


/***/ }),

/***/ "./src/lib/get-request-value.js":
/*!**************************************!*\
  !*** ./src/lib/get-request-value.js ***!
  \**************************************/
/***/ ((module) => {

// Constants
const type_flag = '_type';

// Generators for different types of requests
const generators = {
	// Generator for literal type requests
	literal: function (request) {
		console.log('Getting literal value from request:', request);
		const value = request.value;
		console.log('get-request-value: literal Value:', value);
		return value;
	},
	// Generator for size type requests
	size: function (request) {
		console.log('Getting size value from request:', request);
		const size = parseInt(request.size, 10);
		console.log('get-request-value: size Size:', size);
		let value = request.template;
		console.log('get-request-value: size Template:', value);
		// Repeat the template until it reaches the specified size
		while (value.length < size) {
			console.log('get-request-value: size Value length:', value.length);
			console.log('get-request-value: size Template length:', request.template.length);
			value += request.template;
			console.log('get-request-value: size New Value length:', value.length);
		}
		// Trim the value to match the requested size
		const result = value.substring(0, request.size);
		console.log('get-request-value: size Result:', result);
		return result;
	}
};

/**
 * Function to get the value from a request.
 * @param {Object} request - The request object containing the value information.
 * @returns {any} The value obtained from the request.
 */
module.exports = function getRequestValue(request) {
	console.log('get-request-value: Start with request:', request);
	// Check if the request is falsy
	if (!request) {
		console.log('get-request-value: Request is falsy, returning false');
		return false;
	}
	// Get the generator based on the request type
	const generator = generators[request[type_flag]];
	console.log('get-request-value: generator:', generator);
	// If no generator found for the request type, return false
	if (!generator) {
		console.log('get-request-value: No generator found, returning false');
		return false;
	}
	console.log('get-request-value: Calling generator with request:', request);
	// Call the generator function with the request and return the result
	const result = generator(request);
	console.log('get-request-value: Result:', result);
	return result;
};


/***/ }),

/***/ "./src/lib/gremlins-attack-handler.js":
/*!********************************************!*\
  !*** ./src/lib/gremlins-attack-handler.js ***!
  \********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const Logger = __webpack_require__(/*! ./logger */ "./src/lib/logger.js");

/**
 * Simple handler for gremlins attacks that removes complex state management
 * and resource handling in favor of direct command execution
 */
async function executeGremlinsAttack(browserInterface, tabId, options = {}) {
	if (!browserInterface || !tabId) {
		throw new Error('Invalid parameters: browserInterface and tabId are required');
	}

	Logger.log('GremlinsHandler', 'Starting attack', { tabId, options });

	try {
		// Simple config with defaults
		const config = {
				attackDuration: options.duration || 15,
				species: options.species || ['clicker', 'toucher', 'formFiller', 'scroller', 'typer'],
				mogwais: options.mogwais || ['alert', 'fps', 'gizmo'],
				strategy: options.strategy || 'distribution'
			},
			response = await browserInterface.sendMessage(tabId, {
				command: 'startGremlins',
				config
			});

		Logger.log('GremlinsHandler', 'Attack started', { response });
		return response;

	} catch (error) {
		Logger.error('GremlinsHandler', 'Attack failed', error);
		throw error;
	}
}

async function stopGremlinsAttack(browserInterface, tabId) {
	if (!browserInterface || !tabId) {
		throw new Error('Invalid parameters: browserInterface and tabId are required');
	}

	Logger.log('GremlinsHandler', 'Stopping attack', { tabId });

	try {
		const response = await browserInterface.sendMessage(tabId, {
			command: 'stopGremlins'
		});

		Logger.log('GremlinsHandler', 'Attack stopped', { response });
		return response;

	} catch (error) {
		Logger.error('GremlinsHandler', 'Failed to stop attack', error);
		throw error;
	}
}

module.exports = {
	start: async function (browserInterface, tabId, options = {}) {
		if (!browserInterface) {
			throw new Error('browserInterface is required');
		}

		if (!tabId) {
			try {
				tabId = await browserInterface.getActiveTabId();
			} catch (error) {
				Logger.error('GremlinsHandler', 'Failed to get active tab', error);
				throw error;
			}
		}

		return executeGremlinsAttack(browserInterface, tabId, options);
	},
	stop: stopGremlinsAttack
};


/***/ }),

/***/ "./src/lib/inject-value-request-handler.js":
/*!*************************************************!*\
  !*** ./src/lib/inject-value-request-handler.js ***!
  \*************************************************/
/***/ ((module) => {

/**
 * Request handler for injecting a value into a tab.
 *
 * @param {Object} browserInterface - The browser interface object.
 * @param {number} tabId - The ID of the tab to inject the value into.
 * @param {Object} requestValue - The value to be injected.
 * @return {Promise} A promise that resolves to the result of executing the script and sending the message.
 */
module.exports = function injectValueRequestHandler(browserInterface, tabId, requestValue) {
	/**
	 * Executes the 'inject-value.js' script in the given tab, then sends a message 
	 * with the given request value to the same tab.
	 */
	return browserInterface.executeScript(tabId, '/inject-value.js') // Execute script
		.then(() => browserInterface.sendMessage(tabId, requestValue)); // Send message
};


/***/ }),

/***/ "./src/lib/logger.js":
/*!***************************!*\
  !*** ./src/lib/logger.js ***!
  \***************************/
/***/ ((module) => {

/* global chrome */
/**
 * Structured logging utility for TestudoQ extension
 */
const Logger = {
	PREFIX: '[TestudoQ]',

	/**
	 * Log debug message if debug mode is enabled
	 * @param {string} component - Component name
	 * @param {string} message - Log message
	 * @param {Object} [data] - Optional data to log
	 */
	log: (component, message, data) => {
		if (chrome.runtime.getManifest().debug) {
			console.log(
				`${Logger.PREFIX} [${component}]`,
				message,
				data ? JSON.stringify(data, null, 2) : ''
			);
		}
	},

	/**
	 * Log error with full context
	 * @param {string} component - Component name
	 * @param {string} message - Error message
	 * @param {Error} error - Error object
	 * @param {Object} [context] - Additional context
	 */
	error: (component, message, error, context = {}) => {
		console.error(
			`${Logger.PREFIX} [${component}] ${message}`,
			'\nError:', error,
			'\nContext:', context,
			'\nStack:', error.stack
		);
	}
};

module.exports = Logger;


/***/ }),

/***/ "./src/lib/paste-request-handler.js":
/*!******************************************!*\
  !*** ./src/lib/paste-request-handler.js ***!
  \******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const copyToClipboard = __webpack_require__(/*! ./copy-request-handler */ "./src/lib/copy-request-handler.js");

/**
 * Handles a paste request by copying the request value to the clipboard and
 * executing the 'paste.js' script in the specified tab.
 *
 * @param {Object} browserInterface - The browser interface object.
 * @param {number} tabId - The ID of the tab in which the paste request was made.
 * @param {Object} request - The request object.
 * @return {Promise} A promise that resolves to the result of the executed script.
 */
module.exports = function pasteRequestHandler(browserInterface, tabId, request) {
	// Copy the request value to the clipboard
	copyToClipboard(browserInterface, tabId, request);

	// Execute the 'paste.js' script in the specified tab
	return browserInterface.executeScript(tabId, '/paste.js');
};


/***/ }),

/***/ "./src/lib/process-menu-object.js":
/*!****************************************!*\
  !*** ./src/lib/process-menu-object.js ***!
  \****************************************/
/***/ ((module) => {

/**
 * Recursively processes a configuration object to build a menu using the
 * provided menu builder.
 *
 * @param {Object|Array} configObject - The configuration object to process.
 * @param {Object} menuBuilder - The menu builder to use.
 * @param {Object} parentMenu - The parent menu to add the processed menu items to.
 * @param {Function} onClick - The click handler for the menu items.
 */
module.exports = function processMenuObject(configObject, menuBuilder, parentMenu, onClick) {


	/**
	 * Returns the title for a given key from the config object. If the config
	 * object is an array, the value at the given key is returned. Otherwise,
	 * the key itself is returned.
	 *
	 * @param {string} key - The key to get the title for.
	 * @return {string} The title for the key.
	 */
	const getTitle = function (key) {
		if (configObject instanceof Array) {
			return configObject[key];
		}
		return key;
	};

	// If the config object is falsy, return early.
	if (!configObject) {
		return;
	}

	// Process each key and value in the config object.
	Object.keys(configObject).forEach(function (key) {
		const value = configObject[key],
			title = getTitle(key);
		let result;

		// If the value is a string or an object with a _type property, add a menu item.
		if (typeof (value) === 'string' || (typeof (value) === 'object' && value.hasOwnProperty('_type'))) {
			menuBuilder.menuItem(title, parentMenu, onClick, value);
		}
		// If the value is an object, add a sub-menu.
		else if (typeof (value) === 'object') {
			result = menuBuilder.subMenu(title, parentMenu);
			processMenuObject(value, menuBuilder, result, onClick);
		}
	});
};



/***/ }),

/***/ "./template/config.json":
/*!******************************!*\
  !*** ./template/config.json ***!
  \******************************/
/***/ ((module) => {

"use strict";
module.exports = /*#__PURE__*/JSON.parse('{"Lorems":{"Latin":"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.","Cyrillic":"Римский император Константин I Великий по достоинству оценил выгодное местоположение приморского Византия, расположенного на стыке Европы и Азии. Кроме того, на решение Константина повлияла неспокойная обстановка в самом Риме: недовольство знати и постоянные распри в борьбе за трон. Император хотел увенчать свою реформаторскую деятельность созданием нового административного центра огромной державы. Закладка города состоялась осенью 324 года, и Константин лично решил обозначить его границы.","Arabic (RTL)":"وضع ابن الهيثم تصور واضح للعلاقة بين النموذج الرياضي المثالي ومنظومة الظواهر الملحوظة.","Chinese":"北京位於華北平原的西北边缘，背靠燕山，有永定河流经老城西南，毗邻天津市、河北省，是一座有三千余年建城历史、八百六十余年建都史的历史文化名城，历史上有金、元、明、清、中华民国（北洋政府时期）等五个朝代在此定都，以及数个政权建政于此，荟萃了自元明清以来的中华文化，拥有众多历史名胜古迹和人文景观。《不列颠百科全书》将北京形容为全球最伟大的城市之一，而且断言，“这座城市是中国历史上最重要的组成部分。在中国过去的八个世纪里，不论历史是否悠久，几乎北京所有主要建筑都拥有着不可磨灭的民族和历史意义”。北京古迹众多，著名的有故宫、天坛、颐和园、圆明园、北海公园等。","Mixed charsets":"Lorem ipsum dolor sit amet, Римский император Константин I Великий, 北京位於華北平原的西北边缘","Czech":"Příliš žluťoučký kůň úpěl ďábelské ódy","Thai":"ทดสอบนะจ๊ะ","Hindi":"एक जल्दी भूरी लोमड़ी आलसी कुत्ते पर कूदता","Unicode symbols (non letters)":"Iñtërnâtiônàlizætiøn☃💪"},"Names":{"Latin charset":["John O\'Grady","Peter de Montfort","John James O\'Grady","John James \\"Jimmy\\" O\'Grady","José Casal-Giménez","María-Jose Carreño Quiñones","Milan Vojnovič","Chloë Rømer","Björk Guðmundsdóttir","Rosalind Arusha Arkadina Altalune Florence Thurman-Busson","Leone Sextus Denys Oswolf Fraudatifilius Tollemache-Tollemache de Orellana Plantagenet Tollemache-Tollemache","Alasdair Mór Ùisdean GillEasbaig \'ic Iain Mac a\' Ghobhainn Fear an t-Srònaich","Abu Karim Muhammad al-Jamil ibn Nidal ibn Abdulaziz al-Filistini","Nguyễn Tấn Dũng"],"Name length":["Rhoshandiatellyneshiaunneveshenk","StopFortnumAndMasonFoieGras","Stephen O","A Martinez","They"],"Unusual accents/chars":["Keihanaikukauakahihuliheʻekahaunaele","GoVeg.com","Number 16 Bus Shelter","John Blake Cusack 2.0"],"Other charsets":{"Japanese":"田中太郎","Japanese Tōkairin":"東海林賢蔵","Ze Dong":"泽东","Russian male":"Борис Николаевич Ельцин","Russian female":"Наина Иосифовна Ельцина","Ukrainian female":"Леся Українка","Thai nickname":"แม","Arabic":"ابن خلدون"},"Commonly thought as invalid":["Null","nil","false","Tom Test","Jeff Sample"],"Unicode case folding":"ᴮᴵᴳᴮᴵᴿᴰ","James Bond (with middle names)":"James Dr No Bond","Benevolent dictator for life":"Saurabh Shukla","Thai male names":"ชื่อชาย","Thai female names":"ชื่อหญิง"},"Post/Zip Codes":{"Alphanumeric (GB)":"EC11AA","With spaces (GB)":"EC1 1AA","4 digits (Aarau, CH)":"5004","3 digits (Kvivik, FO)":"340","10 digits (Tehran, IR)":"1193653471","New Zealand":{"Auckland":"1010","Wellington":"6011","Christchurch":"8011","Hamilton":"3204","Dunedin":"9016"}},"Cities":{"Scandinavian letters":"Ærøskøbing","Welsh":"Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch","Single letter - Norwegian":"Å","Single letter - France":"Y"},"NZ Places":{"Taumatawhaka":"Taumatawhakatangihangakoauauotamateaturipukakapiki-maungahoronukupokaiwhenuakitnatahu","Whakatane":"Whakatāne","Rotorua":"Rotorua","Auckland":"Tāmaki Makaurau","Wellington":"Te Whanganui-a-Tara","Christchurch":"Ōtautahi","Hamilton":"Kirikiriroa","Dunedin":"Ōtepoti"},"E-mail addresses":{"Valid":{"Simple":"email@domain.com","Dot in the address":"firstname.lastname@domain.com","Subdomain":"email@subdomain.domain.com","Plus in address":"firstname+lastname@domain.com","Numeric domain":"email@123.123.123.123","Square bracket around IP address":"email@[123.123.123.123]","Unnecessary quotes around address":"\\"email\\"@domain.com","Necessary quotes around address":"\\"email..email\\"@domain.com","Numeric address":"1234567890@domain.com","Dash in domain":"email@domain-one.com","Underscore":"_______@domain.com",">3 char TLD":"email@domain.name","2 char TLD":"email@domain.co.jp","Dash in address":"firstname-lastname@domain.com","Intranet":"name@localhost","Non-ascii Email":"nathan@学生优惠.com","New Zealand Prefixes":{"Government":"john.smith@msd.govt.nz","Organization":"info@organization.org.nz","Commercial":"sales@company.co.nz"}},"Invalid":{"No @ or domain":"plainaddress","Missing @":"email.domain.com","Missing address":"@domain.com","Garbage":"#@%^%#$@#$@#.com","Copy/paste from address book with name":"Joe Smith <email@domain.com>","Superfluous text":"email@domain.com (Joe Smith)","Two @":"email@domain@domain.com","Leading dot in address":".email@domain.com","Trailing dot in address":"email.@domain.com","Multiple dots":"email..email@domain.com","Unicode chars in address":"あいうえお@domain.com","Leading dash in domain":"email@-domain.com","Leading dot in domain":"email@.domain.com","Invalid IP format":"email@111.222.333.44444","Multiple dots in the domain":"email@domain..com"}},"URLs":{"Valid":["www.mysite.com","mysite.com","http://www.mysite.com","https://www.mysite.com","http://www.mysite.com:80","ftp://mysite.com","https://www.xn--80ak6aa92e.com/","http://subdomain.mysite.com","http://www.mysite.co.nz","https://subdomain.mysite.co.nz","https://www.mysite.co.nz/page","https://www.mysite.co.nz/page?param=value","https://www.mysite.co.nz/#section","https://www.mysite.co.nz/page?param=value#section","https://www.mysite.co.nz:8080"],"Invalid":["http//www.mysite.com","http:/www.mysite.com","://www.mysite.com","foo://www.mysite.com","http://:","mysite","http://www.mysite","http://www.mysite.","http://.mysite.com","http://www.-mysite.com","http://www.mysite-.com","http://www.mysite.com.","http://www.mysite-.com/page","http://www.mysite.com:/","http://www.mysite.com:abc","http://www.mysite.com:80abc","http://www.mysite.com:8080abc"]},"Numbers":["0","32767","32768","32769","65535","65536","65537","2147483647","2147483648","2147483649","4294967295","4294967296","4294967297","1E-16","-1","0.0001","1,234,567","1.234.567,89","1234567890123456789012345678901234567890","-1234567890123456789012345678901234567890"],"Amounts":["5000","$5,000","$5 000","$5,000.00","€5,000.00","¥5,000.00"],"Currencies":{"No decimals":"JPY","3 Decimals":"KWD","Multiple currencies":["USD","EUR","GBP","AUD"]},"Payment US cards":{"Authorize.net":{"Credit Card":{"Valid":{"American Express":"370000000000002","Discover":"6011000000000012","JCB":"3088000000000017","Diners Club/ Carte Blanch":"38000000000006","Visa":"4007000000027","MasterCard":"5424000000000015"},"Invalid":{"Invalid Number":"1234567890123456","Expired Card":"4111111111111111","Declined Card":"4222222222222","Incorrect CVV":"5431111111111111"},"Declined":{"Card Expired":"4000000000000069","Insufficient Funds":"4000000000009995","Card Declined":"4000000000000002"},"Out of Money":{"Out of Funds":"4000000000009995","Over Limit":"4000000000009996"},"Other":{"Cancelled Card":"4100000000000019","Lost Card":"4111111111111111","Stolen Card":"4000000000000127"}}},"New Zealand":{"Credit Card":{"Valid":{"NZ Bank Card":"5402000000000000","KiwiCard":"5610591081018250"},"Invalid":{"Invalid Number":"1234567890123456","Expired Card":"4111111111111111","Declined Card":"4222222222222","Incorrect CVV":"5431111111111111"},"Declined":{"Card Expired":"4000000000000069","Insufficient Funds":"4000000000009995","Card Declined":"4000000000000002"},"Out of Money":{"Out of Funds":"4000000000009995","Over Limit":"4000000000009996"},"Other":{"Cancelled Card":"4100000000000019","Lost Card":"4111111111111111","Stolen Card":"4000000000000127"}}}},"Zip Code":{"Declined":"46282","AVS Invalid":"46203","AVS Unavailable":"46207","Non US Bank":"46204","NZ Bank":"1010","Wellington":"6011","Auckland Central":"1010","Christchurch Central":"8011"},"CVV":{"Successful":"900","Does Not Match":"901","Not Processed":"46207","NZ CVV":"123"},"Payment Xtra cards":{"Authorize.net":{"Credit Card":{"Valid":{"American Express":"370000000000002","Discover":"6011000000000012","JCB":"3088000000000017","Diners Club/ Carte Blanch":"38000000000006","Visa":"4007000000027","MasterCard":"5424000000000015"},"Invalid":{"Invalid Number":"1234567890123456","Expired Card":"4111111111111111","Declined Card":"4222222222222","Incorrect CVV":"5431111111111111"},"Declined":{"Card Expired":"4000000000000069","Insufficient Funds":"4000000000009995","Card Declined":"4000000000000002"},"Out of Money":{"Out of Funds":"4000000000009995","Over Limit":"4000000000009996"},"Other":{"Cancelled Card":"4100000000000019","Lost Card":"4111111111111111","Stolen Card":"4000000000000127"}}},"New Zealand":{"Credit Card":{"Valid":{"NZ Bank Card":"5402000000000000","KiwiCard":"5610591081018250"},"Invalid":{"Invalid Number":"1234567890123456","Expired Card":"4111111111111111","Declined Card":"4222222222222","Incorrect CVV":"5431111111111111"},"Declined":{"Card Expired":"4000000000000069","Insufficient Funds":"4000000000009995","Card Declined":"4000000000000002"},"Out of Money":{"Out of Funds":"4000000000009995","Over Limit":"4000000000009996"},"Other":{"Cancelled Card":"4100000000000019","Lost Card":"4111111111111111","Stolen Card":"4000000000000127"}}}},"Braintree":{"Valid Credit Card":{"American Express":"378282246310005","Discover":"6011111111111117","MasterCard":"5555555555554444","Visa":"4111111111111111"},"Invalid Credit Card":{"Visa":"4000111111111115","MasterCard":"5105105105105100","American Express":"378734493671000","JCB":"3566002020360505"},"Additional Valid Cards":{"Visa":"4005519200000004","MasterCard":"5454545454545454","American Express":"378734493671000","Discover":"6011000990139424","JCB":"3530111333300000"},"Additional Invalid Cards":{"Visa":"4111111111111112","MasterCard":"5105105105105101","American Express":"371449635398431","Discover":"6011000400000000","JCB":"3566002020360506"}},"Cybersource":{"Credit Card":{"Visa":"4111111111111111","MasterCard":"5555555555554444","American Express":"378282246310005","Discover":"6011111111111117","JCB":"3566111111111113","Additional Valid Cards":{"Visa":"4005519200000004","MasterCard":"5454545454545454","American Express":"371449635398431","Discover":"6011000990139424","JCB":"3530111333300000"},"Additional Invalid Cards":{"Visa":"4111111111111112","MasterCard":"5105105105105100","American Express":"378734493671000","Discover":"6011000400000000","JCB":"3566002020360506"}}},"Payflow Pro":{"Credit Card":{"American Express":"378282246310005","American Express Corporate":"378734493671000","Diners Club":"30569309025904","Discover":"6011111111111117","JCB":"3530111333300000","MasterCard":"5555555555554444","Visa":"4111111111111111"}},"Paypal":{"Dankort PBS":"5019717010103742","American Express":"378282246310005","Visa":"4111111111111111","Discover":"6011000990139424","Visa (short)":"4222222222222","Switch/Solo (Paymentech)":"6331101999990016","Australian BankCard":"5610591081018250","Dankort PBS (short)":"76009244561","MasterCard":"5555555555554444","American Express Corporate":"378734493671000","JCB":"3566002020360505"},"Spreedly":{"Valid":{"Visa":"4111111111111111","MasterCard":"5555555555554444","American Express":"378282246310005","Discover":"6011111111111117","Diners Club":"30569309025904","JCB":"3530111333300000"},"Boundary Workflows":{"Successful charge, but...":{"funds added directly to available balance (bypassing pending)":"4000000000000077","address_line1_check and address_zip_check fail":"4000000000000010","address_line1_check fail":"4000000000000028","address_zip_check fail":"4000000000000036","address_zip_check and address_line1_check unavailable":"4000000000000044","CVC check will fail (if CVC entered)":"4000000000000101"},"Charge declined ..":{"Visa":"4012888888881881","Mastercard":"5105105105105100","American Express":"371449635398431"}}},"Stripe":{"Valid":{"Visa":"4242424242424242","Visa (debit)":"4000056655665556","MasterCard":"5555555555554444","MasterCard (debit)":"5200828282828210","MasterCard (prepaid)":"5105105105105100","American Express":"378282246310005","Discover":"6011111111111117","Diners Club":"30569309025904","JCB":"3530111333300000"},"Boundary Workflows":{"Successful charge, but...":{"funds added directly to available balance (bypassing pending)":"4000000000000077","address_line1_check and address_zip_check fail":"4000000000000010","address_line1_check fail":"4000000000000028","address_zip_check fail":"4000000000000036","address_zip_check and address_line1_check unavailable":"4000000000000044","CVC check will fail (if CVC entered)":"4000000000000101"},"Charge declined and..":{"Card still added to customer":"4000000000000341","Card declined":"4000000000000002","Fraud":"4100000000000019","Incorrect CVC":"4000000000000127","Expired Card":"4000000000000069","Processing Error":"4000000000000119"}}},"Vantiv":{"Credit Card":{"Visa":"4457010140000141","MasterCard":"5112000100000003","Discover":"6011010140000004","American Express":"375001000000005"},"CVV":{"Fail":"352","Fail Due to Security Mismatch":"358","Do Not Honor":"349","Generic Decline":"350"}},"Text size":{"With spaces":{"128b":{"_type":"size","size":"128","template":"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."},"129b":{"_type":"size","size":"129","template":"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."},"256b":{"_type":"size","size":"256","template":"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."},"257b":{"_type":"size","size":"257","template":"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."},"32K - 1":{"_type":"size","size":"32767","template":"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."},"32K":{"_type":"size","size":"32768","template":"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."},"32K + 1":{"_type":"size","size":"32769","template":"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."},"64K - 1":{"_type":"size","size":"65535","template":"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."},"64K":{"_type":"size","size":"65536","template":"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."},"64K + 1":{"_type":"size","size":"65537","template":"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}},"Without spaces":{"128b":{"_type":"size","size":"128","template":"0123456789"},"129b":{"_type":"size","size":"129","template":"0123456789"},"256b":{"_type":"size","size":"256","template":"0123456789"},"257b":{"_type":"size","size":"257","template":"0123456789"},"32K - 1":{"_type":"size","size":"32767","template":"0123456789"},"32K":{"_type":"size","size":"32768","template":"0123456789"},"32K + 1":{"_type":"size","size":"32769","template":"0123456789"},"64K - 1":{"_type":"size","size":"65535","template":"0123456789"},"64K":{"_type":"size","size":"65536","template":"0123456789"},"64K + 1":{"_type":"size","size":"65537","template":"0123456789"}}},"Whitespace":{"Tabs and newlines":"Contains\\tTabs\\nAnd\\tNewlines","Leading spaces":"  Leading spaces","Trailing spaces":"Trailing spaces  ","Mixing tabs and spaces":"\\t Leading tabs and spaces","Spaces on both sides":" Space on both sides ","Just whitespace":"\\t \\t\\n \\n ","Multiple spaces":"Multiple    spaces","Consecutive newlines":"Consecutive\\n\\nnewlines","Tab in the middle":"Tab\\tin\\tthe\\tmiddle","Leading and trailing tabs":"\\t\\tLeading and trailing tabs\\t\\t"},"Format exploits":{"SQL Injection":"Robert\'); DROP TABLE Students;--","JS Script Injection":"Nice site, I think I\'ll take it. <script>alert(\'Executing JS\')</script>","JS String (XSS) Injection - single quote":"\'-prompt()-\'","JS String (XSS) Injection - double quote":"\\"-prompt()-\\"","HTML parsing":"<blink>Hello there</blink>","Broken HTML":"<i><b>Bold</i></b>","XPath Injection":"\' or 1=1 or \'a\'=\'a","LDAP Injection":"*)(objectClass=*","XML External Entity (XXE) Injection":"<?xml version=\'1.0\' encoding=\'ISO-8859-1\'?><!DOCTYPE foo [<!ELEMENT foo ANY><!ENTITY xxe SYSTEM \'file:///etc/passwd\'>]><foo>&xxe;</foo>","Command Injection":";ls -la","Path Traversal":"../../../../../../../../../etc/passwd","Server-Side Includes (SSI) Injection":"<!--#exec cmd=\\"/bin/cat /etc/passwd\\"-->"},"Unicode":{"Direction":{"Right-to-left override":"1234‮1234","Left-to-right override":"אבגד‭אבגד","RTL without override":"אבגד","Curseword with direction switch for profanity filters":"‮kcuf‭ you"},"Looking like latin":{"Fake apple.com with cyrillic characters":"https://аррӏе.com","With cyrillic \'a\'":"https://аpple.com","Single-charset":"https://еріс.com/"},"Confusable":{"Colon variants":"：ː˸։፡᛬⁚∶⠆︓﹕","Semi-colon variants":"；;︔﹔","Equals sign variants":"＝═⚌﹦","Dollar sign variants":"＄﹩","Plus sign variants":"＋᛭﹢","Comma variants":"，ˏᛧ‚","Latin \'a\' variants":"ªᵃᵅₐⓐａ"},"Case transforms":{"Small sharp S (ß)":"ß","Turkish \'I\' (İ)":"iIİı"},"Length":{"Very long character":"﷽","Two-row character":"NͫOͬ","Letter with diacritic":"á","Symbol with symbol combiner":"←⃝","Cantillation marks":"֪֟֨A","Nonsense characters":{"Letter with symbol combiner":"A⃝","Symbol with diacritic":"←́","Only diacritic":"́","Only symbol combiner":"⃝","Only cantillation mark":"֟"},"Text with invisible spaces":{"Mongolian Vowel Separator":"two᠎words","Zero-width joiner":"two‍words","Zero-width non-joiner":"two‌words"}}},"Emoji":{"plain":"👩","variation selector":"👩🏿","zero-width space combo":"👩‍🍳","zero-width space combo and variation selector":"👩🏿‍🍳"},"World Flags":{"US Flag":"🇺🇸","Chinese Flag":"🇨🇳","Scottish Flag":"🌈🇬🇱","Indian Flag":"🇮🇳","Moldovan Flag":"🇲🇩","Philippine Flag":"🇵🇭","New Zealand Flag":"🇳🇿","Invalid Combination":"🇺🇳"},"Variation Selectors":{"VS16 (Emoji Style)":"❤️","VS15 (Text Style)":"❤︎","Nonsense":{"Just the variation selector":"️","VS16 + invalid character":"A️","VS15 + smiley":"😁︎"}}}');

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!********************************!*\
  !*** ./src/main/background.js ***!
  \********************************/
/* global browser, chrome */

const browserAPI = (typeof browser !== 'undefined') ? browser : chrome,
	ContextMenu = __webpack_require__(/*! ../lib/context-menu */ "./src/lib/context-menu.js"),
	processMenuObject = __webpack_require__(/*! ../lib/process-menu-object */ "./src/lib/process-menu-object.js"),
	standardConfig = __webpack_require__(/*! ../../template/config.json */ "./template/config.json"),
	GremlinsAttackHandler = __webpack_require__(/*! ../lib/gremlins-attack-handler */ "./src/lib/gremlins-attack-handler.js"),
	MenuBuilder = (typeof browser !== 'undefined') ?
		__webpack_require__(/*! ../lib/firefox-menu-builder */ "./src/lib/firefox-menu-builder.js") :
		__webpack_require__(/*! ../lib/chrome-menu-builder */ "./src/lib/chrome-menu-builder.js"),
	BrowserInterface = (typeof browser !== 'undefined') ?
		__webpack_require__(/*! ../lib/firefox-browser-interface */ "./src/lib/firefox-browser-interface.js") :
		__webpack_require__(/*! ../lib/chrome-browser-interface */ "./src/lib/chrome-browser-interface.js"),
	menuBuilderInstance = new MenuBuilder(browserAPI),
	browserInterfaceInstance = new BrowserInterface(browserAPI),
	isFirefox = (typeof browser !== 'undefined'),
	contextMenu = new ContextMenu(
		standardConfig,
		browserInterfaceInstance,
		menuBuilderInstance,
		processMenuObject,
		isFirefox
	),
	MESSAGE_TYPES = {
		START: 'startGremlins',
		STOP: 'stopGremlins',
		UPDATE: 'updateConfig',
		STATE: 'gremlinStateUpdate',
		CONTENT_READY: 'GREMLINS_CONTENT_READY'
	},
	messageQueue = new Map(),
	tabStates = new Map();

function queueMessage(tabId, message) {
	if (!messageQueue.has(tabId)) {
		messageQueue.set(tabId, []);
	}
	messageQueue.get(tabId).push(message);
}

function processMessageQueue(tabId) {
	const messages = messageQueue.get(tabId),
		ready = tabStates.get(tabId);

	if (!messages || messages.length === 0) {
		return;
	}

	if (!ready) {
		return;
	}

	while (messages.length > 0) {
		const message = messages.shift();
		browserAPI.tabs.sendMessage(tabId, message)
			.catch(error => console.warn('Failed to send queued message:', error));
	}
}

async function handleGremlinsAction(action, tab, config) {
	if (!tab || !tab.id) {
		throw new Error('Invalid tab');
	}

	const ready = tabStates.get(tab.id),
		message = {
			command: action === 'start' ? MESSAGE_TYPES.START : MESSAGE_TYPES.STOP
		};

	if (!ready) {
		if (config) {
			message.payload = config;
		}
		queueMessage(tab.id, message);
		return { status: 'queued' };
	}

	try {
		if (action === 'start') {
			await GremlinsAttackHandler.start(browserInterfaceInstance, tab.id, config);
			await browserAPI.runtime.sendMessage({
				command: MESSAGE_TYPES.STATE,
				payload: {
					attacking: true,
					configuration: config
				}
			});
			return { status: 'started' };
		} else if (action === 'stop') {
			await GremlinsAttackHandler.stop(browserInterfaceInstance, tab.id);
			await browserAPI.runtime.sendMessage({
				command: MESSAGE_TYPES.STATE,
				payload: {
					attacking: false,
					configuration: null
				}
			});
			return { status: 'stopped' };
		}
	} catch (error) {
		console.error(`Error ${action}ing gremlins:`, error);
		await browserAPI.runtime.sendMessage({
			type: 'error',
			message: `Failed to ${action} gremlins: ${error.message}`
		});
		throw error;
	}
}

browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (!message.command) {
		return false;
	}

	if (message.command === MESSAGE_TYPES.CONTENT_READY) {
		const tabId = sender.tab.id;
		tabStates.set(tabId, true);
		processMessageQueue(tabId);
		sendResponse({ status: 'ready' });
		return;
	}

	if (!MESSAGE_TYPES[message.command]) {
		return false;
	}

	const tabId = sender.tab ? sender.tab.id : null,
		action = message.command === MESSAGE_TYPES.START ? 'start' : 'stop';

	if (!tabId) {
		browserAPI.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
			if (tabs[0]) {
				try {
					const result = await handleGremlinsAction(action, tabs[0], message.payload);
					sendResponse(result);
				} catch (error) {
					sendResponse({ status: 'error', error: error.message });
				}
			}
		});
	} else {
		handleGremlinsAction(action, { id: tabId }, message.payload)
			.then(sendResponse)
			.catch(error => sendResponse({ status: 'error', error: error.message }));
	}

	return true;
});

browserAPI.tabs.onRemoved.addListener((tabId) => {
	messageQueue.delete(tabId);
	tabStates.delete(tabId);
});

browserAPI.tabs.onUpdated.addListener((tabId, changeInfo) => {
	if (changeInfo.status === 'loading') {
		tabStates.set(tabId, false);
		messageQueue.delete(tabId);
	}
});

contextMenu.init().catch(error => {
	console.error('Failed to initialize context menu:', error);
});

})();

/******/ })()
;
//# sourceMappingURL=background.js.map