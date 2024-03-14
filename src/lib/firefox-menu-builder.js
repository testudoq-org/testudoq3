/**
 * Constructor function for ChromeMenuBuilder.
 * @param {Object} chrome - The Chrome browser API object.
 */
module.exports = function ChromeMenuBuilder(chrome) {
	// Initialize variables to store item values and handlers
	let itemValues = {},
		itemHandlers = {};

	// Reference to 'this' for accessing methods inside closures
	const self = this,

		// Contexts where the menu items can appear
		contexts = ['editable'];

	/**
   * Creates a root menu.
   * @param {string} title - The title of the root menu.
   * @returns {string} The ID of the created menu.
   */
	self.rootMenu = function (title) {
		return chrome.contextMenus.create({
			id: title + Math.random(),
			title,
			contexts
		});
	};

	/**
   * Creates a sub-menu.
   * @param {string} title - The title of the sub-menu.
   * @param {string} parentMenu - The ID of the parent menu.
   * @returns {string} The ID of the created menu.
   */
	self.subMenu = function (title, parentMenu) {
		return chrome.contextMenus.create({
			id: parentMenu + title + Math.random(),
			title,
			parentId: parentMenu,
			contexts
		});
	};

	/**
   * Creates a separator.
   * @param {string} parentMenu - The ID of the parent menu.
   * @returns {string} The ID of the created separator.
   */
	self.separator = function (parentMenu) {
		return chrome.contextMenus.create({
			id: parentMenu + Math.random(),
			type: 'separator',
			parentId: parentMenu,
			contexts
		});
	};

	/**
   * Creates a menu item.
   * @param {string} title - The title of the menu item.
   * @param {string} parentMenu - The ID of the parent menu.
   * @param {Function} clickHandler - The function to handle click events.
   * @param {any} value - The value associated with the menu item.
   * @returns {string} The ID of the created menu item.
   */
	self.menuItem = function (title, parentMenu, clickHandler, value) {
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
   * Creates a choice menu item.
   * @param {string} title - The title of the menu item.
   * @param {string} parentMenu - The ID of the parent menu.
   * @param {Function} clickHandler - The function to handle click events.
   * @param {any} value - The value associated with the menu item.
   * @returns {string} The ID of the created menu item.
   */
	self.choice = function (title, parentMenu, clickHandler, value) {
		const id = chrome.contextMenus.create({
			id: `value${Math.random()}`,
			type: 'radio',
			checked: value,
			title,
			parentId: parentMenu,
			contexts
		});
		itemHandlers[id] = clickHandler;
		return id;
	};

	/**
   * Removes all created menu items.
   * @returns {Promise} A promise that resolves when all menu items are removed.
   */
	self.removeAll = function () {
		itemValues = {};
		itemHandlers = {};
		return new Promise((resolve) => chrome.contextMenus.removeAll(resolve));
	};

	// Event listener for menu item clicks
	chrome.contextMenus.onClicked.addListener((info, tab) => {
		const itemId = info && info.menuItemId;
		if (itemHandlers[itemId]) {
			itemHandlers[itemId](tab.id, itemValues[itemId]);
		}
	});

	/**
   * Selects a choice menu item.
   * @param {string} menuId - The ID of the menu item to select.
   * @returns {Promise} A promise that resolves when the menu item is selected.
   */
	self.selectChoice = function (menuId) {
		return chrome.contextMenus.update(menuId, { checked: true });
	};
};
