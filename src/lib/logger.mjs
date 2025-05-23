/* global chrome */
/**
 * @module logger
 * Structured logging utility for TestudoQ extension
 * ES Module for Chrome Extension V3
 */

const [prefix, Logger] = [
	'[TestudoQ]',
	{
		/**
		 * Log debug message if debug mode is enabled
		 * @param {string} component - Component name
		 * @param {string} message - Log message
		 * @param {Object} [data] - Optional data to log
		 */
		log(component, message, data) {
			if (chrome.runtime.getManifest().debug) {
				console.log(
					`${prefix} [${component}]`,
					message,
					data ? JSON.stringify(data, null, 2) : ''
				);
			}
		},

		/**
		 * Log error with full context
		 * @param {string} component - Component name
		 * @param {string} message - Error message
		 * @param {Error} error - Error object
		 * @param {Object} [context] - Additional context data
		 */
		error(component, message, error, context = {}) {
			console.error(
				`${prefix} [${component}] ${message}`,
				'\nError:', error,
				'\nContext:', context,
				'\nStack:', error.stack
			);
		}
	}
];

export default Logger;
