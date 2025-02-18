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
