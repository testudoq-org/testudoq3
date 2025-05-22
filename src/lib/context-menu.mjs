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
	const MAX_MENU_ITEMS = 1500,
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
	 * @param {string} menuType - Type of menu item ('standard', 'universal', 'separator', 'operational', 'help')
	 * @returns {string[]} Array of contexts where the item should be visible
	 */
	// eslint-disable-next-line no-unused-vars
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

	// Helper to log rebuild progress with timing details
	function createRebuildLogger(startTime) {
		return (msg, details = {}) => {
			console.log('[ContextMenu Rebuild]', msg, {
				timestamp: Date.now(),
				elapsed: Date.now() - startTime,
				...details
			});
		};
	}

	// Clears cache and removes all current menus
	async function clearExistingMenus() {
		menuValueCache.clear();
		await menuBuilder.removeAll();
	}

	// Processes standard menu items and caches key values
	async function buildStandardMenu(options, logger) {
		if (options?.skipStandard) {
			return [];
		}

		const rootMenu = menuBuilder.rootMenu('Testudoq'),
			items = (await processMenuObject(
				standardConfig,
				menuBuilder,
				rootMenu,
				handleClick
			)).slice(0, MAX_MENU_ITEMS);

		logger('Standard root menu created');

		if (items.length) {
			logger('Processing standard menu items', {
				itemCount: items.length,
				items: items.map(item => ({
					id: item.id,
					hasValue: !!item.value
				}))
			});

			items.forEach(item => {
				if (item.id && item.value) {
					cacheMenuValue(item.id, item.value);
				}
			});

			logger('Standard menu items cached', {
				cacheSize: menuValueCache.size
			});
		}

		return items;
	}

	// Creates the operational submenu (for generic modes) under the given root menu
	function addOperationalSubMenu(rootMenu, logger) {
		const handlerChoices = {},
			// Use getVisibleContexts to ensure operational mode appears in all contexts
			contexts = getVisibleContexts('operational'),
			modeMenu = menuBuilder.subMenu('Operational mode', rootMenu, { contexts });

		logger('Adding "Operational mode" submenu with contexts:', contexts);

		// Ensure pasteSupported is truthy (using default true if undefined)
		pasteSupported = pasteSupported || true;

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
				handlerType
			);
		}
	}

	// Adds generic menu items (e.g., "Customise menus" and "Help/Support") to the root menu
	function addGenericMenus(rootMenu, logger) {
		// Use getVisibleContexts to ensure generic menus appear in all contexts
		const customiseContexts = getVisibleContexts('help'),
			helpContexts = getVisibleContexts('help');
		logger('Adding "Customise menus" item with contexts:', customiseContexts);
		menuBuilder.menuItem(
			'Customise menus',
			rootMenu,
			browserInterface.openSettings,
			{ contexts: customiseContexts }
		);

		logger('Adding "Help/Support" item with contexts:', helpContexts);
		menuBuilder.menuItem(
			'Help/Support',
			rootMenu,
			() => {
				browserInterface.openUrl(browserInterface.getHelpUrl());
			},
			{ contexts: helpContexts }
		);

		logger('Generic menus added');
	}

	// The main rebuildMenu function using the helpers defined above
	async function rebuildMenu(options) {
		if (isRebuilding) {
			console.log('[ContextMenu] Menu rebuild already in progress, skipping');
			return;
		}

		isRebuilding = true;
		const rebuildStart = Date.now(),
			logger = createRebuildLogger(rebuildStart);

		try {
			console.log('[ContextMenu] Starting menu rebuild');

			// Clear caches and remove existing menu items
			await clearExistingMenus();
			logger('Existing menus cleared');

			// Build the root menu and process standard menu items
			// rootMenu and standardItems (debug metadata about created menu items)
			const rootMenu = menuBuilder.rootMenu('Testudoq'),
				// eslint-disable-next-line no-unused-vars
				standardItems = await buildStandardMenu(options, logger);

			// Add a separator before the generic menus
			menuBuilder.separator(rootMenu, { contexts: getVisibleContexts('separator') });
			logger('Added separator with ALL_CONTEXTS');

			// Create operational submenu under the root
			addOperationalSubMenu(rootMenu, logger);

			// Add "Customise menus" and "Help/Support" items
			addGenericMenus(rootMenu, logger);

			// Save state after a successful rebuild
			await saveState();
			logger(`Menu rebuild completed in ${Date.now() - rebuildStart}ms`);
		} catch (error) {
			console.error('[ContextMenu] Menu rebuild failed:', error);
			// If error occurs, attempt recovery using only standard menus.
			try {
				menuValueCache.clear();
				await menuBuilder.removeAll();
				const fallbackRoot = menuBuilder.rootMenu('Testudoq');
				await processMenuObject(standardConfig, menuBuilder, fallbackRoot, handleClick);
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
