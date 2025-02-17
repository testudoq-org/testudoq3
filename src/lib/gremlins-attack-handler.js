/* global chrome */
const Logger = require('./logger'),
	ResourceManager = require('./resource-manager'),
	StateManager = require('./state-manager'),
	ConfigurationManager = require('./configuration-manager');

/**
 * Load gremlins script in target tab
 * @param {Object} browserInterface - Browser interface implementation
 * @param {number} tabId - Target tab ID
 * @returns {Promise<boolean>} True if script loaded successfully
 */
async function loadGremlinsScript(browserInterface, tabId) {
	Logger.log('GremlinsHandler', 'Loading script', { tabId });

	try {
		// Let the content script handle library injection
		await browserInterface.sendMessage(tabId, {
			command: 'startGremlins',
			requireLibrary: true
		});

		Logger.log('GremlinsHandler', 'Script load request sent to content script');
		return true;
	} catch (error) {
		Logger.error('GremlinsHandler', 'Script load request failed', error);
		throw new Error('Failed to request gremlins script load');
	}
}

/**
 * Clean up attack resources
 */
async function cleanupAttackResources() {
	Logger.log('GremlinsHandler', 'Cleaning up resources');

	try {
		await ResourceManager.cleanup();
		await StateManager.updateState({
			attacking: false,
			configuration: null
		});
	} catch (error) {
		Logger.error('GremlinsHandler', 'Cleanup failed', error);
		throw error;
	}
}

/**
 * Handle attack errors and cleanup
 */
async function handleAttackError(browserInterface, tabId, error) {
	Logger.log('GremlinsHandler', 'Handling attack error', { tabId, error: error.message });

	try {
		await cleanupAttackResources();
		await browserInterface.sendMessage(tabId, { command: 'stopGremlins' }).catch(() => {});
		await StateManager.updateState({
			attacking: false,
			error: {
				message: error.message,
				timestamp: new Date().toISOString()
			}
		});
	} catch (cleanupError) {
		Logger.error('GremlinsHandler', 'Error during cleanup', cleanupError);
	}
}

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
		if (!browserInterface || !tabId) {
			throw new Error('Invalid parameters');
		}

		const config = options.config ?
				await ConfigurationManager.validateConfiguration(options.config) :
				ConfigurationManager.getProfile('default').config,
			message = {
				command: 'startGremlins',
				duration: options.duration || 15,
				config
			},
			response = await browserInterface.sendMessage(tabId, message);

		await ResourceManager.cleanup();
		await StateManager.updateState({
			attacking: true,
			duration: options.duration || 15,
			configuration: config
		});

		ResourceManager.startMonitoring();

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
			manifestVersion: chrome.runtime.getManifest().manifest_version,
			state: StateManager.getState()
		};

		Logger.error('GremlinsHandler', 'Attack execution failed', enhancedError, {
			tabId,
			options
		});

		await handleAttackError(browserInterface, tabId, enhancedError);
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
			await cleanupAttackResources();
			Logger.log('GremlinsHandler', 'Attack stopped successfully', { tabId });
			return response;
		}

		throw new Error(response && response.error ? response.error : 'Unknown error stopping gremlins');
	} catch (error) {
		Logger.error('GremlinsHandler', 'Failed to stop attack', error, { tabId });
		await handleAttackError(browserInterface, tabId, error);
		throw error;
	}
}

module.exports = {
	start: async function (browserInterface, tabId, options = {}) {
		if (!browserInterface) {
			throw new Error('browserInterface is required');
		}

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

		await loadGremlinsScript(browserInterface, tabId);
		return executeGremlinsAttack(browserInterface, tabId, options);
	},
	stop: stopGremlinsAttack
};
