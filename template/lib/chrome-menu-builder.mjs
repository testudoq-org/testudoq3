/**
 * Initializes a ChromeMenuBuilder with the given chrome object.
 *
 * @param {Object} chrome - the chrome object to use for building menus
 */
// Storage keys and default values
const MENU_STORAGE_KEY = 'chrome_menu_state',
	DEFAULT_CONTEXTS = ['editable'],
	MAX_MENU_ITEMS = 100, // Chrome has a limit on number of context menu items
	menuItemSchema = {
		validateId: (id) => typeof id === 'string' && id.length > 0,
		validateTitle: (title) => typeof title === 'string' && title.length > 0,
		validateHandler: (handler) => typeof handler === 'function',
		validateValue: (value) => value !== undefined
	};

export default function ChromeMenuBuilder(chrome) {
	// State management
	let itemValues = {},
		itemHandlers = {},
		itemCount = 0;

	const self = this,
		contexts = DEFAULT_CONTEXTS,
		loadMenuState = async () => {
			try {
				console.log('[MenuBuilder Debug] Loading menu state...');
				const result = await chrome.storage.local.get(MENU_STORAGE_KEY),
					state = result[MENU_STORAGE_KEY],
					validValues = {};

				if (!state || !state.values) {
					console.log('[MenuBuilder Debug] No stored state found');
					return;
				}

				// Validate stored values before applying
				Object.entries(state.values).forEach(([key, value]) => {
					if (menuItemSchema.validateId(key) && value !== undefined) {
						validValues[key] = value;
					} else {
						console.warn('[MenuBuilder Debug] Invalid stored value:', { key, value });
					}
				});

				itemValues = validValues;
				console.log('[MenuBuilder Debug] State loaded successfully:', {
					itemCount: Object.keys(itemValues).length
				});
			} catch (error) {
				console.error('[MenuBuilder Debug] Failed to load state:', error);
				throw new Error('Failed to load menu state: ' + error.message);
			}
		},
		saveMenuState = async () => {
			try {
				if (itemCount > MAX_MENU_ITEMS) {
					throw new Error(`Menu item limit exceeded (max: ${MAX_MENU_ITEMS})`);
				}

				const state = {
					values: itemValues,
					lastUpdate: Date.now()
				};

				await chrome.storage.local.set({ [MENU_STORAGE_KEY]: state });
				console.log('[MenuBuilder Debug] State saved successfully');
			} catch (error) {
				console.error('[MenuBuilder Debug] Failed to save state:', error);
				throw new Error('Failed to save menu state: ' + error.message);
			}
		};
	/**
	 * Creates a root menu with the given title.
	 *
	 * @param {string} title - The title of the root menu
	 * @return {string} The ID of the created root menu
	 */
	self.rootMenu = function (title) {
		const id = title + Math.random();
		console.log('[MenuBuilder Debug] Creating root menu:', { id, title });
		return chrome.contextMenus.create({
			id,
			title,
			contexts
		});
	};

	/**
	 * Creates a submenu with the given title and parentMenu.
	 *
	 * @param {string} title - The title of the submenu
	 * @param {string} parentMenu - The ID of the parent menu
	 * @return {string} The ID of the created submenu
	 */
	self.subMenu = function (title, parentMenu) {
		// Generate a unique ID for the submenu by appending a random number to the title and parentID.
		// The contexts for the submenu are set to 'editable' and the title is set to the given title and the parentID to the given parentMenu.
		return chrome.contextMenus.create({
			id: parentMenu + title + Math.random(), // new ID
			title, // submenu title
			parentId: parentMenu, // parent menu ID
			contexts // contexts for the submenu
		});
	};

	/**
	 * Creates a separator menu item in the given parent menu.
	 *
	 * @param {string} parentMenu - The ID of the parent menu
	 * @return {string} The ID of the created separator menu item
	 */
	self.separator = function (parentMenu) {
		// Generate a unique ID for the separator by appending a random number to the parentID.
		// The type of the separator is set to 'separator', the parentID to the given parentMenu and the contexts to 'editable'.
		return chrome.contextMenus.create({
			id: parentMenu + Math.random(), // new ID
			type: 'separator', // type of the separator
			parentId: parentMenu, // parent menu ID
			contexts // contexts for the separator
		});
	};

	/**
	 * Creates a menu item with the given title, parentMenu, clickHandler and value.
	 *
	 * @param {string} title - The title of the menu item
	 * @param {string} parentMenu - The ID of the parent menu
	 * @param {function} clickHandler - The click handler for the menu item
	 * @param {any} value - The value of the menu item
	 * @return {string} The ID of the created menu item
	 */
	/**
	 * Creates a menu item with validation
	 */
	self.menuItem = async function (title, parentMenu, clickHandler, value) {
		try {
			// Validate inputs
			if (!menuItemSchema.validateTitle(title)) {
				throw new Error('Invalid title');
			}
			if (!menuItemSchema.validateHandler(clickHandler)) {
				throw new Error('Invalid click handler');
			}
			if (!menuItemSchema.validateValue(value)) {
				throw new Error('Invalid value');
			}

			// Generate and validate ID
			const id = `menu_${contexts}_${parentMenu}_${title}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				result = await chrome.contextMenus.create({
					id,
					title,
					parentId: parentMenu,
					contexts
				});

			// Update state
			itemValues[id] = value;
			itemHandlers[id] = clickHandler;
			itemCount++;

			// Save state
			await saveMenuState();

			console.log('[MenuBuilder Debug] Menu item created:', {
				id,
				itemCount,
				handlers: Object.keys(itemHandlers).length,
				values: Object.keys(itemValues).length
			});

			return result;
		} catch (error) {
			console.error('[MenuBuilder Debug] Failed to create menu item:', error);
			throw new Error('Failed to create menu item: ' + error.message);
		}
	};

	/**
	 * Creates a radio button menu item with the given title, parentMenu, clickHandler and value.
	 *
	 * @param {string} title - The title of the radio button menu item
	 * @param {string} parentMenu - The ID of the parent menu
	 * @param {function} clickHandler - The click handler for the radio button menu item
	 * @param {any} value - The value of the radio button menu item
	 * @return {string} The ID of the created radio button menu item
	 */
	self.choice = function (title, parentMenu, clickHandler, value) {
		// Generate a unique ID for the radio button menu item by appending a random number to the word 'value'.
		// The type of the radio button menu item is set to 'radio', the checked value is set to the given value,
		// the title and parentID are set to the given values and the clickHandler and value are stored in itemHandlers and itemValues respectively.
		const id = chrome.contextMenus.create({
			id: `value${Math.random()}`, // new ID
			type: 'radio', // type of the radio button menu item
			checked: value, // checked state of the radio button menu item
			title, // title of the radio button menu item
			parentId: parentMenu, // parent menu ID
			contexts // contexts for the radio button menu item
		});
		itemHandlers[id] = clickHandler; // store click handler
		itemValues[id] = value; // store value
		// Return the ID of the created radio button menu item
		return id;
	};

	/**
	 * Removes all context menu items and resets itemHandlers and itemValues.
	 *
	 * @return {Promise} A promise that resolves when all context menu items are removed.
	 */
	/**
	 * Removes all menu items with cleanup
	 */
	self.removeAll = async function () {
		try {
			console.log('[MenuBuilder Debug] Starting cleanup...');

			// Remove stored state first
			await chrome.storage.local.remove(MENU_STORAGE_KEY);
			console.log('[MenuBuilder Debug] Cleared stored menu state');

			// Reset memory state
			itemValues = {};
			itemHandlers = {};
			itemCount = 0;

			// Remove all context menu items
			await new Promise((resolve, reject) => {
				chrome.contextMenus.removeAll(() => {
					const error = chrome.runtime.lastError;
					if (error) {
						reject(error);
					} else {
						resolve();
					}
				});
			});

			console.log('[MenuBuilder Debug] Cleanup completed successfully');
			return true;
		} catch (error) {
			console.error('[MenuBuilder Debug] Cleanup failed:', error);
			throw new Error('Failed to remove menu items: ' + error.message);
		}
	};

	// Initialize by loading stored state
	loadMenuState().catch(error => {
		console.error('[MenuBuilder Debug] Failed to initialize:', error);
	});

	// Set up click listener with enhanced error handling and validation
	chrome.contextMenus.onClicked.addListener(async (info, tab) => {
		const itemId = info?.menuItemId;
		if (!itemId) {
			console.error('[MenuBuilder Debug] Invalid menu item ID');
			return;
		}

		try {
			console.log('[MenuBuilder Debug] Menu item clicked:', {
				itemId,
				tabId: tab?.id,
				hasHandler: !!itemHandlers[itemId],
				hasValue: !!itemValues[itemId],
				value: itemValues[itemId]
			});

			if (!tab?.id) {
				throw new Error('Invalid tab ID');
			}

			if (!itemHandlers[itemId]) {
				console.warn('[MenuBuilder Debug] No handler found for menu item:', itemId);
				return;
			}

			console.log('[MenuBuilder Debug] Executing handler for:', itemId);
			const result = await itemHandlers[itemId](tab.id, itemValues[itemId]);
			console.log('[MenuBuilder Debug] Handler execution completed:', result);
		} catch (error) {
			console.error('[MenuBuilder Debug] Error handling click:', error);
			// Re-throw error for potential external error handling
			throw error;
		}
	});

	/**
	 * Selects a choice by updating the checked state of the given menu item ID.
	 *
	 * @param {string} menuId - The ID of the menu item to update.
	 * @return {Promise} A Promise that resolves when the menu item is updated.
	 */
	self.selectChoice = function (menuId) {
		// Update the checked state of the given menu item ID to true
		// and return a promise that resolves when the update is complete
		return chrome.contextMenus.update(menuId, { checked: true });
	};
}
