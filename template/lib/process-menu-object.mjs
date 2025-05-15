/**
 * @module process-menu-object
 * Menu configuration processor module
 * ES Module for Chrome Extension V3
 */

/**
 * Constants for type checks and menu processing
 * @type {Object}
 */
const menu_constants = {
	value_types: {
		string: 'string',
		object: 'object'
	},
	special_props: {
		type_flag: '_type'
	}
};

/**
 * @typedef {Object} MenuBuilder
 * @property {Function} menuItem - Creates a menu item
 * @property {Function} subMenu - Creates a submenu
 */

/**
 * @typedef {Object} MenuItem
 * @property {string} [_type] - Type of menu item for special handling
 */

/**
 * @typedef {Object|Array|MenuItem} MenuConfig
 * Configuration object that can be either a nested object structure,
 * an array of menu items, or a single menu item
 */

/**
 * Gets the title for a given key from the config object
 * @private
 * @param {MenuConfig} configObject - The configuration object
 * @param {string} key - The key to get the title for
 * @returns {string} The title for the key
 */
function getTitle(configObject, key) {
	return Array.isArray(configObject) ? configObject[key] : key;
}

/**
 * Checks if a value is a menu item (string or object with _type)
 * @private
 * @param {*} value - The value to check
 * @returns {boolean} True if the value represents a menu item
 */
function isMenuItem(value) {
	const { value_types, special_props } = menu_constants;
	return typeof value === value_types.string ||
		(typeof value === value_types.object &&
		value !== null &&
		special_props.type_flag in value);
}

/**
 * Processes a configuration object recursively to build a menu
 * @param {MenuConfig} configObject - The configuration object to process
 * @param {MenuBuilder} menuBuilder - The menu builder to use
 * @param {Object} parentMenu - The parent menu to add items to
 * @param {Function} onClick - Click handler for menu items
 * @returns {void}
 */
export default function processMenuObject(configObject, menuBuilder, parentMenu, onClick) {
	// Early return if config is invalid
	if (!configObject || !menuBuilder || !parentMenu) {
		console.warn('Process menu: Invalid arguments provided', { configObject, menuBuilder, parentMenu });
		return;
	}

	// Process each key and value in the config object
	Object.keys(configObject).forEach(key => {
		const [
			value,
			title
		] = [
			configObject[key],
			getTitle(configObject, key)
		];

		if (isMenuItem(value)) {
			menuBuilder.menuItem(title, parentMenu, onClick, value);
		} else if (typeof value === menu_constants.value_types.object && value !== null) {
			const subMenu = menuBuilder.subMenu(title, parentMenu);
			processMenuObject(value, menuBuilder, subMenu, onClick);
		} else {
			console.warn('Process menu: Skipping invalid menu item', { key, value });
		}
	});
}
