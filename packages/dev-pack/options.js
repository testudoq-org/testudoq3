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

/***/ "./src/lib/init-config-widget.js":
/*!***************************************!*\
  !*** ./src/lib/init-config-widget.js ***!
  \***************************************/
/***/ ((module) => {

/**
 * Initializes the configuration widget.
 * @param {HTMLElement} domElement - The DOM element representing the widget.
 * @param {Object} browserInterface - The browser interface object.
 * @returns {Promise} A promise that resolves when the initialization is complete.
 */
module.exports = function initConfigWidget(domElement, browserInterface) {


	// Variables
	let template,
		list,
		skipStandard,
		additionalMenus = [];

	// Function to display error messages
	const showErrorMsg = function (text) {
		const status = domElement.querySelector('[role=status]');
		status.textContent = text;
		setTimeout(function () {
			status.textContent = '';
		}, 1500);
	},

		// Function to add a link to a parent element
		addLink = function (parent, url) {
			const link = document.createElement('a');
			link.setAttribute('href', url);
			link.setAttribute('target', '_blank');
			link.textContent = url.replace(/.*\//g, '');
			parent.appendChild(link);
		},

		// Function to save options
		saveOptions = function () {
			browserInterface.saveOptions({
				additionalMenus: additionalMenus,
				skipStandard: skipStandard
			});
		},

		// Function to rebuild the menu
		rebuildMenu = function () {
			// Clear the menu list
			list.innerHTML = '';

			// Check if additional menus exist
			if (additionalMenus && additionalMenus.length) {
				additionalMenus.forEach(function (configItem, index) {
					// Clone the template for each menu item
					const clone = template.cloneNode(true);
					list.appendChild(clone);
					clone.querySelector('[role=name]').textContent = configItem.name;

					// Add link or text for source based on remote status
					if (configItem.remote) {
						addLink(clone.querySelector('[role=source]'), configItem.source);
					} else {
						clone.querySelector('[role=source]').textContent = configItem.source || '';
					}

					// Add event listener to remove the menu item
					clone.querySelector('[role=remove]').addEventListener('click', function () {
						additionalMenus.splice(index, 1);
						rebuildMenu();
						saveOptions();
					});
				});
				domElement.querySelector('[role=no-custom]').style.display = 'none';
				domElement.querySelector('[role=yes-custom]').style.display = '';
			} else {
				domElement.querySelector('[role=yes-custom]').style.display = 'none';
				domElement.querySelector('[role=no-custom]').style.display = '';
			}
			domElement.querySelector('[role=option-skipStandard]').checked = (!!skipStandard);
		},

		// Function to show the main screen
		showMainScreen = function () {
			domElement.querySelector('[role=main-screen]').style.display = '';
			domElement.querySelector('[role=file-loader]').style.display = 'none';
		},

		// Function to add a submenu
		addSubMenu = function (textContent, props) {
			const parsed = JSON.parse(textContent);
			additionalMenus.push(Object.assign({}, props, { config: parsed }));
			showMainScreen();
			rebuildMenu();
			saveOptions();
		},

		// Function to restore options
		restoreOptions = function () {
			return browserInterface.getOptionsAsync().then(function (opts) {
				additionalMenus = opts && Array.isArray(opts.additionalMenus) ? opts.additionalMenus : [];
				skipStandard = opts && opts.skipStandard;
				rebuildMenu();
			});
		},

		// Function to show the file selector
		showFileSelector = function () {
			const submenuField = domElement.querySelector('[role=submenu-name]'),
				configTextArea = domElement.querySelector('[role=custom-config-text]');
			submenuField.value = '';
			configTextArea.value = '';
			domElement.querySelector('[role=main-screen]').style.display = 'none';
			domElement.querySelector('[role=file-loader]').style.display = '';
		},

		// Function to initialize the screen
		// Function to initialize the screen
		initScreen = function () {
			const submenuField = domElement.querySelector('[role=submenu-name]'),
				skipStandardCheckbox = domElement.querySelector('[role=option-skipStandard]');

			// Prevent form submission
			Array.from(domElement.querySelectorAll('form')).map(el => el.addEventListener('submit', e => e.preventDefault()));

			// Event listeners
			domElement.querySelector('[role=close]').addEventListener('click', browserInterface.closeWindow);
			domElement.querySelector('[role=add]').addEventListener('click', showFileSelector);
			Array.from(domElement.querySelectorAll('[role=back]')).map(el => el.addEventListener('click', showMainScreen));
			domElement.querySelector('[role=select-file-cover]').addEventListener('click', () => {
				const event = new MouseEvent('click', {
					view: window,
					bubbles: true,
					cancelable: true
				});
				domElement.querySelector('[role=file-selector]').dispatchEvent(event);
			});
			skipStandardCheckbox.addEventListener('change', function () {
				skipStandard = !!skipStandardCheckbox.checked;
				saveOptions();
			});
			domElement.querySelector('[role=file-selector]').addEventListener('change', function () {
				const element = this,
					fileInfo = this.files[0],
					fileName = fileInfo.name,
					submenuName = submenuField.value && submenuField.value.trim();
				if (!submenuName) {
					showErrorMsg('Please provide submenu name!');
					submenuField.value = '';
				} else {
					browserInterface.readFile(fileInfo).then(result => {
						addSubMenu(result, { name: submenuName, source: fileName });
					}).catch(showErrorMsg);
				}
				element.value = '';
			});
			domElement.querySelector('[role=add-custom-config]').addEventListener('click', () => {
				const submenuName = submenuField.value && submenuField.value.trim(),
					customConfigText = domElement.querySelector('[role=custom-config-text]').value;
				if (!submenuName) {
					submenuField.value = '';
					return showErrorMsg('Please provide submenu name!');
				}
				if (!customConfigText) {
					return showErrorMsg('Please provide the configuration');
				}
				try {
					addSubMenu(customConfigText, { name: submenuName });
				} catch (e) {
					showErrorMsg(e);
				}
			});
			domElement.querySelector('[role=add-remote-config]').addEventListener('click', () => {
				const submenuName = submenuField.value && submenuField.value.trim(),
					urlField = domElement.querySelector('[role="remote-config-url"]'),
					url = urlField.value;
				if (!submenuName) {
					showErrorMsg('Please provide submenu name!');
					submenuField.value = '';
				} else if (!url) {
					return showErrorMsg('Please provide the url');
				} else {
					browserInterface.getRemoteFile(url).then(result => {
						addSubMenu(result, { name: submenuName, source: url, remote: true });
						submenuField.value = '';
						urlField.value = '';
					}).catch(showErrorMsg);
				}
			});

			// Remove the template from the DOM if it exists
			template = domElement.querySelector('[role=template]');
			if (template && template.parentElement) {
				list = template.parentElement;
				list.removeChild(template);
			}

			// Show the main screen and restore options
			showMainScreen();
			return restoreOptions();
		};


	// Call the initialization function and return its result
	return initScreen();
};


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
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!*****************************!*\
  !*** ./src/main/options.js ***!
  \*****************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _lib_chrome_browser_interface__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../lib/chrome-browser-interface */ "./src/lib/chrome-browser-interface.js");
/* harmony import */ var _lib_chrome_browser_interface__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_lib_chrome_browser_interface__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _lib_init_config_widget__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../lib/init-config-widget */ "./src/lib/init-config-widget.js");
/* harmony import */ var _lib_init_config_widget__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_lib_init_config_widget__WEBPACK_IMPORTED_MODULE_1__);



