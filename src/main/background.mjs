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

// Constants and Configuration
const OPERATION_TIMEOUT = 5000,
	EXTENSION_STATE = {
		menuInstance: null,
		status: null
	},
	CONFIG_CACHE_KEY = 'config_cache',
	CONFIG_VERSION_KEY = 'config_version',
	STATE_LOCK = {
		locked: false,
		queue: [],
		lastUpdate: null,
		currentOperation: null,
		operationStart: null,
		async acquire() {
			if (this.locked) {
				if (this.operationStart && Date.now() - this.operationStart > OPERATION_TIMEOUT) {
					console.warn('[State Debug] Operation timeout, forcing release:', {
						operation: this.currentOperation,
						duration: Date.now() - this.operationStart
					});
					this.release();
				}
				return new Promise(resolve => this.queue.push(resolve));
			}
			this.locked = true;
			this.lastUpdate = Date.now();
			this.operationStart = Date.now();
			return Promise.resolve();
		},
		release() {
			this.locked = false;
			this.currentOperation = null;
			this.operationStart = null;
			const next = this.queue.shift();
			if (next) {
				next();
			}
		}
	},
	EXTENSION_STATES = {
		UNINITIALIZED: 'uninitialized',
		LOADING_CONFIG: 'loading_config',
		REMOVING_MENUS: 'removing_menus',
		CREATING_MENUS: 'creating_menus',
		READY: 'ready',
		ERROR: 'error'
	},
	MESSAGE_TYPES = {
		START: 'startGremlins',
		STOP: 'stopGremlins',
		UPDATE: 'updateConfig',
		STATE: 'gremlinStateUpdate',
		CONTENT_READY: 'GREMLINS_CONTENT_READY'
	},
	browserAPI = (typeof browser !== 'undefined') ? browser : chrome,
	isFirefox = (typeof browser !== 'undefined'),
	MenuBuilder = isFirefox ? FirefoxMenuBuilder : ChromeMenuBuilder,
	BrowserInterface = isFirefox ? FirefoxBrowserInterface : ChromeBrowserInterface,
	menuBuilderInstance = new MenuBuilder(browserAPI),
	browserInterfaceInstance = new BrowserInterface(browserAPI),
	messageQueue = new Map(),
	tabStates = new Map(),
	updateState = async (newState) => {
		await STATE_LOCK.acquire();
		try {
			EXTENSION_STATE.status = newState;
			STATE_LOCK.currentOperation = newState;
			STATE_LOCK.currentOperation = newState;
			console.log('[State Debug] Extension state changed:', {
				state: newState,
				timestamp: Date.now(),
				queueLength: STATE_LOCK.queue.length,
				operationDuration: Date.now() - STATE_LOCK.operationStart
			});
		} finally {
			STATE_LOCK.release();
		}
	},
	loadConfig = async (retries = 3) => {
		const configUrl = browserAPI.runtime.getURL('config.json');
		await STATE_LOCK.acquire();
		try {
			const cache = await browserAPI.storage.local.get([CONFIG_CACHE_KEY, CONFIG_VERSION_KEY]),
				manifestVersion = browserAPI.runtime.getManifest().version;

			if (cache[CONFIG_CACHE_KEY] && cache[CONFIG_VERSION_KEY] === manifestVersion) {
				console.log('[Config Debug] Using cached config:', {
					version: manifestVersion,
					timestamp: cache[CONFIG_CACHE_KEY].timestamp
				});
				return cache[CONFIG_CACHE_KEY].data;
			}

			console.log('[Config Debug] Cache invalid or missing, loading from file:', {
				configUrl,
				manifestVersion,
				cachedVersion: cache[CONFIG_VERSION_KEY]
			});

			let lastError;
			for (let i = 0; i < retries; i++) {
				try {
					const response = await fetch(configUrl),
						config = await response.json();

					if (!config.menus || Object.keys(config.menus).length === 0) {
						config.menus = {};
					}

					config.contexts = config.contexts || ['editable'];
					config.handlers = config.handlers || {
						injectValue: true,
						paste: true,
						copy: true,
						gremlinsAttack: true
					};

					await browserAPI.storage.local.set({
						[CONFIG_CACHE_KEY]: {
							data: config,
							timestamp: Date.now()
						},
						[CONFIG_VERSION_KEY]: manifestVersion
					});

					return config;
				} catch (error) {
					lastError = error;
					if (i < retries - 1) {
						await new Promise(resolve => setTimeout(resolve, 1000));
					}
				}
			}

			throw new Error(`Failed to load config after ${retries} attempts: ${lastError?.message}`);
		} finally {
			STATE_LOCK.release();
		}
	},
	initializeExtension = async () => {
		console.log('[Background Debug] Starting extension initialization');
		console.log('[Background Debug] Browser type:', isFirefox ? 'Firefox' : 'Chrome');

		EXTENSION_STATE.status = EXTENSION_STATES.UNINITIALIZED;
		try {
			await updateState(EXTENSION_STATES.REMOVING_MENUS);
			await browserAPI.contextMenus.removeAll();
			await updateState(EXTENSION_STATES.LOADING_CONFIG);
			console.log('[Background Debug] Loading standard config...');
			const standardConfig = await loadConfig(),
				stats = {
					hasMenus: !!standardConfig.menus,
					menuCount: Object.keys(standardConfig.menus || {}).length,
					contexts: standardConfig.contexts,
					handlers: standardConfig.handlers,
					timestamp: Date.now()
				},
				instance = new ContextMenu(
					standardConfig,
					browserInterfaceInstance,
					menuBuilderInstance,
					processMenuObject,
					isFirefox
				);
			console.log('[Background Debug] Standard config loaded:', stats);
			console.log('[Background Debug] Menu instance created');

			await updateState(EXTENSION_STATES.CREATING_MENUS);
			await instance.init();
			await browserAPI.storage.local.set({
				contextMenuInitialized: true,
				lastInitializationTime: Date.now()
			});

			await updateState(EXTENSION_STATES.READY);
			return instance;
		} catch (error) {
			console.error('[Background Debug] Failed to initialize:', error);
			await updateState(EXTENSION_STATES.ERROR);

			try {
				const defaultConfig = {
						menus: {},
						contexts: ['editable'],
						handlers: {
							injectValue: true,
							paste: true,
							copy: true,
							gremlinsAttack: true
						}
					},
					instance = new ContextMenu(
						defaultConfig,
						browserInterfaceInstance,
						menuBuilderInstance,
						processMenuObject,
						isFirefox
					);
				await instance.init();
				await updateState(EXTENSION_STATES.READY);
				return instance;
			} catch (recoveryError) {
				console.error('[Background Debug] Recovery failed:', recoveryError);
				throw error;
			}
		}
	},
	queueMessage = (tabId, message) => {
		if (!messageQueue.has(tabId)) {
			messageQueue.set(tabId, []);
		}
		messageQueue.get(tabId).push(message);
	},
	processMessageQueue = (tabId) => {
		const messages = messageQueue.get(tabId),
			ready = tabStates.get(tabId);

		if (!messages || messages.length === 0 || !ready) {
			return;
		}

		while (messages.length > 0) {
			const message = messages.shift();
			browserAPI.tabs.sendMessage(tabId, message)
				.catch(error => console.warn('Failed to send queued message:', error));
		}
	},
	handleGremlinsAction = async (action, tab, config) => {
		if (!tab?.id) {
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
	};

browserAPI.contextMenus.onClicked.addListener((info, tab) => {
	if (EXTENSION_STATE.menuInstance) {
		console.log('[Background Debug] Context menu click:', {
			info,
			tab,
			menuInstance: EXTENSION_STATE.menuInstance
		});
		EXTENSION_STATE.menuInstance.onClick(info, tab).catch(error => {
			console.error('[Background Debug] Click handler error:', error);
		});
	} else {
		console.error('[Background Debug] Context menu click received but no instance available');
	}
});

browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (!message.command) {
		return false;
	}

	if (message.command === MESSAGE_TYPES.CONTENT_READY) {
		const tabId = sender.tab.id;
		tabStates.set(tabId, true);
		processMessageQueue(tabId);
		sendResponse({ status: 'ready' });
		return true;
	}

	if (!MESSAGE_TYPES[message.command]) {
		return false;
	}

	const tabId = sender.tab?.id,
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

// Initialize extension and store instance
initializeExtension()
	.then(instance => {
		EXTENSION_STATE.menuInstance = instance;
		console.log('[Background Debug] Extension initialized successfully with instance:', {
			hasInstance: !!instance,
			state: EXTENSION_STATE
		});
	})
	.catch(error => {
		console.error('[Background Debug] Failed to initialize extension:', error);
		EXTENSION_STATE.status = EXTENSION_STATES.ERROR;
	});
