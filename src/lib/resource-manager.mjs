import Logger from './logger.mjs';

/**
 * Manages resources and memory for gremlins attacks
 */
class ResourceManager {
	constructor() {
		throw new Error('ResourceManager is a static class and cannot be instantiated');
	}

	/**
	 * Start monitoring system resources
	 */
	static startMonitoring() {
		Logger.log('ResourceManager', 'Starting resource monitoring');

		ResourceManager.monitors = new Set();
		ResourceManager.metrics = {
			memoryUsage: [],
			eventListeners: [],
			domNodes: [],
			timestamp: Date.now()
		};

		ResourceManager.monitors.add(setInterval(() => {
			ResourceManager.checkResources();
		}, 5000));
	}

	/**
	 * Check system resources and trigger cleanup if needed
	 */
	static async checkResources() {
		try {
			// Check memory usage
			if (window.performance && window.performance.memory) {
				const memUsage = window.performance.memory.usedJSHeapSize;
				ResourceManager.metrics.memoryUsage.push(memUsage);

				if (memUsage > ResourceManager.MEMORY_THRESHOLD) {
					Logger.log('ResourceManager', 'Memory threshold exceeded', { memUsage });
					await ResourceManager.cleanupMemory();
				}
			}

			// Check event listeners
			const listeners = ResourceManager.countEventListeners(),
				nodes = document.getElementsByTagName('*').length;

			ResourceManager.metrics.eventListeners.push(listeners);

			if (listeners > ResourceManager.EVENT_THRESHOLD) {
				Logger.log('ResourceManager', 'Event listener threshold exceeded', { listeners });
				await ResourceManager.cleanupEventListeners();
			}

			// Check DOM nodes
			ResourceManager.metrics.domNodes.push(nodes);

			if (nodes > ResourceManager.DOM_THRESHOLD) {
				Logger.log('ResourceManager', 'DOM node threshold exceeded', { nodes });
				await ResourceManager.cleanupDOM();
			}

			// Trim metrics arrays to prevent memory bloat
			if (ResourceManager.metrics.memoryUsage.length > 100) {
				ResourceManager.metrics.memoryUsage = ResourceManager.metrics.memoryUsage.slice(-50);
				ResourceManager.metrics.eventListeners = ResourceManager.metrics.eventListeners.slice(-50);
				ResourceManager.metrics.domNodes = ResourceManager.metrics.domNodes.slice(-50);
			}
		} catch (error) {
			Logger.error('ResourceManager', 'Error checking resources', error);
		}
	}

	/**
	 * Count active event listeners
	 */
	static countEventListeners() {
		try {
			const elements = document.getElementsByTagName('*'),
				getListeners = window.getEventListeners || (() => ({}));
			let count = 0;

			for (const element of elements) {
				count += Object.keys(getListeners(element)).length;
			}

			return count;
		} catch (error) {
			Logger.error('ResourceManager', 'Error counting event listeners', error);
			return 0;
		}
	}

	/**
	 * Clean up excess memory usage
	 */
	static async cleanupMemory() {
		Logger.log('ResourceManager', 'Initiating memory cleanup');

		try {
			// Stop any running gremlins
			if (window.testudoHorde) {
				window.testudoHorde.stop();
			}

			// Clear unused objects
			if (window.gc) {
				window.gc();
			}

			// Clear metrics older than 1 hour
			const hourAgo = Date.now() - 3600000;
			Object.keys(ResourceManager.metrics).forEach(key => {
				if (Array.isArray(ResourceManager.metrics[key])) {
					ResourceManager.metrics[key] = ResourceManager.metrics[key].filter(
						metric => metric.timestamp > hourAgo
					);
				}
			});

			Logger.log('ResourceManager', 'Memory cleanup completed');
		} catch (error) {
			Logger.error('ResourceManager', 'Error during memory cleanup', error);
		}
	}

	/**
	 * Clean up excess event listeners
	 */
	static async cleanupEventListeners() {
		Logger.log('ResourceManager', 'Initiating event listener cleanup');

		try {
			const elements = document.getElementsByTagName('*'),
				getListeners = window.getEventListeners || (() => ({}));

			for (const element of elements) {
				const listeners = getListeners(element);
				Object.keys(listeners).forEach(type => {
					if (!type.startsWith('gremlin')) {
						return; // Skip non-gremlin listeners
					}
					listeners[type].forEach(listener => {
						element.removeEventListener(type, listener.listener);
					});
				});
			}

			Logger.log('ResourceManager', 'Event listener cleanup completed');
		} catch (error) {
			Logger.error('ResourceManager', 'Error during event listener cleanup', error);
		}
	}

	/**
	 * Clean up excess DOM nodes
	 */
	static async cleanupDOM() {
		Logger.log('ResourceManager', 'Initiating DOM cleanup');

		try {
			const elements = document.getElementsByTagName('*'),
				gremlinsElements = Array.from(elements).filter(
					element => element.hasAttribute('data-gremlin')
				);

			gremlinsElements.forEach(element => {
				if (element && element.parentNode) {
					element.parentNode.removeChild(element);
				}
			});

			Logger.log('ResourceManager', 'DOM cleanup completed');
		} catch (error) {
			Logger.error('ResourceManager', 'Error during DOM cleanup', error);
		}
	}

	/**
	 * Stop monitoring and clean up resources
	 */
	static async cleanup() {
		Logger.log('ResourceManager', 'Initiating full cleanup');

		try {
			// Clear monitoring intervals
			if (ResourceManager.monitors) {
				ResourceManager.monitors.forEach(clearInterval);
				ResourceManager.monitors.clear();
			}

			// Run all cleanups
			await Promise.all([
				ResourceManager.cleanupMemory(),
				ResourceManager.cleanupEventListeners(),
				ResourceManager.cleanupDOM()
			]);

			// Reset metrics
			ResourceManager.metrics = {
				memoryUsage: [],
				eventListeners: [],
				domNodes: [],
				timestamp: null
			};

			Logger.log('ResourceManager', 'Full cleanup completed');
		} catch (error) {
			Logger.error('ResourceManager', 'Error during full cleanup', error);
		}
	}

	/**
	 * Get current resource metrics
	 */
	static getMetrics() {
		const metrics = Object.assign({}, ResourceManager.metrics),
			currentMemory = window.performance && window.performance.memory ?
				window.performance.memory.usedJSHeapSize : null;

		metrics.currentMemory = currentMemory;
		metrics.currentListeners = ResourceManager.countEventListeners();
		metrics.currentNodes = document.getElementsByTagName('*').length;
		return metrics;
	}
}

// Constants
ResourceManager.MEMORY_THRESHOLD = 100 * 1024 * 1024; // 100MB
ResourceManager.EVENT_THRESHOLD = 1000;
ResourceManager.DOM_THRESHOLD = 5000;

export default ResourceManager;
