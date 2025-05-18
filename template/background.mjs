/* global browser, chrome */

// Debug verification system
(() => {
	const debugSystem = {
		isEnabled: true,
		startTime: Date.now(),
		getConsoleType: () => {
			if (typeof browser !== 'undefined') {
				return 'Firefox Extension Console';
			}
			if (typeof chrome !== 'undefined' && chrome.extension) {
				return 'Chrome Extension Console';
			}
			return 'Web Console';
		},
		verify: () => {
			try {
				const consoleType = debugSystem.getConsoleType();
				console.log('[Debug System] Verification:', {
					timestamp: Date.now(),
					location: 'background.mjs',
					console: typeof console !== 'undefined',
					logging: typeof console?.log === 'function',
					destination: consoleType,
					browser: typeof browser !== 'undefined' ? 'Firefox' : 'Chrome'
				});
				return true;
			} catch (error) {
				console.error('[Debug System] Verification failed:', error);
				return false;
			}
		},
		displayInstructions: () => {
			const consoleType = debugSystem.getConsoleType(),
				viewerInstructions = typeof chrome !== 'undefined' ?
					'Open Chrome DevTools -> Extensions tab -> find extension -> inspect views: background page' :
					'Open Firefox Browser Console (Ctrl+Shift+J) and filter for extension logs',
				message = `Debug logs will appear in: ${consoleType}\nTo view: ${viewerInstructions}`;
			console.info('[Debug System] Logging destination:', message);
		}
	};

	if (!debugSystem.verify()) {
		throw new Error('Debug system verification failed - console logging unavailable');
	}

	debugSystem.displayInstructions();
})();

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
	loadConfig = async (retries = 3) => {
		const configUrl = browserAPI.runtime.getURL('config.json');
		console.log('[Config Debug] Attempting to load config from:', configUrl);
		console.log('[Config Debug] Extension ID:', browserAPI.runtime.id);
		console.log('[Config Debug] Web accessible resources:', await browserAPI.runtime.getManifest().web_accessible_resources);
		let lastError;
		for (let i = 0; i < retries; i++) {
			try {
				console.log(`[Config Debug] Attempt ${i + 1}/${retries} to load config`);
				const response = await fetch(configUrl),
					config = await response.json(),
					menuValidation = {
						hasMenus: !!config.menus,
						menuCount: config.menus ? Object.keys(config.menus).length : 0,
						menuTypes: config.menus ? Object.keys(config.menus).map(key => ({
							name: key,
							itemCount: Object.keys(config.menus[key]).length
						})) : []
					},
					requiredFields = ['menus', 'contexts', 'handlers'],
					missingFields = requiredFields.filter(field => !config[field]);
				console.log('[Config Debug] Menu structure validation:', menuValidation);

				if (menuValidation.menuCount === 0) {
					throw new Error('No menu definitions found in config');
				}

				// Validate required fields
				if (missingFields.length > 0) {
					throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
				}

				console.log('[Config Debug] Config validation successful. Structure:', {
					menuCount: menuValidation.menuCount,
					contextTypes: config.contexts,
					handlerTypes: Object.keys(config.handlers)
				});

				return config;
			} catch (error) {
				lastError = error;
				console.error(`[Config Debug] Load attempt ${i + 1} failed:`, {
					error: error.message,
					stack: error.stack
				});

				if (i < retries - 1) {
					console.log(`[Config Debug] Retrying in 1 second... (${i + 1}/${retries})`);
					await new Promise(resolve => setTimeout(resolve, 1000));
				}
			}
		}

		// If we've exhausted all retries, log detailed error and throw
		console.error('[Config Debug] Config load failed after all retries:', {
			lastError: lastError?.message,
			stack: lastError?.stack,
			configUrl,
			extensionId: browserAPI.runtime.id
		});
		throw new Error(`Failed to load config after ${retries} attempts: ${lastError?.message}`);
	},

	initializeExtension = async () => {
		const initStart = Date.now(),
			initTimeline = {
				marks: {},
				mark: (phase) => {
					initTimeline.marks[phase] = Date.now() - initStart;
					return initTimeline.marks[phase];
				},
				getTimeline: () => Object.entries(initTimeline.marks)
					.sort((a, b) => a[1] - b[1])
					.map(([phase, time]) => `${phase}: ${time}ms`)
			};

		console.log('[Background Flow] Starting extension initialization', {
			timestamp: initStart,
			browserType: isFirefox ? 'Firefox' : 'Chrome'
		});
		initTimeline.mark('start');

		// Verify debug output destination
		console.debug('[Debug System] Extension startup:', {
			phase: 'initialization',
			console: typeof chrome !== 'undefined' ? 'Chrome' : 'Firefox',
			timestamp: Date.now()
		});
		try {
			// Remove existing menus and initialize
			await browserAPI.contextMenus.removeAll();
			initTimeline.mark('menusCleared');

			// Load and validate configuration
			const standardConfig = await loadConfig(),
				initMetrics = {
					timestamp: Date.now(),
					browserType: isFirefox ? 'Firefox' : 'Chrome',
					hasMenuBuilder: !!menuBuilderInstance,
					hasContextMenuAPI: !!browserAPI.contextMenus,
					configMenuCount: Object.keys(standardConfig.menus || {}).length
				},
				contextMenu = new ContextMenu(
					standardConfig,
					browserInterfaceInstance,
					menuBuilderInstance,
					processMenuObject,
					isFirefox
				),
				handlerCheck = async () => new Promise(resolve => {
					const testHandler = () => {
						browserAPI.contextMenus.onClicked.removeListener(testHandler);
						resolve(true);
					};
					browserAPI.contextMenus.onClicked.addListener(testHandler);
					setTimeout(() => resolve(false), 100);
				}),
				isHandlerRegistered = await handlerCheck(),
				handlerStatus = {
					...initMetrics,
					hasStandardConfig: !!standardConfig,
					hasOnClickMethod: typeof contextMenu.onClick === 'function',
					contextMenuOnClick: contextMenu.onClick?.toString().slice(0, 100),
					handlerRegistered: isHandlerRegistered
				};

			console.log('[Background Debug] Menu initialization:', initMetrics);
			console.log('[Background Debug] Handler status:', handlerStatus);
			console.log('[Background Debug] Configuration loaded:', standardConfig);
			console.log('[Background Debug] Creating ContextMenu instance with dependencies:', {
				hasMenuBuilder: !!menuBuilderInstance,
				hasBrowserInterface: !!browserInterfaceInstance,
				hasProcessMenuObject: !!processMenuObject
			});
			console.log('[Background Debug] Starting context menu initialization');
			await contextMenu.init();

			// Complete initialization and save state
			initTimeline.mark('initializationComplete');
			await browserAPI.storage.local.set({
				contextMenuInitialized: true,
				lastInitialization: {
					timestamp: Date.now(),
					status: 'complete',
					handlerRegistered: handlerStatus.handlerRegistered,
					timeline: initTimeline.getTimeline()
				}
			});

			console.log('[Background Flow] Initialization completed:', {
				...handlerStatus,
				timeline: initTimeline.getTimeline(),
				elapsed: Date.now() - initStart
			});

			return contextMenu;
		} catch (error) {
			console.error('[Background Debug] Failed to initialize:', {
				error: error.message,
				stack: error.stack,
				phase: 'initialization',
				browserType: isFirefox ? 'Firefox' : 'Chrome',
				apis: {
					contextMenus: !!browserAPI.contextMenus,
					storage: !!browserAPI.storage,
					scripting: !!browserAPI.scripting
				}
			});
			// Show error notification to user
			browserAPI.notifications.create({
				type: 'basic',
				iconUrl: 'testudo-16.png',
				title: 'Initialization Error',
				message: `Failed to initialize extension: ${error.message}`
			});
			throw error;
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
