/* global chrome */

const DEBUG_MODE = true,
	debugLog = (...args) => {
		if (DEBUG_MODE) {
			console.log('[Gremlins Debug]', ...args);
		}
	},
	MESSAGE_TYPES = {
		START: 'startGremlins',
		STOP: 'stopGremlins',
		UPDATE: 'updateConfig',
		STATE: 'gremlinStateUpdate',
		CONTENT_READY: 'GREMLINS_CONTENT_READY',
		LIBRARY_LOADED: 'GREMLINS_LIBRARY_LOADED'
	},
	gremlinState = {
		attacking: false,
		duration: 15,
		startTime: null,
		configuration: {
			species: ['clicker', 'toucher', 'formFiller', 'scroller', 'typer'],
			mogwais: ['alert', 'fps', 'gizmo'],
			strategy: 'distribution'
		}
	},
	libraryStatus = {
		loaded: false,
		error: null,
		loading: false,
		initializationTime: null
	};

function broadcastState() {
	debugLog('Broadcasting state:', gremlinState);
	chrome.runtime.sendMessage({
		command: MESSAGE_TYPES.STATE,
		payload: {
			attacking: gremlinState.attacking,
			duration: gremlinState.duration,
			startTime: gremlinState.startTime,
			configuration: Object.assign({}, gremlinState.configuration)
		}
	});
}

function injectGremlinsLibrary() {
	debugLog('Starting library injection');
	if (libraryStatus.loaded) {
		debugLog('Library already loaded');
		return Promise.resolve(true);
	}

	if (libraryStatus.loading) {
		debugLog('Library currently loading, waiting...');
		return new Promise((resolve) => {
			const checkInterval = setInterval(() => {
				if (libraryStatus.loaded) {
					debugLog('Library load completed while waiting');
					clearInterval(checkInterval);
					resolve(true);
				}
			}, 100);
		});
	}

	libraryStatus.loading = true;
	return new Promise((resolve, reject) => {
		const script = document.createElement('script');
		script.src = chrome.runtime.getURL('gremlins.min.js');

		script.addEventListener('load', () => {
			debugLog('Library loaded successfully');
			libraryStatus.loaded = true;
			libraryStatus.loading = false;
			libraryStatus.initializationTime = Date.now();
			chrome.runtime.sendMessage({
				command: MESSAGE_TYPES.LIBRARY_LOADED,
				payload: { timestamp: libraryStatus.initializationTime }
			});
			resolve(true);
		});

		script.addEventListener('error', (e) => {
			const error = new Error('Failed to load Gremlins library: ' + e.message);
			debugLog('Library load failed:', error);
			libraryStatus.error = error;
			libraryStatus.loading = false;
			reject(error);
		});

		(document.head || document.documentElement).appendChild(script);
	});
}

async function verifyGremlinsLibrary() {
	debugLog('Verifying library state');
	const libraryExists = typeof window.gremlins !== 'undefined';
	debugLog('Library present:', libraryExists);
	return libraryExists;
}

async function ensureGremlinsLoaded() {
	debugLog('Ensuring gremlins are loaded');
	try {
		await injectGremlinsLibrary();
		const verified = await verifyGremlinsLibrary();
		debugLog('Library verification result:', verified);
		return verified;
	} catch (error) {
		debugLog('Failed to ensure gremlins loaded:', error);
		return false;
	}
}

