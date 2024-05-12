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

	// If the config object is falsy, return early.
	if (!configObject) {
		return;
	}

	// Process each key and value in the config object.
	Object.keys(configObject).forEach(function (key) {
		const value = configObject[key];
		let result;

		// If the value is a string or an object with a _type property, add a menu item.
		if (value !== null && (typeof value === 'string' || (typeof value === 'object' && value.hasOwnProperty('_type')))) {
			menuBuilder.menuItem(key, parentMenu, onClick, value);
		} else if (value !== null && typeof value === 'object') {
			// If the value is an object, add a sub-menu.
			result = menuBuilder.subMenu(key, parentMenu);
			processMenuObject(value, menuBuilder, result, onClick);
		} else {
			console.error(`Ignoring value for ${key} due to null or undefined pointer.`);
		}
	});
};
