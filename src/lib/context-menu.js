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
		// If the itemMenuValue is falsy, return early.
		if (!itemMenuValue) {
			return;
		}

		// If the itemMenuValue is a string, wrap it in an object with a '_type' property set to 'literal'
		// and a 'value' property set to the itemMenuValue. Otherwise, use the itemMenuValue as is.
		const requestValue = typeof itemMenuValue === 'string' ? { '_type': 'literal', 'value': itemMenuValue } : itemMenuValue;

		// Call the appropriate request handler with the browserInterface, tabId, and requestValue,
		// and return the result of the handler.
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
		// Request permissions to read from the clipboard.
		return browserInterface.requestPermissions(['clipboardRead', 'clipboardWrite'])
			// If the permissions are granted, set the handlerType to 'paste'.
			.then(() => {
				handlerType = handlerMenus.paste;
			})
			// If an error occurs, show a message indicating that the clipboard could not be accessed.
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
		// Set the handlerType to 'injectValue' - indicating that we are no longer
		// pasting values into the page.
		handlerType = handlerMenus.injectValue;

		// Remove the 'clipboardRead' and 'clipboardWrite' permissions from the browser interface.
		// This effectively turns off pasting functionality.
		return browserInterface.removePermissions(['clipboardRead', 'clipboardWrite']);
	}

	/**
	 * Event handler function to turn on copying.
	 *
	 * This function sets the handlerType to 'copy', indicating that we are now
	 * ready to copy a value from the page.
	 */
	function turnOnCopy() {
		// Set the handlerType to 'copy' - indicating that we are now ready
		// to copy a value from the page.
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
		// Check if additionalMenus is truthy, if so, iterate over each item
		// in the array, and process the menu object.
		if (additionalMenus) {
			additionalMenus.forEach(configItem => {
				// Process the menu object, using the configItem's name and config,
				// the menuBuilder, rootMenu, and onClick functions as arguments.
				processMenuObject({ [configItem.name]: configItem.config }, menuBuilder, rootMenu, onClick);
			});
		}
	}

	/**
	 * Add generic menus to the root menu.
	 *
	 * This function adds several menus to the root menu, including an
	 * "Operational mode" sub-menu with options to inject a value, simulate
	 * pasting, and copy to clipboard. It also adds menus for customising menus
	 * and getting help/support.
	 *
	 * @param {Object} rootMenu - The root menu to attach the menus to.
	 */
	function addGenericMenus(rootMenu) {
		// Check if pasting is supported
		if (pasteSupported) {
			// Create a sub-menu for operating mode
			const modeMenu = menuBuilder.subMenu('Operational mode', rootMenu);

			// Add options to the mode menu to turn off pasting and turn on pasting
			menuBuilder.choice('Inject value', modeMenu, turnOffPasting, true, handlerMenus.injectValue);
			menuBuilder.choice('Simulate pasting', modeMenu, turnOnPasting, false, handlerMenus.paste);

			// Add an option to the mode menu to copy to clipboard
			menuBuilder.choice('Copy to clipboard', modeMenu, turnOnCopy, false, handlerMenus.copy);
		}

		// Add a menu item to the root menu for customising menus
		menuBuilder.menuItem('Customise menus', rootMenu, browserInterface.openSettings);

		// Add a menu item to the root menu for getting help/support
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
		// Create a root menu for Testudoq
		const rootMenu = menuBuilder.rootMenu('Testudoq');

		// Process the standard config if not asked to skip it
		if (!options || !options.skipStandard) {
			processMenuObject(standardConfig, menuBuilder, rootMenu, onClick);
		}

		// Load additional menus
		loadAdditionalMenus(options && options.additionalMenus, rootMenu);

		// Add generic menus
		addGenericMenus(rootMenu);

		/**
		 * Sets up a listener for changes in browser storage, which will trigger a
		 * rebuild of the menu.
		 */
		function wireStorageListener() {
			// Add a listener for changes in browser storage
			browserInterface.addStorageListener(() => {
				// Remove all existing menu items
				menuBuilder.removeAll()
					// Get the current options
					.then(browserInterface.getOptionsAsync)
					// Rebuild the menu with the new options
					.then(rebuildMenu);
			});
		}


		/**
		 * Initializes the context menu by getting the options, rebuilding the menu,
		 * and wiring up the storage listener.
		 *
		 * @return {Promise} A promise that resolves when the initialization is
		 *         complete.
		 */
		this.init = function () {
			// Get the options, rebuild the menu, and wire up the storage listener
			return browserInterface.getOptionsAsync() // Get the options
				.then(rebuildMenu) // Rebuild the menu
				.then(wireStorageListener); // Wire up the storage listener
		};
	};
};

