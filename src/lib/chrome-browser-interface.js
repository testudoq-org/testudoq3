module.exports = function ChromeBrowserInterface(chrome) {

	const self = this;
	self.saveOptions = function (options) {
		chrome.storage.sync.set(options);
	};
	self.getOptionsAsync = function () {
		return new Promise((resolve) => {
			chrome.storage.sync.get(null, resolve);
		});
	};
	self.openSettings = function () {
		if (chrome.runtime.openOptionsPage) {
			chrome.runtime.openOptionsPage();
		} else {
			window.open(chrome.runtime.getURL('options.html'));
		}
	};
	self.openUrl = function (url) {
		window.open(url);
	};
	self.addStorageListener = function (listener) {
		chrome.storage.onChanged.addListener(function (changes, areaName) {
			if (areaName === 'sync') {
				listener(changes);
			};
		});
	};
	self.getRemoteFile = function (url) {
		return fetch(url, { mode: 'cors' }).then(function (response) {
			if (response.ok) {
				return response.text();
			}
			throw new Error('Network error reading the remote URL');
		});
	};
	self.closeWindow = function () {
		window.close();
	};
	self.readFile = function (fileInfo) {
		return new Promise((resolve, reject) => {
			const oFReader = new FileReader();
			oFReader.onload = function (oFREvent) {
				try {
					resolve(oFREvent.target.result);
				} catch (e) {
					reject(e);
				}
			};
			oFReader.onerror = reject;
			oFReader.readAsText(fileInfo, 'UTF-8');
		});
	};
	self.executeScript = function (tabId, source) {
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

	self.sendMessage = function (tabId, message) {
		if (tabId === null || tabId === undefined) {
			throw new Error('tabId is null or undefined');
		}
		if (message === null || message === undefined) {
			throw new Error('message is null or undefined');
		}
		return chrome.tabs.sendMessage(tabId, message)
			.catch((err) => {
				throw new Error(`Failed to send message to tab ${tabId}: ${err.message}`);
			});
	};
	self.requestPermissions = async (permissionsArray) => {
		if (!permissionsArray) {
			throw new Error('permissionsArray is null or undefined');
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
	self.removePermissions = function (permissionsArray) {
		return new Promise((resolve) => chrome.permissions.remove({ permissions: permissionsArray }, resolve));
	};
	self.copyToClipboard = async (text) => {
		console.log('Attempting to copy text to clipboard:', text);
		try {
			await navigator.clipboard.writeText(text.ChromeBrowserInterface.toString());
			console.log('Text copied to clipboard');
		} catch (error) {
			console.error('Failed to copy text to clipboard:', error.message);
			throw new Error('Unable to copy text to clipboard');
		}
	};
	self.showMessage = function (text) {
		chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
			const currentTabId = tabs[0].id;
			chrome.scripting.executeScript({
				target: { tabId: currentTabId },
				func: (message) => alert(message),
				args: [text]
			});
		});
	};
};
