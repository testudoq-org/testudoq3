/**
 * Initializes a ChromeMenuBuilder with the given chrome object.
 *
 * @param {Object} chrome - the chrome object to use for building menus
 */
module.exports = function ChromeMenuBuilder(chrome) {
	let itemValues = {},
		itemHandlers = {};
	const self = this,
		contexts = ['editable'];

	/**
	 * Creates a root menu with the given title.
	 *
	 * @param {string} title - The title of the root menu
	 * @return {string} The ID of the created root menu
	 */
	self.rootMenu = function (title) {
		// Generate a unique ID for the menu by appending a random number to the title.
		// The contexts for the menu are set to 'editable' and the title is set to the given title.
		return chrome.contextMenus.create({
			id: title + Math.random(),
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
	self.menuItem = function (title, parentMenu, clickHandler, value) {
		// Generate a unique ID for the menu item by appending a random number to the contexts, parentMenu, title.
		// The title, parentID and contexts are set to the given values and the clickHandler and value are stored in itemHandlers and itemValues respectively.
		const id = chrome.contextMenus.create({
			id: contexts + parentMenu + title + Math.random(),
			title,
			parentId: parentMenu,
			contexts
		});
		itemValues[id] = value;
		itemHandlers[id] = clickHandler;
		return id;
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
	self.removeAll = function () {
		// Reset itemHandlers and itemValues
		itemValues = {}; // Reset itemValues to an empty object
		itemHandlers = {}; // Reset itemHandlers to an empty object

		// Remove all context menu items and return a promise that resolves when all items are removed
		return new Promise((resolve) => { // Create a promise that resolves when all items are removed
			/**
			 * Removes all context menu items and calls the resolve function when finished.
			 *
			 * @param {function} resolve - The resolve function from the promise
			 */
			chrome.contextMenus.removeAll(resolve); // Remove all context menu items and call resolve when finished
		});
	};
	chrome.contextMenus.onClicked.addListener((info, tab) => {
		const itemId = info && info.menuItemId;
		if (itemHandlers[itemId]) {
			itemHandlers[itemId](tab.id, itemValues[itemId]);
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
};
