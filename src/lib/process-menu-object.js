/**
 * Recursively processes a configuration object to build a menu using the
 * provided menu builder.
 *
 * @param {Object|Array} configObject - The configuration object to process.
 * @param {Object} menuBuilder - The menu builder to use.
 * @param {Object} parentMenu - The parent menu to add the processed menu items to.
 * @param {Function} onClick - The click handler for the menu items.
 */
module.exports = function processMenuObject(configObject, menuBuilder, parentMenu, onClick) {


	/**
	 * Returns the title for a given key from the config object. If the config
	 * object is an array, the value at the given key is returned. Otherwise,
	 * the key itself is returned.
	 *
	 * @param {string} key - The key to get the title for.
	 * @return {string} The title for the key.
	 */
	const getTitle = function (key) {
		if (configObject instanceof Array) {
			return configObject[key];
		}
		return key;
	};

	// If the config object is falsy, return early.
	if (!configObject) {
		return;
	}

	// Process each key and value in the config object.
	Object.keys(configObject).forEach(function (key) {
		const value = configObject[key],
			title = getTitle(key);
		let result;

		// If the value is a string or an object with a _type property, add a menu item.
		if (typeof (value) === 'string' || (typeof (value) === 'object' && value.hasOwnProperty('_type'))) {
			menuBuilder.menuItem(title, parentMenu, onClick, value);
		}
		// If the value is an object, add a sub-menu.
		else if (typeof (value) === 'object') {
			result = menuBuilder.subMenu(title, parentMenu);
			processMenuObject(value, menuBuilder, result, onClick);
		}
	});
};

