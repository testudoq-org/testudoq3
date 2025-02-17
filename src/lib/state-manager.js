const Logger = require('./logger');

/**
 * Manages gremlin attack state and configuration
 */
class StateManager {
	constructor() {
		throw new Error('StateManager is a static class and cannot be instantiated');
	}

	/**
	 * Get initial attack state
	 */
	static getInitialState() {
		return {
			attacking: false,
			duration: 15,
			configuration: {
				species: ['clicker', 'toucher', 'formFiller', 'scroller', 'typer'],
				mogwais: ['alert', 'fps', 'gizmo'],
				strategy: 'distribution'
			},
			timestamp: Date.now()
		};
	}

	/**
	 * Initialize state management
	 */
	static initialize() {
		StateManager.state = StateManager.getInitialState();
		StateManager.stateUpdateListeners = new Set();
		StateManager.lockHeld = false;
		StateManager.lockQueue = [];
	}

	/**
	 * Acquire state lock for atomic updates
	 */
	static async acquireStateLock() {
		if (StateManager.lockHeld) {
			return new Promise(resolve => {
				StateManager.lockQueue.push(resolve);
			});
		}

		StateManager.lockHeld = true;
		return {
			release: () => {
				StateManager.lockHeld = false;
				const nextResolver = StateManager.lockQueue.shift();
				if (nextResolver) {
					nextResolver();
				}
			}
		};
	}

	/**
	 * Register state update listener
	 */
	static addStateListener(listener) {
		StateManager.stateUpdateListeners.add(listener);
	}

	/**
	 * Remove state update listener
	 */
	static removeStateListener(listener) {
		StateManager.stateUpdateListeners.delete(listener);
	}

	/**
	 * Update state with validation
	 */
	static async updateState(changes) {
		Logger.log('StateManager', 'Updating state', { changes });

		const lock = await StateManager.acquireStateLock();
		try {
			await StateManager.validateStateChange(changes);
			const newState = await StateManager.computeNewState(changes);
			await StateManager.persistState(newState);
			StateManager.notifyStateChange(newState);
			return newState;
		} catch (error) {
			Logger.error('StateManager', 'State update failed', error);
			throw error;
		} finally {
			lock.release();
		}
	}

	/**
	 * Validate state changes
	 */
	static async validateStateChange(changes) {
		if (!changes || typeof changes !== 'object') {
			throw new Error('Invalid state changes');
		}

		if (changes.configuration) {
			StateManager.validateConfiguration(changes.configuration);
		}

		if (changes.duration && (
			typeof changes.duration !== 'number' ||
			changes.duration < 1 ||
			changes.duration > 300
		)) {
			throw new Error('Duration must be between 1 and 300 seconds');
		}
	}

	/**
	 * Validate attack configuration
	 */
	static validateConfiguration(config) {
		const validSpecies = ['clicker', 'toucher', 'formFiller', 'scroller', 'typer'],
			validMogwais = ['alert', 'fps', 'gizmo'],
			validStrategies = ['distribution', 'allTogether', 'bySpecies'];

		if (!config.species || !Array.isArray(config.species) || !config.species.length) {
			throw new Error('At least one species is required');
		}

		if (!config.species.every(s => validSpecies.includes(s))) {
			throw new Error('Invalid species specified');
		}

		if (config.mogwais && !config.mogwais.every(m => validMogwais.includes(m))) {
			throw new Error('Invalid mogwai specified');
		}

		if (config.strategy && !validStrategies.includes(config.strategy)) {
			throw new Error('Invalid strategy specified');
		}
	}

	/**
	 * Compute new state
	 */
	static async computeNewState(changes) {
		return Object.assign({}, StateManager.state, changes, {
			timestamp: Date.now()
		});
	}

	/**
	 * Persist state changes
	 */
	static async persistState(newState) {
		StateManager.state = newState;
	}

	/**
	 * Notify listeners of state change
	 */
	static notifyStateChange(newState) {
		StateManager.stateUpdateListeners.forEach(listener => {
			try {
				listener(newState);
			} catch (error) {
				Logger.error('StateManager', 'Listener notification failed', error);
			}
		});
	}

	/**
	 * Get current state
	 */
	static getState() {
		return Object.assign({}, StateManager.state);
	}

	/**
	 * Reset state to initial values
	 */
	static async reset() {
		await StateManager.updateState(StateManager.getInitialState());
	}

	/**
	 * Clean up resources
	 */
	static cleanup() {
		StateManager.stateUpdateListeners.clear();
		StateManager.lockQueue = [];
		StateManager.lockHeld = false;
	}
}

// Initialize static properties
StateManager.initialize();

module.exports = StateManager;
