const Logger = require('./logger');

/**
 * Manages gremlins attack configurations and profiles
 */
class ConfigurationManager {
	constructor() {
		throw new Error('ConfigurationManager is a static class and cannot be instantiated');
	}

	/**
	 * Get default configuration
	 */
	static getDefaultConfig() {
		return {
			species: ['clicker', 'toucher', 'formFiller', 'scroller', 'typer'],
			mogwais: ['alert', 'fps', 'gizmo'],
			strategy: 'distribution',
			intensity: 'medium',
			frequency: 25,
			distribution: 'random'
		};
	}

	/**
	 * Initialize configuration management
	 */
	static initialize() {
		ConfigurationManager.profiles = new Map();
		ConfigurationManager.setProfile('default', ConfigurationManager.getDefaultConfig());
		ConfigurationManager.setProfile('aggressive', {
			species: ['clicker', 'toucher', 'formFiller'],
			mogwais: ['alert', 'fps'],
			strategy: 'allTogether',
			intensity: 'high',
			frequency: 100,
			distribution: 'random'
		});
		ConfigurationManager.setProfile('surgical', {
			species: ['clicker'],
			mogwais: ['fps'],
			strategy: 'bySpecies',
			intensity: 'medium',
			targeting: 'specific',
			elements: ['button', 'input[type="submit"]']
		});
		ConfigurationManager.setProfile('exploratory', {
			species: ['formFiller', 'scroller'],
			mogwais: ['fps', 'gizmo'],
			strategy: 'distribution',
			intensity: 'low',
			coverage: 'complete',
			analytics: true
		});
	}

	/**
	 * Create or update a configuration profile
	 */
	static async setProfile(name, config) {
		const validated = await ConfigurationManager.validateConfiguration(config),
			optimized = await ConfigurationManager.optimizeConfiguration(validated),
			metadata = {
				created: Date.now(),
				performance: await ConfigurationManager.benchmarkConfiguration(optimized)
			};

		ConfigurationManager.profiles.set(name, { config: optimized, metadata });
		Logger.log('ConfigurationManager', `Profile '${name}' updated`, optimized);
	}

	/**
	 * Get a configuration profile
	 */
	static getProfile(name) {
		if (!ConfigurationManager.profiles.has(name)) {
			throw new Error(`Profile '${name}' not found`);
		}
		return ConfigurationManager.profiles.get(name);
	}

	/**
	 * Validate configuration
	 */
	static async validateConfiguration(config) {
		const validSpecies = ['clicker', 'toucher', 'formFiller', 'scroller', 'typer'],
			validMogwais = ['alert', 'fps', 'gizmo'],
			validStrategies = ['distribution', 'allTogether', 'bySpecies'],
			validIntensities = ['low', 'medium', 'high'];

		if (!config || typeof config !== 'object') {
			throw new Error('Invalid configuration object');
		}

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

		if (config.intensity && !validIntensities.includes(config.intensity)) {
			throw new Error('Invalid intensity specified');
		}

		return config;
	}

	/**
	 * Optimize configuration based on performance metrics
	 */
	static async optimizeConfiguration(config) {
		const optimized = Object.assign({}, config);

		switch (optimized.intensity) {
			case 'low':
				optimized.frequency = Math.min(optimized.frequency || 25, 25);
				break;
			case 'medium':
				optimized.frequency = Math.min(optimized.frequency || 50, 50);
				break;
			case 'high':
				optimized.frequency = Math.min(optimized.frequency || 100, 100);
				break;
		}

		if (optimized.species.includes('formFiller') && optimized.species.includes('typer')) {
			Logger.log('ConfigurationManager', 'Optimizing conflicting species');
			optimized.species = optimized.species.filter(s => s !== 'typer');
		}

		return optimized;
	}

	/**
	 * Benchmark configuration performance
	 */
	static async benchmarkConfiguration(config) {
		const resourceIntensity = ConfigurationManager.calculateResourceIntensity(config),
			complexity = ConfigurationManager.calculateComplexity(config),
			estimated = {
				cpu: ConfigurationManager.estimateCpuUsage(config),
				memory: ConfigurationManager.estimateMemoryUsage(config),
				eventRate: ConfigurationManager.estimateEventRate(config)
			};

		return { resourceIntensity, complexity, estimated };
	}

	/**
	 * Calculate resource intensity score
	 */
	static calculateResourceIntensity(config) {
		const baseScore = config.species.length * 10,
			intensityMultiplier = {
				low: 0.5,
				medium: 1,
				high: 2
			}[config.intensity || 'medium'];

		return Math.round(baseScore * intensityMultiplier * (config.frequency || 25) / 25);
	}

	/**
	 * Calculate configuration complexity score
	 */
	static calculateComplexity(config) {
		return Math.round(
			(config.species.length * 20) +
			((config.mogwais || []).length * 10) +
			(config.targeting === 'specific' ? 30 : 0) +
			(config.analytics ? 20 : 0)
		);
	}

	/**
	 * Estimate CPU usage
	 */
	static estimateCpuUsage(config) {
		const baseUsage = config.species.length * 5,
			intensity = {
				low: 0.5,
				medium: 1,
				high: 2
			}[config.intensity || 'medium'];

		return Math.round(baseUsage * intensity * (config.frequency || 25) / 25);
	}

	/**
	 * Estimate memory usage (MB)
	 */
	static estimateMemoryUsage(config) {
		return Math.round(
			10 + // Base memory
			(config.species.length * 5) + // Per species
			((config.mogwais || []).length * 3) + // Per mogwai
			(config.analytics ? 15 : 0) // Analytics overhead
		);
	}

	/**
	 * Estimate events per second
	 */
	static estimateEventRate(config) {
		const baseRate = config.species.length * 2,
			intensityMultiplier = {
				low: 0.5,
				medium: 1,
				high: 2
			}[config.intensity || 'medium'];

		return Math.round(baseRate * intensityMultiplier * (config.frequency || 25) / 25);
	}
}

// Initialize profiles
ConfigurationManager.initialize();

module.exports = ConfigurationManager;
