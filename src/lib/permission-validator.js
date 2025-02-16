/* global chrome */
const Logger = require('./logger');

/**
 * Validate and request required permissions
 * @param {string[]} required - Array of required permissions
 * @returns {Promise<boolean>} True if all permissions are granted
 */
async function validatePermissions(required) {
	Logger.log('Permissions', 'Validating permissions', { required });

	try {
		if (!required || !Array.isArray(required)) {
			throw new Error('Required permissions must be an array');
		}

		// Get current permissions and check for missing ones
		const current = await chrome.permissions.getAll(),
			missing = required.filter(
				perm => !current.permissions.includes(perm)
			);

		Logger.log('Permissions', 'Current permissions', current);

		if (missing.length > 0) {
			Logger.log('Permissions', 'Missing permissions', missing);

			// Request missing permissions
			const granted = await chrome.permissions.request({
				permissions: missing
			});

			Logger.log('Permissions', 'Permission request result', {
				granted,
				missing
			});

			return granted;
		}

		return true;
	} catch (error) {
		Logger.error('Permissions', 'Validation failed', error);
		return false;
	}
}

/**
 * Remove specified permissions
 * @param {string[]} permissions - Permissions to remove
 * @returns {Promise<boolean>} True if permissions were removed
 */
async function removePermissions(permissions) {
	Logger.log('Permissions', 'Removing permissions', { permissions });

	try {
		if (!permissions || !Array.isArray(permissions)) {
			throw new Error('Permissions must be an array');
		}

		const result = await chrome.permissions.remove({ permissions });
		Logger.log('Permissions', 'Remove result', { result });

		return result;
	} catch (error) {
		Logger.error('Permissions', 'Remove failed', error);
		return false;
	}
}

/**
 * Check if specific permissions are granted
 * @param {string[]} permissions - Permissions to check
 * @returns {Promise<boolean>} True if all permissions are granted
 */
async function hasPermissions(permissions) {
	Logger.log('Permissions', 'Checking permissions', { permissions });

	try {
		if (!permissions || !Array.isArray(permissions)) {
			throw new Error('Permissions must be an array');
		}

		const result = await chrome.permissions.contains({ permissions });
		Logger.log('Permissions', 'Check result', { result });

		return result;
	} catch (error) {
		Logger.error('Permissions', 'Check failed', error);
		return false;
	}
}

module.exports = {
	validate: validatePermissions,
	remove: removePermissions,
	has: hasPermissions
};
