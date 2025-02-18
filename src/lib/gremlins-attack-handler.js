const Logger = require('./logger');

/**
 * Simple handler for gremlins attacks that removes complex state management
 * and resource handling in favor of direct command execution
 */
async function executeGremlinsAttack(browserInterface, tabId, options = {}) {
	if (!browserInterface || !tabId) {
		throw new Error('Invalid parameters: browserInterface and tabId are required');
	}

	Logger.log('GremlinsHandler', 'Starting attack', { tabId, options });

	try {
		// Simple config with defaults
		const config = {
				attackDuration: options.duration || 15,
				species: options.species || ['clicker', 'toucher', 'formFiller', 'scroller', 'typer'],
				mogwais: options.mogwais || ['alert', 'fps', 'gizmo'],
				strategy: options.strategy || 'distribution'
			},
			response = await browserInterface.sendMessage(tabId, {
				command: 'startGremlins',
				config
			});

		Logger.log('GremlinsHandler', 'Attack started', { response });
		return response;

	} catch (error) {
		Logger.error('GremlinsHandler', 'Attack failed', error);
		throw error;
	}
}

async function stopGremlinsAttack(browserInterface, tabId) {
	if (!browserInterface || !tabId) {
		throw new Error('Invalid parameters: browserInterface and tabId are required');
	}

	Logger.log('GremlinsHandler', 'Stopping attack', { tabId });

	try {
		const response = await browserInterface.sendMessage(tabId, {
			command: 'stopGremlins'
		});

		Logger.log('GremlinsHandler', 'Attack stopped', { response });
		return response;

	} catch (error) {
		Logger.error('GremlinsHandler', 'Failed to stop attack', error);
		throw error;
	}
}

module.exports = {
	start: async function (browserInterface, tabId, options = {}) {
		if (!browserInterface) {
			throw new Error('browserInterface is required');
		}

		if (!tabId) {
			try {
				tabId = await browserInterface.getActiveTabId();
			} catch (error) {
				Logger.error('GremlinsHandler', 'Failed to get active tab', error);
				throw error;
			}
		}

		return executeGremlinsAttack(browserInterface, tabId, options);
	},
	stop: stopGremlinsAttack
};
