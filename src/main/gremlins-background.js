/* global browser, chrome */

const browserAPI = (typeof browser !== 'undefined') ? browser : chrome,
	ContextMenu = require('../lib/context-menu'),
	processMenuObject = require('../lib/process-menu-object'),
	standardConfig = require('../../template/config.json'),
	MenuBuilder = (typeof browser !== 'undefined') ?
		require('../lib/firefox-menu-builder') :
		require('../lib/chrome-menu-builder'),
	BrowserInterface = (typeof browser !== 'undefined') ?
		require('../lib/firefox-browser-interface') :
		require('../lib/chrome-browser-interface'),
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
		STATE: 'gremlinStateUpdate'
	};

let attackState = {
	isActive: false,
	currentTab: null,
	configuration: null
};

function initializeMenus() {
	return browserAPI.contextMenus.removeAll()
		.then(() => contextMenu.init());
}

function handleGremlinsAction(action, tab, config) {
	if (!tab || !tab.id) {
		console.error('Invalid tab for gremlins action');
		return Promise.reject(new Error('Invalid tab'));
	}

	if (action === 'start' && attackState.isActive && attackState.currentTab === tab.id) {
		console.warn('Gremlins attack already running on this tab');
		return Promise.resolve({ status: 'running' });
	}

	return new Promise((resolve, reject) => {
		browserAPI.tabs.sendMessage(tab.id, {
			command: action === 'start' ? MESSAGE_TYPES.START : MESSAGE_TYPES.STOP,
			payload: action === 'start' ? {
				duration: config && config.duration ? config.duration : 15,
				configuration: config && config.configuration ? config.configuration : null
			} : undefined
		})
			.then(response => {
				if (response && (response.status === 'started' || response.status === 'stopped')) {
					attackState = {
						isActive: response.status === 'started',
						currentTab: response.status === 'started' ? tab.id : null,
						configuration: response.status === 'started' ? config : null
					};

					browserAPI.runtime.sendMessage({
						command: MESSAGE_TYPES.STATE,
						payload: {
							attacking: attackState.isActive,
							configuration: attackState.configuration
						}
					}).catch(error => console.warn('Failed to broadcast state:', error));

					console.log(`Gremlins attack ${response.status} successfully`);
					resolve(response);
				} else {
					const error = response && response.error ? response.error : 'Unknown error';
					console.error(`Failed to ${action} gremlins:`, error);
					reject(new Error(error));
				}
			})
			.catch(error => {
				console.error(`Error ${action}ing gremlins:`, error);
				reject(error);
			});
	});
}

browserAPI.runtime.onInstalled.addListener(() => initializeMenus());
browserAPI.runtime.onStartup.addListener(() => initializeMenus());

browserAPI.runtime.onMessage.addListener((message, sender) => {
	if (!message.command || !MESSAGE_TYPES[message.command]) {
		return false;
	}

	const tabId = sender.tab ? sender.tab.id : null;
	if (!tabId) {
		browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			if (tabs[0]) {
				const action = message.command === MESSAGE_TYPES.START ? 'start' : 'stop';
				handleGremlinsAction(action, tabs[0], message.payload);
			}
		});
	} else {
		const action = message.command === MESSAGE_TYPES.START ? 'start' : 'stop';
		handleGremlinsAction(action, { id: tabId }, message.payload);
	}

	return true;
});

browserAPI.tabs.onRemoved.addListener((tabId) => {
	if (attackState.currentTab === tabId) {
		attackState = {
			isActive: false,
			currentTab: null,
			configuration: null
		};
	}
});

browserAPI.tabs.onUpdated.addListener((tabId, changeInfo) => {
	if (changeInfo.status === 'loading' && attackState.currentTab === tabId) {
		attackState = {
			isActive: false,
			currentTab: null,
			configuration: null
		};

		browserAPI.runtime.sendMessage({
			command: MESSAGE_TYPES.STATE,
			payload: {
				attacking: false,
				configuration: null
			}
		}).catch(error => console.warn('Failed to broadcast state:', error));
	}
});
