/**
 * Initializes a ChromeMenuBuilder with the given chrome object.
 *
 * @param {Object} chrome - the chrome object to use for building menus
 */
module.exports = function ChromeMenuBuilder(chrome) {
	let itemValues = {},
		itemHandlers = {},
		menuCounter = 0;
	const MENU_PREFIX = 'testudo_',
		contexts = ['editable'],
		self = this,
		generateId = (type, title = '') => {
			menuCounter++;
			const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
			return `${MENU_PREFIX}${type}_${sanitizedTitle}_${menuCounter}`;
		};

	/**
	 * Creates a root menu with the given title.
	 *
	 * @param {string} title - The title of the root menu
	 * @return {string} The ID of the created root menu
	 */
	self.rootMenu = function (title) {
		return chrome.contextMenus.create({
			id: generateId('root', title),
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
		return chrome.contextMenus.create({
			id: generateId('sub', title),
			title,
			parentId: parentMenu,
			contexts
		});
	};

	/**
	 * Creates a separator menu item in the given parent menu.
	 *
	 * @param {string} parentMenu - The ID of the parent menu
	 * @return {string} The ID of the created separator menu item
	 */
	self.separator = function (parentMenu) {
		return chrome.contextMenus.create({
			id: generateId('sep'),
			type: 'separator',
			parentId: parentMenu,
			contexts
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
		const id = chrome.contextMenus.create({
			id: generateId('item', title),
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
		const id = chrome.contextMenus.create({
			id: generateId('choice', title),
			type: 'radio',
			checked: value,
			title,
			parentId: parentMenu,
			contexts
		});
		itemHandlers[id] = clickHandler;
		itemValues[id] = value;
		return id;
	};

	/**
	 * Removes all context menu items and resets itemHandlers and itemValues.
	 *
	 * @return {Promise} A promise that resolves when all context menu items are removed.
	 */
	self.removeAll = function () {
		itemValues = {};
		itemHandlers = {};
		menuCounter = 0;

		return new Promise((resolve) => {
			chrome.contextMenus.removeAll(resolve);
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
		return chrome.contextMenus.update(menuId, { checked: true });
	};
};
