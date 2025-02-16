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

// Create gremlins menu with unique IDs
function createGremlinsMenu() {
	const timestamp = Date.now(),
		menuIds = {
			root: `gremlinsMenu_${timestamp}`,
			start: `startGremlins_${timestamp}`,
			stop: `stopGremlins_${timestamp}`,
			config: `configGremlins_${timestamp}`
		};

	// Create root menu
	browserAPI.contextMenus.create({
		id: menuIds.root,
		title: 'Gremlins Testing',
		contexts: ['all']
	});

	// Create menu items
	browserAPI.contextMenus.create({
		id: menuIds.start,
		parentId: menuIds.root,
		title: 'Start Attack (15s)',
		contexts: ['all']
	});

	browserAPI.contextMenus.create({
		id: menuIds.stop,
		parentId: menuIds.root,
		title: 'Stop Attack',
		contexts: ['all']
	});

	browserAPI.contextMenus.create({
		id: menuIds.config,
		parentId: menuIds.root,
		title: 'Configure',
		contexts: ['all']
	});

	// Set up click handlers
	browserAPI.contextMenus.onClicked.addListener((info, tab) => {
		if (!tab || !tab.id) {
			console.error('Invalid tab for gremlins action');
			return;
		}

		switch (info.menuItemId) {
		case menuIds.start:
			handleGremlinsAction('start', tab, { duration: 15 });
			break;
		case menuIds.stop:
			handleGremlinsAction('stop', tab);
			break;
		case menuIds.config:
			browserAPI.windows.create({
				url: browserAPI.runtime.getURL('popup/popup.html'),
				type: 'popup',
				width: 400,
				height: 600,
				focused: true
			});
			break;
		}
	});
}

// Event listener for extension installation
browserAPI.runtime.onInstalled.addListener(() => {
	browserAPI.contextMenus.removeAll(() => {
		contextMenu.init().then(() => {
			createGremlinsMenu();
		});
	});
});

// Event listener for extension startup
browserAPI.runtime.onStartup.addListener(() => {
	browserAPI.contextMenus.removeAll(() => {
		contextMenu.init().then(() => {
			createGremlinsMenu();
		});
	});
});

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
