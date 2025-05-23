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
 */
export default function ContextMenu(standardConfig, browserInterface, menuBuilder, processMenuObject) {
	const STATE_KEY = 'context_menu_state',
		menuValueCache = new Map(),
		handlers = {
			injectValue: injectValueRequestHandler,
			paste: pasteRequestHandler,
			copy: copyRequestHandler,
			gremlinsAttack: gremlinsAttackHandler
		},
		// Define all possible contexts to ensure visibility across all right-click scenarios
		ALL_CONTEXTS = ['page', 'selection', 'link', 'editable'],
		FOOTER_SEPARATOR_ID = 'testudo-footer-separator',
		FOOTER_CUSTOMIZE_ID = 'testudo-customize-menus',
		FOOTER_HELP_ID = 'testudo-help-support';

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
	// cacheMenuValue removed as part of refactor - caching strategy revised

	/**
	 * @assessment_for_loadAdditionalMenus_reimplementation
	 * If dynamic loading of additional menus beyond standardConfig is required,
	 * this function must be reimplemented to use menuBuilder and integrate with rebuildMenu.
	 */
	/**
	 * @assessment_for_loadAdditionalMenus_reimplementation
	 * @description If dynamic loading of menu items beyond those in `standardConfig` is required
	 * (e.g., user-defined menus, plugin-based additions), the `loadAdditionalMenus` function
	 * (currently a placeholder/conceptual area) would need to be reimplemented.
	 * This reimplementation should utilize the current `menuBuilder` API (Factory Pattern)
	 * and integrate into the `rebuildMenu` flow, likely after `buildStandardMenu` and
	 * potentially alongside or after `addGenericMenus`, to ensure correct menu construction
	 * and display.
	 */
	/**
	 * @assessment_note
	 * @description The `loadAdditionalMenus` function, previously responsible for loading menu
	 * configurations from sources other than `standardConfig` (e.g., `config.json`),
	 * was removed in a prior refactoring. If the application requires the capability
	 * to dynamically load additional menu items beyond those provided by `standardConfig`
	 * (such as user-defined configurations or menus from plugins), this function
	 * would need to be reimplemented.
	 *
	 * A reimplemented `loadAdditionalMenus` should integrate with the `menuBuilder`
	 * factory and the overall `rebuildMenu` lifecycle. It would likely be called
	 * after `buildStandardMenu` and could be positioned either before or after
	 * `addGenericMenus`, depending on the desired visual order of these dynamic
	 * items relative to the standard and generic operational/help items.
	 * The existing JSDoc comments below provide further historical context and
	 * considerations for such a reimplementation.
	 */

	/**
	 * @assessment_note
	 * If dynamic loading of additional menu items beyond `standardConfig` is required,
	 * this `loadAdditionalMenus` function (currently a placeholder/note area)
	 * would need to be reimplemented.
	 */
	// The loadAdditionalMenus function was previously responsible for loading menu configurations
	// from sources other than the standardConfig. It was removed as part of a
	// prior refactoring (see memory-bank/improve-right-click-menu.md).
	// If reimplemented, it would handle loading and processing these additional menus.
	// Existing JSDoc notes below provide further context on its potential reimplementation.

	/**
	 * @assessment_note_for_loadAdditionalMenus
	 * @description If the application requires dynamic loading of additional menu items
	 * beyond those provided by `standardConfig` (e.g., from user configurations or
	 * plugins), the `loadAdditionalMenus` function, which was previously removed,
	 * would need to be reimplemented. Such a reimplementation should integrate
	 * with the `menuBuilder` factory and the overall `rebuildMenu` lifecycle,
	 * ensuring that dynamically loaded menus are processed and displayed correctly
	 * alongside standard and generic menus.
	 */
	/**
	 * @assessment_for_loadAdditionalMenus_reimplementation
	 * @description Following the refactor of `addGenericMenus` to handle standard operational
	 * and help menu items, the need for `loadAdditionalMenus` (which was previously
	 * responsible for loading menu items from `config.json` or other dynamic sources)
	 * should be re-evaluated.
	 *
	 * The current `buildStandardMenu` handles `standardConfig`, and `addGenericMenus`
	 * adds fixed utility menus. If the application still requires the capability to
	 * load additional, user-defined, or dynamically sourced menu configurations beyond
	 * what `standardConfig` provides, a mechanism akin to the original `loadAdditionalMenus`
	 * would need to be reimplemented.
	 *
	 * Such a reimplementation should integrate with the `menuBuilder` factory and the
	 * `rebuildMenu` lifecycle. It would likely be called after `buildStandardMenu` and
	 * could be placed either before or after `addGenericMenus` depending on the desired
	 * visual order of these dynamic items relative to the generic operational/help items.
	 * The existing `loadAdditionalMenus_Reimplementation_Note` (see below) provides
	 * further historical context on this. This refactor of `addGenericMenus` does not
	 * inherently negate the potential need for `loadAdditionalMenus` if dynamic,
	 * non-standard menu structures are a requirement.
	 */
	/**
	 * @name loadAdditionalMenus_Reimplementation_Note
	 * @kind constant
	 * @description Assessment for `loadAdditionalMenus` reimplementation.
	 * The `loadAdditionalMenus` function was previously responsible for incorporating
	 * menu items from dynamic or alternative configuration sources. It has been
	 * removed. If the application still requires functionality to load menus beyond
	 * the `standardConfig` (e.g., user-defined menus, plugin-based menus),
	 * a similar mechanism would need to be reimplemented. This reimplementation
	 * should align with the current `menuBuilder` abstractions and the overall
	 * menu construction flow within `rebuildMenu`. Consideration should be given
	 * to how such additional menus integrate with the standard and generic menus,
	 * potentially requiring new strategies for merging or ordering menu items.
	 */

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


	// turnOnPasting, turnOffPasting, turnOnCopy removed as they are no longer used after refactor.

	// Function removed as part of menu improvement refactoring
	// Reference: memory-bank/improve-right-click-menu.md
	// The functionality is now inlined directly in rebuildMenu()

	// createRebuildLogger removed as part of refactor - rebuildMenu simplified

	// clearExistingMenus removed as part of refactor - rebuildMenu simplified

	// --- Simplified standard‐menu builder ---
	async function buildStandardMenu(options, rootMenu) {
		if (options?.skipStandard) {
			return;
		}
		await processMenuObject(standardConfig, menuBuilder, rootMenu, handleClick);
		// If you need to cache any values you can still walk `standardConfig.menus` here
		console.debug('[ContextMenu] Standard menu built from config.json');
	}

	// addGenericMenus removed as part of refactor - rebuildMenu simplified, operational mode menu removed

	// --- Static footer: separator + Customize + Help/Support ---
	function addStaticFooter(rootMenu) {
		// separator
		menuBuilder.separator(
			rootMenu,
			{ id: FOOTER_SEPARATOR_ID, contexts: ALL_CONTEXTS }
		);
		// "Customize menus"
		menuBuilder.menuItem(
			'Customize menus',
			rootMenu,
			browserInterface.openSettings,
			{ id: FOOTER_CUSTOMIZE_ID, contexts: ALL_CONTEXTS }
		);
		// "Help/Support"
		menuBuilder.menuItem(
			'Help/Support',
			rootMenu,
			// hard‐code the exact help URL here:
			() => browserInterface.openUrl('https://testudo.co.nz/futterman/testudoq-help.html'),
			{ id: FOOTER_HELP_ID, contexts: ALL_CONTEXTS }
		);
		console.debug('[ContextMenu] Static footer added:', {
			separator: FOOTER_SEPARATOR_ID,
			customize: FOOTER_CUSTOMIZE_ID,
			help: FOOTER_HELP_ID
		});
	}


	/**
	 * @async
	 * @private
	 * @function rebuildMenu
	 * @description Clears all existing context menu items and rebuilds them based on the current
	 * configuration and state. It first builds the standard menu items from `standardConfig`
	 * (via `buildStandardMenu`), then adds generic menu items (like "Operational mode" submenu,
	 * "Customise menus", "Help/Support") via the refactored `addGenericMenus`.
	 * This function ensures the menu reflects the latest settings and selected operational mode.
	 *
	 * Integration of Design Patterns:
	 * - Factory Pattern: This function, along with its helpers (`buildStandardMenu`, `addGenericMenus`),
	 *   utilizes the `menuBuilder` instance (e.g., `ChromeMenuBuilder`). `menuBuilder` acts as a
	 *   factory, abstracting the creation of platform-specific menu UI elements (root menu, items, submenus, choices).
	 *   This allows `rebuildMenu` to define the menu structure logically without dealing with
	 *   low-level browser API differences for menu creation.
	 * - Strategy Pattern: The `handlerType` state (e.g., 'injectValue', 'paste', 'copy'), managed within
	 *   the `ContextMenu` scope, dictates the action performed when a menu item is clicked (as handled by `handleClick`).
	 *   The `addGenericMenus` function is responsible for creating the "Operational mode" submenu items.
	 *   These items, when clicked, invoke functions (`turnOnPasting`, `turnOffPasting`, `turnOnCopy`)
	 *   that change the `handlerType`, effectively switching the active strategy. The `handleClick`
	 *   function then uses `handlers[handlerType]` to execute the currently selected strategy.
	 *
	 * Sequence of Operations:
	 * 1. Prevents concurrent rebuilds using the `isRebuilding` flag.
	 * 2. Clears existing menus and internal value caches via `clearExistingMenus()`.
	 * 3. Creates a new root menu item using `menuBuilder.rootMenu('Testudoq')`.
	 * 4. Populates standard menu items derived from `standardConfig`. This is done by calling
	 *    `await buildStandardMenu(options, logger, rootMenu)`. `buildStandardMenu` internally
	 *    uses `processMenuObject` and caches necessary values.
	 * 5. Adds generic menu items. This is done by calling `addGenericMenus(rootMenu, logger)`.
	 *    This function now sets up the "Operational mode" submenu and other standard actions.
	 * 6. Saves the current state (which includes `handlerType`) using `await saveState()`.
	 * The function includes error handling with a fallback mechanism to build a basic menu if the primary rebuild fails.
	 *
	 * @param {object} options - Options that might affect menu building, primarily `options.skipStandard`
	 *                           which can be used to skip the `buildStandardMenu` step.
	 * @throws {Error} If the menu rebuild fails and the subsequent recovery attempt is also unsuccessful.
	 */
	// --- Main rebuildMenu flow ---
	async function rebuildMenu(options) {
		if (isRebuilding) {
			return;
		}
		isRebuilding = true;
		try {
			await menuBuilder.removeAll();
			const rootMenu = menuBuilder.rootMenu('Testudoq');

			// 1) dynamic from config.json
			await buildStandardMenu(options, rootMenu);

			// (re-enable this if you still need to load additionalMenus)
			// await loadAdditionalMenus(options?.additionalMenus, rootMenu);

			// 2) static footer
			addStaticFooter(rootMenu);

			await saveState();
			console.log('[ContextMenu] rebuild complete');
		} catch (err) {
			console.error('[ContextMenu] rebuild failed:', err);
			// fallback to just standard
			try {
				await menuBuilder.removeAll();
				const fallback = menuBuilder.rootMenu('Testudoq');
				await processMenuObject(standardConfig, menuBuilder, fallback, handleClick);
			} catch (e2) {
				throw new Error('Menu rebuild & recovery both failed');
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