/**
 * Function to handle the DOMContentLoaded event.
 * It initializes the configuration widget.
 */
/* global chrome */
document.addEventListener('DOMContentLoaded', () => {
	console.log('DOMContentLoaded event triggered.');

	// Get the main element
	let mainElement;
	try {
		mainElement = document.getElementById('main');
		console.log('Main element:', mainElement);
	} catch (error) {
		console.error('Error while accessing main element:', error);
		return;
	}

	// Check if main element exists
	if (!mainElement) {
		console.error('Error: Main element not found.');
		return;
	}

	// Initialize configuration widget
	console.log('Initializing configuration widget.');
	try {
		_lib_init_config_widget__WEBPACK_IMPORTED_MODULE_1___default()(mainElement, new (_lib_chrome_browser_interface__WEBPACK_IMPORTED_MODULE_0___default())(chrome));
		console.log('Configuration widget initialized successfully.');
	} catch (error) {
		console.error('Error while initializing configuration widget:', error);
	}

	// Setup event listeners with error handling
	try {
		// Add Configuration File button
		const addConfigButton = document.getElementById('addConfigFileButton'),
			configOptions = document.getElementById('configOptions'),
			noCustomDiv = document.getElementById('noCustomDiv'),
			closeButton = document.getElementById('closeButton'),
			closeExtensionButton = document.getElementById('closeExtension');

		if (addConfigButton) {
			addConfigButton.addEventListener('click', function () {
				console.log('Add Configuration File button clicked.');
				if (configOptions && noCustomDiv) {
					console.log('Toggling configuration options visibility.');
					configOptions.style.display = (configOptions.style.display === 'none') ? 'block' : 'none';
					if (noCustomDiv.style) {
						noCustomDiv.style.display = 'none';
					}
				} else {
					console.error('Error: Configuration options or no custom div not found.');
				}
			});
		} else {
			console.error('Error: Add Configuration File button not found');
		}

		if (closeButton) {
			closeButton.addEventListener('click', function () {
				console.log('Close button clicked.');
				if (configOptions) {
					console.log('Closing configuration options.');
					configOptions.style.display = 'none';
				} else {
					console.error('Error: Configuration options not found.');
				}
			});
		} else {
			console.error('Error: Close button not found');
		}

		if (closeExtensionButton) {
			closeExtensionButton.addEventListener('click', function () {
				window.close();
			});
		} else {
			console.error('Error: Close Extension button not found');
		}
	} catch (error) {
		console.error('Error setting up event listeners:', error);
	}
});

})();

/******/ })()
;
//# sourceMappingURL=options.js.map