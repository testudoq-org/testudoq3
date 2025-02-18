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
	chrome.runtime.sendMessage({ command: 'updateToggleButtonText', attacking: false });
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

		attackTimeout = setTimeout(() => {
			stopGremlins();
		}, attackDuration * 1000);

		return { success: true };
	} catch (error) {
		console.error('[Gremlins] Attack failed:', error);
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
});

window.addEventListener('unhandledrejection', (event) => {
	console.error('[Gremlins] Unhandled rejection:', event.reason);
});

console.log('[Gremlins] Content script loaded');
