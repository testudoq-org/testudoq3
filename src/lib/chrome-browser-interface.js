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
