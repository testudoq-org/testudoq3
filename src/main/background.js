/* global browser, chrome */

const browserAPI = (typeof browser !== 'undefined') ? browser : chrome,
	ContextMenu = require('../lib/context-menu'),
	processMenuObject = require('../lib/process-menu-object'),
	standardConfig = require('../../template/config.json'),
	GremlinsAttackHandler = require('../lib/gremlins-attack-handler'),
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

// Initialize the context menu
contextMenu.init().catch(error => {
	console.error('Failed to initialize context menu:', error);
});

let attackState = {
	isActive: false,
	currentTab: null,
	configuration: null
};

// Handle gremlins actions with proper error handling
async function handleGremlinsAction(action, tab, config) {
	if (!tab || !tab.id) {
		console.error('Invalid tab for gremlins action');
		return Promise.reject(new Error('Invalid tab'));
	}

	// Use the gremlins attack handler
	try {
		if (action === 'start') {
			await GremlinsAttackHandler.start(browserInterfaceInstance, tab.id, config);
			attackState.isActive = true;
			attackState.currentTab = tab.id;
			attackState.configuration = config;
		} else if (action === 'stop') {
			await GremlinsAttackHandler.stop(browserInterfaceInstance, tab.id);
			attackState.isActive = false;
			attackState.currentTab = null;
			attackState.configuration = null;
		}

		// Broadcast state update
		browserAPI.runtime.sendMessage({
			command: MESSAGE_TYPES.STATE,
			payload: {
				attacking: attackState.isActive,
				configuration: attackState.configuration
			}
		}).catch(error => {
			console.warn('Failed to broadcast state:', error);
		});

		return { status: action === 'start' ? 'started' : 'stopped' };
	} catch (error) {
		console.error(`Error ${action}ing gremlins:`, error);
		browserAPI.runtime.sendMessage({
			type: 'error',
			message: `Failed to ${action} gremlins: ${error.message}`
		}).catch(console.warn);
		throw error;
	}
}

// Event listener for messages
browserAPI.runtime.onMessage.addListener((message, sender) => {
	if (!message.command || !MESSAGE_TYPES[message.command]) {
		return false;
	}

	// Handle messages from popup
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

// Clean up attack state when tab closes
browserAPI.tabs.onRemoved.addListener((tabId) => {
	if (attackState.currentTab === tabId) {
		attackState = {
			isActive: false,
			currentTab: null,
			configuration: null
		};
	}
});

// Reset attack state when tab navigates
browserAPI.tabs.onUpdated.addListener((tabId, changeInfo) => {
	if (changeInfo.status === 'loading' && attackState.currentTab === tabId) {
		attackState = {
			isActive: false,
			currentTab: null,
			configuration: null
		};

		// Broadcast state update
		browserAPI.runtime.sendMessage({
			command: MESSAGE_TYPES.STATE,
			payload: {
				attacking: false,
				configuration: null
			}
		}).catch(error => {
			console.warn('Failed to broadcast state:', error);
		});
	}
});
