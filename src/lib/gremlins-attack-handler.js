/* global chrome */
const Logger = require('./logger');

/**
 * Execute a gremlins attack on the specified tab
 * @param {Object} browserInterface - Browser interface implementation
 * @param {number} tabId - Target tab ID
 * @param {Object} [options] - Attack configuration options
 * @returns {Promise<Object>} Attack execution result
 */
async function executeGremlinsAttack(browserInterface, tabId, options = {}) {
	Logger.log('GremlinsHandler', 'Initiating attack', { tabId, options });

	try {
		// Validate inputs
		if (!browserInterface || !tabId) {
			throw new Error('Invalid parameters');
		}

		// Log pre-execution state
		Logger.log('GremlinsHandler', 'Pre-execution state', {
			manifestVersion: chrome.runtime.getManifest().manifest_version,
			permissions: await chrome.permissions.getAll()
		});

		const message = {
				command: 'startGremlins',
				duration: options.duration || 15,
				config: options.config || {}
			},
			response = await browserInterface.sendMessage(tabId, message);

		Logger.log('GremlinsHandler', 'Sending message', message);
		Logger.log('GremlinsHandler', 'Received response', response);

		if (response && response.status === 'started') {
			Logger.log('GremlinsHandler', 'Attack started successfully', {
				tabId,
				timestamp: new Date().toISOString()
			});
			return response;
		}

		throw new Error(response && response.error ? response.error : 'Unknown error');
	} catch (error) {
		const enhancedError = new Error(`Gremlins attack failed: ${error.message}`);
		enhancedError.originalError = error;
		enhancedError.context = {
			tabId,
			options,
			timestamp: new Date().toISOString(),
			manifestVersion: chrome.runtime.getManifest().manifest_version
		};

		Logger.error('GremlinsHandler', 'Attack execution failed', enhancedError, {
			tabId,
			options
		});

		throw enhancedError;
	}
}

/**
 * Stop an ongoing gremlins attack
 * @param {Object} browserInterface - Browser interface implementation
 * @param {number} tabId - Target tab ID
 * @returns {Promise<void>}
 */
async function stopGremlinsAttack(browserInterface, tabId) {
	Logger.log('GremlinsHandler', 'Stopping attack', { tabId });

	try {
		if (!browserInterface || !tabId) {
			throw new Error('browserInterface and tabId are required');
		}

		const response = await browserInterface.sendMessage(tabId, { command: 'stopGremlins' });
		Logger.log('GremlinsHandler', 'Stop command response', response);

		if (response && response.status === 'stopped') {
			Logger.log('GremlinsHandler', 'Attack stopped successfully', { tabId });
			return response;
		}

		throw new Error(response && response.error ? response.error : 'Unknown error stopping gremlins');
	} catch (error) {
		Logger.error('GremlinsHandler', 'Failed to stop attack', error, { tabId });
		throw error;
	}
}

/**
 * Load and verify gremlins script in target tab
 * @param {Object} browserInterface - Browser interface implementation
 * @param {number} tabId - Target tab ID
 * @returns {Promise<boolean>} True if script loaded successfully
 */
async function loadGremlinsScript(browserInterface, tabId) {
	Logger.log('GremlinsHandler', 'Loading script', { tabId });

	try {
		// First try loading from extension
		const localPath = chrome.runtime.getURL('gremlins.min.js');
		Logger.log('GremlinsHandler', 'Attempting local load', { path: localPath });

		await browserInterface.executeScript(tabId, {
			file: 'gremlins.min.js'
		});

		Logger.log('GremlinsHandler', 'Local script loaded successfully');
		return true;
	} catch (error) {
		Logger.error('GremlinsHandler', 'Local load failed', error);

		// Fallback to CDN
		try {
			Logger.log('GremlinsHandler', 'Attempting CDN fallback');
			const cdnUrl = 'https://unpkg.com/gremlins.js';

			await browserInterface.executeScript(tabId, {
				code: `
					new Promise((resolve, reject) => {
						const script = document.createElement('script');
						script.src = '${cdnUrl}';
						script.onload = resolve;
						script.onerror = reject;
						document.head.appendChild(script);
					})
				`
			});

			Logger.log('GremlinsHandler', 'CDN script loaded successfully');
			return true;
		} catch (cdnError) {
			Logger.error('GremlinsHandler', 'CDN load failed', cdnError);
			throw new Error('Failed to load gremlins script from all sources');
		}
	}
}

module.exports = {
	start: async function (browserInterface, tabId, options = {}) {
		if (!browserInterface) {
			throw new Error('browserInterface is required');
		}

		// If tabId is not provided, get active tab
		if (!tabId) {
			Logger.log('GremlinsHandler', 'No tabId provided, getting active tab');
			try {
				tabId = await browserInterface.getActiveTabId();
				Logger.log('GremlinsHandler', 'Retrieved active tab', { tabId });
			} catch (error) {
				Logger.error('GremlinsHandler', 'Failed to get active tab', error);
				throw error;
			}
		}

		// Ensure script is loaded before starting attack
		await loadGremlinsScript(browserInterface, tabId);
		return executeGremlinsAttack(browserInterface, tabId, options);
	},
	stop: stopGremlinsAttack
};
