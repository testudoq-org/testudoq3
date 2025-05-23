import Logger from './logger.mjs';

// Constants and handler functions
const VALID_STRATEGIES = ['distribution', 'allTogether', 'bySpecies'],
	VALID_SPECIES = ['clicker', 'toucher', 'formFiller', 'scroller', 'typer'],
	VALID_MOGWAIS = ['alert', 'fps', 'gizmo'],
	DEFAULT_CONFIG = {
		attackDuration: 15,
		species: [...VALID_SPECIES],
		mogwais: [...VALID_MOGWAIS],
		strategy: 'distribution'
	},
	MIN_DURATION = 1,
	MAX_DURATION = 300, // 5 minutes max

	// Utility functions
	validateConfig = (config = {}) => {
		const normalizedConfig = { ...DEFAULT_CONFIG, ...config },
			errorMessages = [];

		// Validate duration
		if (typeof normalizedConfig.attackDuration !== 'number' ||
			normalizedConfig.attackDuration < MIN_DURATION ||
			normalizedConfig.attackDuration > MAX_DURATION) {
			errorMessages.push(`Attack duration must be between ${MIN_DURATION} and ${MAX_DURATION} seconds`);
		}

		// Validate species
		if (!Array.isArray(normalizedConfig.species) || normalizedConfig.species.length === 0) {
			errorMessages.push('At least one species must be selected');
		} else {
			const invalidSpecies = normalizedConfig.species.filter(s => !VALID_SPECIES.includes(s));
			if (invalidSpecies.length > 0) {
				errorMessages.push(`Invalid species: ${invalidSpecies.join(', ')}`);
			}
		}

		// Validate mogwais
		if (Array.isArray(normalizedConfig.mogwais)) {
			const invalidMogwais = normalizedConfig.mogwais.filter(m => !VALID_MOGWAIS.includes(m));
			if (invalidMogwais.length > 0) {
				errorMessages.push(`Invalid mogwais: ${invalidMogwais.join(', ')}`);
			}
		}

		// Validate strategy
		if (!VALID_STRATEGIES.includes(normalizedConfig.strategy)) {
			errorMessages.push(`Invalid strategy: ${normalizedConfig.strategy}. Must be one of: ${VALID_STRATEGIES.join(', ')}`);
		}

		if (errorMessages.length > 0) {
			throw new Error(`Configuration validation failed:\n${errorMessages.join('\n')}`);
		}

		return normalizedConfig;
	},

	// Core functions
	stopGremlinsAttack = async (browserInterface, tabId) => {
		if (!browserInterface || !tabId) {
			throw new Error('Invalid parameters: browserInterface and tabId are required');
		}

		Logger.log('GremlinsHandler', 'Stopping attack', { tabId });

		try {
			const currentState = await browserInterface.sendMessage(tabId, { command: 'getGremlinsState' }),
				response = !currentState?.attacking
					? { status: 'notRunning' }
					: await browserInterface.sendMessage(tabId, {
						command: 'stopGremlins'
					});

			Logger.log('GremlinsHandler', 'Attack stopped', { response });
			return response.status ? response : { ...response, status: 'stopped' };
		} catch (error) {
			Logger.error('GremlinsHandler', 'Failed to stop attack', error);
			throw error;
		}
	},

	executeGremlinsAttack = async (browserInterface, tabId, options = {}) => {
		if (!browserInterface || !tabId) {
			throw new Error('Invalid parameters: browserInterface and tabId are required');
		}

		Logger.log('GremlinsHandler', 'Validating attack configuration', { tabId, options });

		try {
			const config = validateConfig(options),
				attackState = await browserInterface.sendMessage(tabId, { command: 'getGremlinsState' }),
				response = await browserInterface.sendMessage(tabId, {
					command: 'startGremlins',
					config
				});

			if (attackState?.attacking) {
				throw new Error('An attack is already in progress on this tab');
			}

			Logger.log('GremlinsHandler', 'Attack started', { response });

			// Set up attack timeout
			setTimeout(async () => {
				try {
					await stopGremlinsAttack(browserInterface, tabId);
					Logger.log('GremlinsHandler', 'Attack completed (timeout)');
				} catch (error) {
					Logger.error('GremlinsHandler', 'Failed to stop attack after timeout', error);
				}
			}, config.attackDuration * 1000);

			return response;
		} catch (error) {
			Logger.error('GremlinsHandler', 'Attack failed', error);
			throw error;
		}
	};

/**
 * Gremlins attack handler with improved validation and error handling
 */
export default {
	/**
	 * Starts a gremlins attack
	 */
	start: async (browserInterface, tabId, options = {}) => {
		if (!browserInterface) {
			throw new Error('browserInterface is required');
		}

		try {
			// Get active tab if not provided
			if (!tabId) {
				tabId = await browserInterface.getActiveTabId();
				Logger.log('GremlinsHandler', 'Using active tab', { tabId });
			}

			// Verify tab is accessible
			try {
				await browserInterface.sendMessage(tabId, { command: 'ping' });
			} catch (error) {
				throw new Error(`Tab ${tabId} is not accessible: ${error.message}`);
			}

			return executeGremlinsAttack(browserInterface, tabId, options);
		} catch (error) {
			Logger.error('GremlinsHandler', 'Start attack failed', error);
			throw error;
		}
	},

	/**
	 * Stops a gremlins attack
	 */
	stop: stopGremlinsAttack,

	/**
	 * Gets valid configuration values
	 */
	getValidOptions: () => ({
		strategies: [...VALID_STRATEGIES],
		species: [...VALID_SPECIES],
		mogwais: [...VALID_MOGWAIS],
		durationLimits: {
			min: MIN_DURATION,
			max: MAX_DURATION
		}
	})
};