async function startGremlinsAttack(duration, config) {
	debugLog('Starting attack with config:', { duration, config });
	try {
		const loaded = await ensureGremlinsLoaded();
		if (!loaded) {
			const error = new Error('Failed to load Gremlins library');
			debugLog('Load failed:', error);
			throw error;
		}

		if (!window.gremlins) {
			const error = new Error('Gremlins library not found in window scope');
			debugLog('Library not found:', error);
			throw error;
		}

		debugLog('Library loaded successfully, updating state');

		gremlinState.attacking = true;
		gremlinState.duration = duration || 15;
		gremlinState.startTime = Date.now();
		if (config) {
			gremlinState.configuration = Object.assign({}, config);
		}
		broadcastState();
		debugLog('State updated:', gremlinState);

		const gremlinsScript = `
			if (window.gremlins) {
				if (window.testudoHorde) {
					window.testudoHorde.stop();
				}

				window.testudoHorde = gremlins.createHorde({
					species: [
						${gremlinState.configuration.species.map(s => `gremlins.species.${s}()`).join(',\n')}
					],
					mogwais: [
						${gremlinState.configuration.mogwais.map(m => `gremlins.mogwais.${m}()`).join(',\n')}
					],
					strategies: [
						gremlins.strategies.${gremlinState.configuration.strategy}()
					]
				});

				console.log('[Gremlins] Starting attack for ${duration} seconds');
				window.testudoHorde.unleash();

				setTimeout(() => {
					if (window.testudoHorde) {
						window.testudoHorde.stop();
						window.testudoHorde = null;
						console.log('[Gremlins] Attack completed');
					}
				}, ${duration} * 1000);
			} else {
				console.error('[Gremlins] Library not found');
			}`,
			scriptElement = document.createElement('script');
		
		scriptElement.textContent = gremlinsScript;
		(document.head || document.documentElement).appendChild(scriptElement);
		scriptElement.remove();

		debugLog('Attack script injected successfully');
	} catch (error) {
		gremlinState.attacking = false;
		gremlinState.startTime = null;
		broadcastState();
		debugLog('Error starting gremlins attack:', error);
		throw error;
	}
}

function stopGremlinsAttack() {
	debugLog('Stopping gremlins attack');
	try {
		const stopScript = `
			if (window.testudoHorde) {
				window.testudoHorde.stop();
				window.testudoHorde = null;
				console.log('[Gremlins] Attack stopped');
			}`,
			scriptElement = document.createElement('script');
		
		scriptElement.textContent = stopScript;
		(document.head || document.documentElement).appendChild(scriptElement);
		scriptElement.remove();

		gremlinState.attacking = false;
		gremlinState.startTime = null;
		broadcastState();
		debugLog('Attack stopped successfully');
	} catch (error) {
		debugLog('Error stopping gremlins attack:', error);
		throw error;
	}
}

function updateConfiguration(config) {
	if (!config) {
		return;
	}
	debugLog('Updating configuration:', config);
	gremlinState.configuration = Object.assign(
		{},
		gremlinState.configuration,
		config
	);
	broadcastState();
}

function monitorAttackState() {
	setInterval(() => {
		debugLog('Attack State:', {
			attacking: gremlinState.attacking,
			hordeExists: !!window.testudoHorde,
			libraryLoaded: libraryStatus.loaded,
			startTime: gremlinState.startTime,
			runningTime: gremlinState.startTime ? (Date.now() - gremlinState.startTime) / 1000 : 0
		});
	}, 5000);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (!message.command || !MESSAGE_TYPES[message.command]) {
		return false;
	}

	debugLog('Received message:', message);

	try {
		switch (message.command) {
			case MESSAGE_TYPES.START:
				startGremlinsAttack(message.duration || 15, message.config);
				sendResponse({ status: 'started', timestamp: Date.now() });
				break;
			case MESSAGE_TYPES.STOP:
				stopGremlinsAttack();
				sendResponse({ status: 'stopped', timestamp: Date.now() });
				break;
			case MESSAGE_TYPES.UPDATE:
				updateConfiguration(message.payload && message.payload.configuration);
				sendResponse({ status: 'updated', timestamp: Date.now() });
				break;
			default:
				debugLog('Unknown gremlins command:', message.command);
				sendResponse({ status: 'error', error: 'Unknown command' });
		}
	} catch (error) {
		debugLog('Error handling gremlins command:', error);
		sendResponse({ status: 'error', error: error.message });
	}

	return true;
});

debugLog('Content script initialized', {
	url: window.location.href,
	timestamp: Date.now()
});

chrome.runtime.sendMessage({
	command: MESSAGE_TYPES.CONTENT_READY,
	payload: { url: window.location.href }
});

monitorAttackState();
injectGremlinsLibrary();
