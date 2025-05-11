/* global browser, chrome */

console.log('[Module Debug] Starting module imports');

import ContextMenu from '../lib/context-menu.mjs';
console.log('[Module Debug] Loaded context-menu.mjs');

import processMenuObject from '../lib/process-menu-object.mjs';
console.log('[Module Debug] Loaded process-menu-object.mjs');

import GremlinsAttackHandler from '../lib/gremlins-attack-handler.mjs';
console.log('[Module Debug] Loaded gremlins-attack-handler.mjs');

import FirefoxMenuBuilder from '../lib/firefox-menu-builder.mjs';
console.log('[Module Debug] Loaded firefox-menu-builder.mjs');

import ChromeMenuBuilder from '../lib/chrome-menu-builder.mjs';
console.log('[Module Debug] Loaded chrome-menu-builder.mjs');

import FirefoxBrowserInterface from '../lib/firefox-browser-interface.mjs';
console.log('[Module Debug] Loaded firefox-browser-interface.mjs');

import ChromeBrowserInterface from '../lib/chrome-browser-interface.mjs';
console.log('[Module Debug] Loaded chrome-browser-interface.mjs');

console.log('[Module Debug] All modules imported successfully');

const browserAPI = (typeof browser !== 'undefined') ? browser : chrome,
	isFirefox = (typeof browser !== 'undefined'),
	MenuBuilder = isFirefox ? FirefoxMenuBuilder : ChromeMenuBuilder,
	BrowserInterface = isFirefox ? FirefoxBrowserInterface : ChromeBrowserInterface,
	menuBuilderInstance = new MenuBuilder(browserAPI),
	browserInterfaceInstance = new BrowserInterface(browserAPI),
	MESSAGE_TYPES = {
		START: 'startGremlins',
		STOP: 'stopGremlins',
		UPDATE: 'updateConfig',
		STATE: 'gremlinStateUpdate',
		CONTENT_READY: 'GREMLINS_CONTENT_READY'
	},
	messageQueue = new Map(),
	tabStates = new Map(),
	initializeExtension = async () => {
		console.log('[Background Debug] Starting extension initialization');
		try {
			console.log('[Background Debug] Loading config file');
			const response = await fetch(browserAPI.runtime.getURL('template/config.json')),
				standardConfig = await response.json();
			
			console.log('[Background Debug] Config file response:', response.status);
			console.log('[Background Debug] Config loaded successfully');
			console.log('[Background Debug] Creating context menu with browser interface:',
				browserInterfaceInstance.constructor.name);
			
			const contextMenu = new ContextMenu(
				standardConfig,
				browserInterfaceInstance,
				menuBuilderInstance,
				processMenuObject,
				isFirefox
			);

			console.log('[Background Debug] Initializing context menu');
			await contextMenu.init();
			console.log('[Background Debug] Extension initialization complete');
		} catch (error) {
			console.error('[Background Debug] Failed to initialize:', error);
			console.error('[Background Debug] Error stack:', error.stack);
		}
	};

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

initializeExtension();
