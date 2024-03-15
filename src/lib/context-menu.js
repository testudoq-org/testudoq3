const injectValueRequestHandler = require('./inject-value-request-handler'),
	pasteRequestHandler = require('./paste-request-handler'),
	copyRequestHandler = require('./copy-request-handler');

/**
 * Constructor function for ContextMenu.
 *
 * @param {Object} standardConfig - The standard configuration object.
 * @param {Object} browserInterface - The browser interface object.
 * @param {Object} menuBuilder - The menu builder object.
 * @param {Function} processMenuObject - The function to process the menu object.
 * @param {boolean} pasteSupported - Flag indicating if pasting is supported.
 */
module.exports = function ContextMenu(standardConfig, browserInterface, menuBuilder, processMenuObject, pasteSupported) {
	// Define constant values for different handler types and menus
	const handlerType = 'injectValue',
		handlerMenus = {
			injectValue: 'injectValue',
			paste: 'paste',
			copy: 'copy'
		},
		handlers = {
			injectValue: injectValueRequestHandler,
			paste: pasteRequestHandler,
			copy: copyRequestHandler
		};

	/**
	 * Event handler function for the click event of a menu item.
	 *
	 * @param {number} tabId - The ID of the tab in which the menu was clicked.
	 * @param {string|Object} itemMenuValue - The value of the clicked menu item.
	 * @return {Promise} A promise that resolves to the result of the request handler.
	 */
	function onClick(tabId, itemMenuValue) {
		if (!itemMenuValue) {
			return;
		}
		const requestValue = typeof itemMenuValue === 'string' ? { '_type': 'literal', 'value': itemMenuValue } : itemMenuValue;
		return handlers[handlerType](browserInterface, tabId, requestValue);
	}

	/**
	 * Event handler function to turn on pasting.
	 *
	 * This function requests the necessary permissions to read from the clipboard,
	 * and if successful, it sets the handlerType to 'paste'.
	 * If an error occurs, it shows a message indicating that the clipboard could not be accessed.
	 *
	 * @return {Promise} A promise that resolves when pasting is turned on, or rejects with an error.
	 */
	function turnOnPasting() {
		return browserInterface.requestPermissions(['clipboardRead', 'clipboardWrite'])
			.then(() => handlerType = handlerMenus.paste)
			.catch(browserInterface.showMessage.bind(null, 'Could not access clipboard'));
	}

	/**
	 * Event handler function to turn off pasting.
	 *
	 * This function sets the handlerType to 'injectValue' and removes the 'clipboardRead' and
	 * 'clipboardWrite' permissions from the browser interface.
	 *
	 * @return {Promise} A promise that resolves when pasting is turned off.
	 */
	function turnOffPasting() {
		handlerType = handlerMenus.injectValue;
		return browserInterface.removePermissions(['clipboardRead', 'clipboardWrite']);
	}

	/**
	 * Event handler function to turn on copying.
	 *
	 * This function sets the handlerType to 'copy', indicating that we are now
	 * ready to copy a value from the page.
	 */
	function turnOnCopy() {
		handlerType = handlerMenus.copy;
	}

	/**
	 * Load additional menus.
	 *
	 * This function takes an array of additional menus and a root menu, and
	 * processes each menu in the array. It uses the processMenuObject function
	 * to build each menu, and sets the click handler for each menu item to the
	 * onClick function.
	 *
	 * @param {Array} additionalMenus - An array of additional menus to load.
	 * @param {Object} rootMenu - The root menu to attach the additional menus to.
	 */
	function loadAdditionalMenus(additionalMenus, rootMenu) {
		if (additionalMenus) {
			additionalMenus.forEach(configItem => processMenuObject({ [configItem.name]: configItem.config }, menuBuilder, rootMenu, onClick));
		}
	};

	/**
	 * Add generic menus to the root menu.
	 *
	 * This function adds several menus to the root menu, including an
	 * "Operational mode" sub-menu with options to inject a value, simulate
	 * pasting, and copy to clipboard. It also adds menus for customizing menus
	 * and getting help/support.
	 *
	 * @param {Object} rootMenu - The root menu to attach the menus to.
	 */
	function addGenericMenus(rootMenu) {
		menuBuilder.separator(rootMenu);
		if (pasteSupported) {
			const modeMenu = menuBuilder.subMenu('Operational mode', rootMenu);
			menuBuilder.choice('Inject value', modeMenu, turnOffPasting, true, handlerMenus.injectValue);
			menuBuilder.choice('Simulate pasting', modeMenu, turnOnPasting, false, handlerMenus.paste);
			menuBuilder.choice('Copy to clipboard', modeMenu, turnOnCopy, false, handlerMenus.copy);
		}
		menuBuilder.menuItem('Customize menus', rootMenu, browserInterface.openSettings);
		menuBuilder.menuItem('Help/Support', rootMenu, () => browserInterface.openUrl('https://xanpho.x10.bz/simple-input.html'));
	}

	/**
	 * Rebuilds the menu based on the provided options.
	 *
	 * @param {Object} options - The options for rebuilding the menu.
	 * @param {boolean} options.skipStandard - Flag indicating whether to skip
	 *        processing the standard config.
	 * @param {Array} options.additionalMenus - The additional menus to load.
	 */
	function rebuildMenu(options) {
		const rootMenu = menuBuilder.rootMenu('Testudoq');
		if (!options || !options.skipStandard) {
			processMenuObject(standardConfig, menuBuilder, rootMenu, onClick);
		}
		loadAdditionalMenus(options && options.additionalMenus, rootMenu);
		addGenericMenus(rootMenu);
	}

	/**
	 * Sets up a listener for changes in browser storage, which will trigger a
	 * rebuild of the menu.
	 */
	function wireStorageListener() {
		browserInterface.addStorageListener(() => menuBuilder.removeAll().then(browserInterface.getOptionsAsync).then(rebuildMenu));
	}

	/**
	 * Initializes the context menu by getting the options, rebuilding the menu,
	 * and wiring up the storage listener.
	 *
	 * @return {Promise} A promise that resolves when the initialization is
	 *         complete.
	 */
	this.init = function () {
		return browserInterface.getOptionsAsync().then(rebuildMenu).then(wireStorageListener);
	};
};
