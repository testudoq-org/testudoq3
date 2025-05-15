import injectValueRequestHandler from './inject-value-request-handler.mjs';
import pasteRequestHandler from './paste-request-handler.mjs';
import copyRequestHandler from './copy-request-handler.mjs';
import gremlinsAttackHandler from './gremlins-attack-handler.mjs';

/**
 * Creates a context menu manager.
 * @param {Object} standardConfig - The standard menu configuration
 * @param {Object} browserInterface - The browser interface for menu operations
 * @param {Object} menuBuilder - The menu builder instance
 * @param {Function} processMenuObject - Function to process menu objects
 * @param {boolean} pasteSupported - Whether paste operations are supported
 */
export default function ContextMenu(standardConfig, browserInterface, menuBuilder, processMenuObject, pasteSupported) {
	// State management and handler registry
	const STATE_KEY = 'context_menu_state',
		handlers = {
			injectValue: injectValueRequestHandler,
			paste: pasteRequestHandler,
			copy: copyRequestHandler,
			gremlinsAttack: gremlinsAttackHandler
		};

	let handlerType = 'injectValue',
		isRebuilding = false,
		isInitialized = false;

	// Load persisted state if available
	async function loadState() {
		try {
			const result = await browserInterface.storage.local.get(STATE_KEY);
			if (result[STATE_KEY]) {
				handlerType = result[STATE_KEY].handlerType || handlerType;
				console.log('[ContextMenu] Restored state:', result[STATE_KEY]);
			}
		} catch (error) {
			console.error('[ContextMenu] Failed to load state:', error);
		}
	}

	// Save current state
	async function saveState() {
		try {
			await browserInterface.storage.local.set({
				[STATE_KEY]: {
					handlerType,
					lastUpdate: Date.now()
				}
			});
			console.log('[ContextMenu] State saved successfully');
		} catch (error) {
			console.error('[ContextMenu] Failed to save state:', error);
		}
	}

	async function onClick(tabId, itemMenuValue) {
		console.log('[ContextMenu Debug] onClick called:', { tabId, itemMenuValue });
		if (!tabId) {
			console.error('[ContextMenu] Invalid tab ID');
			throw new Error('Invalid tab ID');
		}

		if (!itemMenuValue) {
			console.warn('[ContextMenu] No menu value provided');
			return;
		}

		console.log('[ContextMenu Debug] Handler type:', handlerType);
		console.log('[ContextMenu Debug] Available handlers:', Object.keys(handlers));

		try {
			// Convert string values to proper request objects and execute handler
			const requestValue = typeof itemMenuValue === 'string'
					? { '_type': 'literal', 'value': itemMenuValue }
					: itemMenuValue,
				result = await handlers[handlerType](browserInterface, tabId, requestValue);

			// Validate handler exists
			if (!handlers[handlerType]) {
				throw new Error(`Invalid handler type: ${handlerType}`);
			}

			console.log('[ContextMenu] Executing action:', {
				handlerType,
				tabId,
				requestValue
			});

			console.log('[ContextMenu] Action completed:', {
				handlerType,
				result
			});

			return result;
		} catch (error) {
			console.error('[ContextMenu] Action failed:', error);
			browserInterface.showMessage(`Action failed: ${error.message}`);
			throw error;
		}
	}

	async function turnOnPasting() {
		try {
			console.log('[ContextMenu] Requesting clipboard permissions');
			await browserInterface.requestPermissions(['clipboardRead', 'clipboardWrite']);
			handlerType = 'paste';
			console.log('[ContextMenu] Paste mode enabled');
			return true;
		} catch (error) {
			console.error('[ContextMenu] Failed to enable paste mode:', error);
			browserInterface.showMessage('Could not access clipboard');
			throw error;
		}
	}

	async function turnOffPasting() {
		try {
			handlerType = 'injectValue';
			await browserInterface.removePermissions(['clipboardRead', 'clipboardWrite']);
			console.log('[ContextMenu] Paste mode disabled');
			return true;
		} catch (error) {
			console.error('[ContextMenu] Failed to disable paste mode:', error);
			throw error;
		}
	}

	async function turnOnCopy() {
		try {
			handlerType = 'copy';
			console.log('[ContextMenu] Copy mode enabled');
			return true;
		} catch (error) {
			console.error('[ContextMenu] Failed to enable copy mode:', error);
			throw error;
		}
	}

	function loadAdditionalMenus(additionalMenus, rootMenu) {
		if (additionalMenus) {
			additionalMenus.forEach(configItem => processMenuObject({ [configItem.name]: configItem.config }, menuBuilder, rootMenu, onClick));
		}
	}

	function addGenericMenus(rootMenu) {
		const handlerChoices = {},
			modeMenu = menuBuilder.subMenu('Operational mode', rootMenu);

		menuBuilder.separator(rootMenu);

		if (pasteSupported !== undefined) {
			pasteSupported = pasteSupported || true;
		}

		if (pasteSupported) {
			handlerChoices.injectValue = menuBuilder.choice('Inject value', modeMenu, turnOffPasting, true, handlerType);
			handlerChoices.paste = menuBuilder.choice('Simulate pasting', modeMenu, turnOnPasting, false, handlerType);
			handlerChoices.copy = menuBuilder.choice('Copy to clipboard', modeMenu, turnOnCopy, false, handlerType);
		}

		menuBuilder.menuItem('Customise menus', rootMenu, browserInterface.openSettings);

		menuBuilder.menuItem('Help/Support', rootMenu, () => {
			if (!browserInterface) {
				throw new TypeError('browserInterface cannot be null or undefined');
			}
			browserInterface.openUrl('https://testudo.co.nz/futterman/testudoq-help.html');
		});
	}

	async function rebuildMenu(options) {
		if (isRebuilding) {
			console.log('[ContextMenu] Menu rebuild already in progress, skipping');
			return;
		}

		isRebuilding = true;
		const rebuildStart = Date.now(),
			rebuildLog = (msg) => console.log(`[ContextMenu] ${msg}`);

		try {
			// Cleanup existing menus
			await menuBuilder.removeAll();
			rebuildLog('Existing menus removed');

			// Create root menu
			const rootMenu = menuBuilder.rootMenu('Testudoq'),
				rebuildTime = Date.now() - rebuildStart;

			rebuildLog('Root menu created');

			// Build standard menu items if not skipped
			if (!options || !options.skipStandard) {
				await processMenuObject(standardConfig, menuBuilder, rootMenu, onClick);
				rebuildLog('Standard menu items processed');
			}

			// Add additional menus
			if (options && options.additionalMenus) {
				await loadAdditionalMenus(options.additionalMenus, rootMenu);
				rebuildLog('Additional menus loaded');
			}

			// Add generic menus
			await addGenericMenus(rootMenu);
			rebuildLog('Generic menus added');

			// Save state after successful rebuild
			await saveState();

			rebuildLog(`Menu rebuild completed in ${rebuildTime}ms`);
		} catch (error) {
			console.error('[ContextMenu] Menu rebuild failed:', error);
			// Attempt recovery by rebuilding with only standard items
			try {
				await menuBuilder.removeAll();
				const rootMenu = menuBuilder.rootMenu('Testudoq');
				await processMenuObject(standardConfig, menuBuilder, rootMenu, onClick);
				console.log('[ContextMenu] Fallback to standard menu successful');
			} catch (recoveryError) {
				console.error('[ContextMenu] Recovery failed:', recoveryError);
				throw new Error('Menu rebuild failed and recovery was unsuccessful');
			}
		} finally {
			isRebuilding = false;
		}
	}

	function wireStorageListener() {
		browserInterface.addStorageListener(async () => {
			const options = await browserInterface.getOptionsAsync();
			await rebuildMenu(options);
		});
	}

	this.init = async function () {
		if (isInitialized) {
			console.warn('[ContextMenu Debug] Already initialized, skipping');
			return;
		}

		try {
			console.log('[ContextMenu Debug] Starting initialization');
			console.log('[ContextMenu Debug] Standard config:', standardConfig);
			console.log('[ContextMenu Debug] Current handler type:', handlerType);
			// Load persisted state
			await loadState();
			console.log('[ContextMenu Debug] State loaded, handler type:', handlerType);
			// Get options and rebuild menu
			console.log('[ContextMenu Debug] Loading options...');
			const options = await browserInterface.getOptionsAsync();
			console.log('[ContextMenu Debug] Options loaded:', options);
			console.log('[ContextMenu Debug] Starting menu rebuild...');
			await rebuildMenu(options);
			console.log('[ContextMenu Debug] Menu rebuild complete');
			// Set up storage listener
			console.log('[ContextMenu Debug] Setting up storage listener...');
			wireStorageListener();
			isInitialized = true;
			console.log('[ContextMenu Debug] Initialization complete. Available handlers:', Object.keys(handlers));
		} catch (error) {
			console.error('[ContextMenu] Initialization failed:', error);
			throw new Error(`Context menu initialization failed: ${error.message}`);
		}
	};
}
