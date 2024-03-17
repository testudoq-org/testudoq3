const injectValueRequestHandler = require('./inject-value-request-handler'),
	pasteRequestHandler = require('./paste-request-handler'),
	copyRequestHandler = require('./copy-request-handler');

module.exports = function ContextMenu(standardConfig, browserInterface, menuBuilder, processMenuObject, pasteSupported) {
	// Define constant values for different handler types
	const handlerType = 'injectValue',
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
			.then(() => handlerType = 'paste')
			.catch(() => {
				browserInterface.showMessage('Could not access clipboard');
			});
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
		handlerType = 'injectValue';
		return browserInterface.removePermissions(['clipboardRead', 'clipboardWrite']);
	}

	/**
	 * Event handler function to turn on copying.
	 *
	 * This function sets the handlerType to 'copy', indicating that we are now
	 * ready to copy a value from the page.
	 */
	function turnOnCopy() {
		handlerType = 'copy';
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
	}

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
		console.log('addGenericMenus - start');
		console.log('rootMenu:', rootMenu);
		menuBuilder.separator(rootMenu);
		console.log('add separator');
		console.log('pasteSupported:', pasteSupported);
		if (pasteSupported) {
			console.log('Creating "Operational mode" sub-menu');
			const modeMenu = menuBuilder.subMenu('Operational mode', rootMenu);
			console.log('"Operational mode" sub-menu created');
			console.log('Adding choice "Inject value" to "Operational mode" sub-menu');
			const injectValueChoice = menuBuilder.choice('Inject value', modeMenu, turnOffPasting, true, handlerType);
			console.log('Choice "Inject value" added to "Operational mode" sub-menu');
			console.log('Adding choice "Simulate pasting" to "Operational mode" sub-menu');
			const pasteChoice = menuBuilder.choice('Simulate pasting', modeMenu, turnOnPasting, false, handlerType);
			console.log('Choice "Simulate pasting" added to "Operational mode" sub-menu');
			console.log('Adding choice "Copy to clipboard" to "Operational mode" sub-menu');
			const copyChoice = menuBuilder.choice('Copy to clipboard', modeMenu, turnOnCopy, false, handlerType);
			console.log('Choice "Copy to clipboard" added to "Operational mode" sub-menu');
			// Store references to the choices in an object for easy access later if needed
			const handlerChoices = {
				injectValue: injectValueChoice,
				paste: pasteChoice,
				copy: copyChoice
			};
			console.log('handlerChoices:', handlerChoices);
		}

		console.log('Adding menuItem "Customize menus" to root menu');
		menuBuilder.menuItem('Customize menus', rootMenu, browserInterface.openSettings);
		console.log('menuItem "Customize menus" added to root menu');

		console.log('Adding menuItem "Help/Support" to root menu');
		menuBuilder.menuItem('Help/Support', rootMenu, () => {
			console.log('Opening help/support url');
			if (!browserInterface) {
				console.log('browserInterface is undefined or null');
				throw new TypeError('browserInterface cannot be null or undefined');
			}
			console.log('Launching help/support url');
			browserInterface.openUrl('https://xanpho.x10.bz/testudoq-help.html');
		});
		console.log('menuItem "Help/Support" added to root menu');

		console.log('addGenericMenus - end');
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
