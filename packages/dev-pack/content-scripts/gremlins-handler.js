/* global chrome, gremlins */

let horde = null,
	attackTimeout = null;

function stopGremlins() {
	console.log('[Gremlins] Stopping attack');
	if (horde) {
		horde.stop();
		horde = null;
	}
	if (attackTimeout) {
		clearTimeout(attackTimeout);
		attackTimeout = null;
	}
	// Notify popup that attack has stopped
	chrome.runtime.sendMessage({ command: 'updateGremlinsState', attacking: false });
}

function startGremlins(config) {
	console.log('[Gremlins] Starting attack with config:', config);
	const { attackDuration, species, mogwais, strategy } = config;

	if (horde) {
		stopGremlins();
	}

	try {
		const speciesConfig = species.map(s => gremlins.species[s]()),
			mogwaisConfig = mogwais.map(m => gremlins.mogwais[m]()),
			strategyConfig = gremlins.strategies[strategy]();

		horde = gremlins.createHorde({
			species: speciesConfig,
			mogwais: mogwaisConfig,
			strategies: [strategyConfig]
		});

		console.log('[Gremlins] Unleashing horde');
		horde.unleash();

		// Notify popup that attack has started
		chrome.runtime.sendMessage({ command: 'updateGremlinsState', attacking: true });

		attackTimeout = setTimeout(() => {
			stopGremlins(); // This will send the attacking:false message
		}, attackDuration * 1000);

		return { success: true };
	} catch (error) {
		console.error('[Gremlins] Attack failed:', error);
		// Ensure popup is notified of failure
		chrome.runtime.sendMessage({ command: 'updateGremlinsState', attacking: false });
		return { success: false, error: error.message };
	}
}

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	console.log('[Gremlins] Received message:', message);

	if (message.command === 'startGremlins') {
		const result = startGremlins(message.config);
		sendResponse(result);
		return true;
	}

	if (message.command === 'stopGremlins') {
		stopGremlins();
		sendResponse({ success: true });
		return true;
	}

	return false;
});

// Error handling
window.addEventListener('error', (event) => {
	console.error('[Gremlins] Error:', event.error);
	chrome.runtime.sendMessage({ command: 'updateGremlinsState', attacking: false });
});

window.addEventListener('unhandledrejection', (event) => {
	console.error('[Gremlins] Unhandled rejection:', event.reason);
	chrome.runtime.sendMessage({ command: 'updateGremlinsState', attacking: false });
});

console.log('[Gremlins] Content script loaded');
