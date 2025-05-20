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
	const MAX_MENU_ITEMS = 500,
		STATE_KEY = 'context_menu_state',
		menuValueCache = new Map(),
		handlers = {
			injectValue: injectValueRequestHandler,
			paste: pasteRequestHandler,
			copy: copyRequestHandler,
			gremlinsAttack: gremlinsAttackHandler
		},
		// Define all possible contexts to ensure visibility across all right-click scenarios
		ALL_CONTEXTS = ['page', 'selection', 'link', 'editable'];

	let handlerType = 'injectValue',
		isRebuilding = false,
		isInitialized = false;

	/**
	 * Gets the appropriate contexts for menu item visibility
	 * @param {string} menuType - Type of menu item ('standard', 'universal', 'separator')
	 * @returns {string[]} Array of contexts where the item should be visible
	 */
	function getVisibleContexts(menuType) {
		// All menu items should be visible in all contexts
		// This fixes the issue with "Customise menus" and "Help/Support" menu items
		return ALL_CONTEXTS;
	}

	// Define core click handler first
	async function handleClick(tabId, value) {
		const startTime = Date.now(),
			handlerInfo = {
				originalHandler: handlers[handlerType]?.toString().slice(0, 100),
				handlerParams: { tabId, value },
				expectedFormat: '(browserInterface, tabId, requestValue)'
			},
			executionContext = {
				menuItemId: value?.menuId || value?.id,
				tabId,
				handlerType,
				menuValue: null,
				timeline: {},
				markPhase: (phase) => {
					executionContext.timeline[phase] = Date.now() - startTime;
					return executionContext.timeline[phase];
				},
				elapsedMs: () => Date.now() - startTime,
				getTimeline: () => Object.entries(executionContext.timeline)
					.sort((a, b) => a[1] - b[1])
					.map(([phase, time]) => `${phase}: ${time}ms`)
			};

		executionContext.markPhase('start');

		console.log('[ContextMenu Debug] onClick entry:', {
			...executionContext,
			handlersAvailable: Object.keys(handlers),
			menuValueCacheSize: menuValueCache.size
		});

		// Validate tab ID
		if (!tabId) {
			console.error('[ContextMenu Debug] Tab ID missing:', {
				...executionContext,
				elapsed: executionContext.elapsedMs()
			});
			throw new Error('Tab ID is missing');
		}

		// Get and validate menu value
		executionContext.menuValue = typeof value === 'object' ? value.value : value;
		if (!executionContext.menuValue) {
			executionContext.menuValue = menuValueCache.get(executionContext.menuItemId);
		}
		if (!executionContext.menuValue) {
			console.warn('[ContextMenu Debug] No menu value found:', {
				...executionContext,
				elapsed: executionContext.elapsedMs()
			});
			return;
		}

		// Validate handler exists
		if (!handlers[handlerType]) {
			console.error('[ContextMenu Debug] Invalid handler type:', {
				...executionContext,
				elapsed: executionContext.elapsedMs()
			});
			throw new Error(`Invalid handler type: ${handlerType}`);
		}

		try {
			console.log('[ContextMenu Debug] Executing action:', {
				...executionContext,
				elapsed: executionContext.elapsedMs()
			});

			executionContext.markPhase('handlerPrep');
			// Convert string values to proper request objects
			const requestValue = typeof executionContext.menuValue === 'string'
					? { '_type': 'literal', 'value': executionContext.menuValue }
					: executionContext.menuValue,
				result = await (async () => {
					executionContext.markPhase('handlerStart');
					console.log('[ContextMenu Flow] Handler execution:', {
						...handlerInfo,
						browserInterface: !!browserInterface,
						tabId: executionContext.tabId,
						requestValue
					});

					const handlerResult = await handlers[handlerType](
						browserInterface,
						tabId,
						requestValue
					);
					executionContext.markPhase('handlerEnd');
					return handlerResult;
				})();

			console.log('[ContextMenu Flow] Action completed:', {
				...executionContext,
				result,
				timeline: executionContext.getTimeline()
			});
			return result;
		} catch (error) {
			executionContext.markPhase('error');
			console.error('[ContextMenu Flow] Action failed:', {
				...executionContext,
				error: error.message,
				stack: error.stack,
				timeline: executionContext.getTimeline()
			});
			browserInterface.showMessage(`Action failed: ${error.message}`);
			throw error;
		}
	}

	// Helper functions that depend on handleClick
	function cacheMenuValue(menuId, value) {
		menuValueCache.set(menuId, value);
		console.log('[ContextMenu Debug] Cached menu value:', {
			menuId,
			value,
			cacheSize: menuValueCache.size
		});
	}

	// loadAdditionalMenus function removed as part of menu improvement refactoring
	// Reference: memory-bank/improve-right-click-menu.md

	// Bind click handler to instance
	this.onClick = handleClick;

	// State management functions
	async function loadState() {
		console.log('[ContextMenu Debug] Checking storage availability:', {
			hasInterface: !!browserInterface,
			hasStorage: !!browserInterface?.storage,
			hasLocal: !!browserInterface?.storage?.local
		});

		try {
			if (!browserInterface?.storage?.local) {
				throw new Error('Storage API not properly initialized');
			}
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


	async function turnOnPasting() {
		try {
			console.log('[ContextMenu] Requesting clipboard permissions');
			await browserInterface.requestPermissions(['clipboardRead', 'clipboardWrite']);
			handlerType = 'paste';
			await saveState();
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
			await saveState();
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
			await saveState();
			console.log('[ContextMenu] Copy mode enabled');
			return true;
		} catch (error) {
			console.error('[ContextMenu] Failed to enable copy mode:', error);
			throw error;
		}
	}


	// Function removed as part of menu improvement refactoring
	// Reference: memory-bank/improve-right-click-menu.md
	// The functionality is now inlined directly in rebuildMenu()

	async function rebuildMenu(options) {
		if (isRebuilding) {
			console.log('[ContextMenu] Menu rebuild already in progress, skipping');
			return;
		}

		isRebuilding = true;
		const rebuildStart = Date.now(),
			rebuildLog = (msg, details = {}) => console.log('[ContextMenu Rebuild]', msg, {
				timestamp: Date.now(),
				elapsed: Date.now() - rebuildStart,
				...details
			});

		try {
			// Clear menu value cache
			menuValueCache.clear();

			// Cleanup existing menus
			await menuBuilder.removeAll();
			rebuildLog('Existing menus removed');

			// Create root menu and process items
			rebuildLog('Starting menu rebuild', {
				skipStandard: options?.skipStandard,
				hasAdditionalMenus: !!options?.additionalMenus
			});

			const rootMenu = menuBuilder.rootMenu('Testudoq'),
				menuItems = !options?.skipStandard
					? (await processMenuObject(standardConfig, menuBuilder, rootMenu, handleClick)).slice(0, MAX_MENU_ITEMS)
					: [];

			rebuildLog('Root menu created');

			// Cache menu values for standard items
			if (menuItems.length) {
				rebuildLog('Processing standard menu items', {
					itemCount: menuItems.length,
					items: menuItems.map(item => ({
						id: item.id,
						hasValue: !!item.value
					}))
				});

				menuItems.forEach(item => {
					if (item.id && item.value) {
						cacheMenuValue(item.id, item.value);
					}
				});

				rebuildLog('Standard menu items processed', {
					cacheSize: menuValueCache.size
				});
			}			// Inline generic menus (per improve-right-click-menu.md)
			// Explicitly use ALL_CONTEXTS to ensure visibility in all right-click scenarios
			menuBuilder.separator(rootMenu);

			// Create operational mode submenu directly under root
			const handlerChoices = {},
				modeMenu = menuBuilder.subMenu('Operational mode', rootMenu);

			if (pasteSupported !== undefined) {
				pasteSupported = pasteSupported || true;
			}

			if (pasteSupported) {
				handlerChoices.injectValue = menuBuilder.choice(
					'Inject value',
					modeMenu,
					turnOffPasting,
					handlerType === 'injectValue',
					handlerType
				);
				handlerChoices.paste = menuBuilder.choice(
					'Simulate pasting',
					modeMenu,
					turnOnPasting,
					handlerType === 'paste',
					handlerType
				);
				handlerChoices.copy = menuBuilder.choice(
					'Copy to clipboard',
					modeMenu,
					turnOnCopy,
					handlerType === 'copy',
					handlerType);
			}			// Add "Customise menus" menu item - explicitly pass ALL_CONTEXTS to ensure it appears everywhere
			rebuildLog('Adding Customise menus item with ALL_CONTEXTS');
			menuBuilder.menuItem('Customise menus', rootMenu, browserInterface.openSettings, { contexts: ALL_CONTEXTS });

			// Add "Help/Support" menu item - explicitly pass ALL_CONTEXTS to ensure it appears everywhere
			rebuildLog('Adding Help/Support item with ALL_CONTEXTS');
			menuBuilder.menuItem('Help/Support', rootMenu, () => {
				if (!browserInterface) {
					throw new TypeError('browserInterface cannot be null or undefined');
				}
				browserInterface.openUrl('https://testudo.co.nz/futterman/testudoq-help.html');
			}, { contexts: ALL_CONTEXTS });

			rebuildLog('Generic menus added');

			// Save state after successful rebuild
			await saveState();

			rebuildLog(`Menu rebuild completed in ${Date.now() - rebuildStart}ms`);
		} catch (error) {
			console.error('[ContextMenu] Menu rebuild failed:', error);
			// Attempt recovery by rebuilding with only standard items
			try {
				menuValueCache.clear();
				await menuBuilder.removeAll();
				const rootMenu = menuBuilder.rootMenu('Testudoq');
				await processMenuObject(standardConfig, menuBuilder, rootMenu, handleClick);
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

	/**
	 * Gets the appropriate contexts for menu item visibility
	 * @param {string} menuType - Type of menu item ('standard', 'universal', 'separator')
	 * @returns {string[]} Array of contexts where the item should be visible
	 */
	function getVisibleContexts(menuType) {
		// All menu items should be visible in all contexts
		// This fixes the issue with "Customise menus" and "Help/Support" menu items
		return ALL_CONTEXTS;
	}
}
