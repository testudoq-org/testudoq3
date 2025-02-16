/* global chrome */

const MESSAGE_TYPES = {
		START: 'startGremlins',
		STOP: 'stopGremlins',
		UPDATE: 'updateConfig',
		STATE: 'gremlinStateUpdate'
	},
	gremlinState = {
		attacking: false,
		duration: 15,
		configuration: {
			species: ['clicker', 'toucher', 'formFiller', 'scroller', 'typer'],
			mogwais: ['alert', 'fps', 'gizmo'],
			strategy: 'distribution'
		}
	},
	logMessages = [];

// Override console methods to capture logs
['log', 'warn', 'error'].forEach(method => {
	const originalMethod = console[method];
	console[method] = function (...args) {
		logMessages.push({ type: method, message: args.join(' ') });
		// Using originalMethod directly for debug logging to avoid recursion
		originalMethod.apply(console, [`Captured console.${method}:`, ...args]);
	};
});

// Send message with retry logic
function sendMessageWithRetry(tabId, message, maxRetries = 3) {
	console.log('Entering sendMessageWithRetry function');
	console.log('tabId:', tabId);
	console.log('message:', message);
	console.log('maxRetries:', maxRetries);

	let attempts = 0;

	function attempt() {
		console.log('Entering attempt function');
		return new Promise((resolve, reject) => {
			chrome.tabs.sendMessage(tabId, message, response => {
				console.log('chrome.tabs.sendMessage response:', response);
				if (chrome.runtime.lastError) {
					console.log('chrome.runtime.lastError:', chrome.runtime.lastError);
					if (attempts < maxRetries) {
						attempts++;
						console.log(`Attempt ${attempts} failed. Retrying in 100ms.`);
						setTimeout(() => attempt().then(resolve).catch(reject), 100);
					} else {
						reject(chrome.runtime.lastError);
						console.log('Max retries exceeded. Rejecting promise.');
					}
				} else {
					resolve(response);
					console.log('Response received. Resolving promise.');
				}
			});
		});
	}

	return attempt();
}

// Update button text based on state
function updateButtonText() {
	console.log('Updating button text based on gremlinState');
	const gremlinsButton = document.getElementById('gremlinsButton');
	if (gremlinsButton) {
		console.log('Gremlins button found. Updating text and class.');
		gremlinsButton.textContent = gremlinState.attacking ? 'Stop Gremlins' : 'Start Gremlins';
		gremlinsButton.className = gremlinState.attacking ? 'stopping' : '';
	} else {
		console.error('Gremlins button not found.');
	}
}

// Handle gremlins errors with debug logs
function handleGremlinsError(error) {
	console.log('Entering handleGremlinsError function');

	console.error('Gremlins Error:', error);

	// Reset state if unrecoverable
	console.log('Resetting gremlinState.attacking to false');
	gremlinState.attacking = false;
	updateButtonText();

	// Show user-friendly error
	console.log('Creating notification for user-friendly error');
	chrome.notifications.create({
		type: 'basic',
		iconUrl: 'testudo-16.png',
		title: 'Gremlins Error',
		message: 'Failed to execute gremlins attack. Please try reloading the page.'
	});

	console.log('Exiting handleGremlinsError function');
}

// Stop gremlins attack
function stopGremlins() {
	console.log('Stopping gremlins attack...');

	chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
		if (tabs.length === 0) {
			console.warn('No active tabs found');
			return;
		}
		const tab = tabs[0];

		console.log('Stopping gremlins attack in tab:', tab.id);

		try {
			await sendMessageWithRetry(tab.id, {
				command: MESSAGE_TYPES.STOP
			});

			console.log('Gremlins stopped successfully');
			gremlinState.attacking = false;
			updateButtonText();
		} catch (error) {
			handleGremlinsError(error);
		}
	});
}

function reloadActiveTab() {
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		if (tabs.length > 0) {
			chrome.tabs.reload(tabs[0].id);
		} else {
			console.error('No active tabs found.');
		}
	});
}

// Launch gremlins attack
function launchGremlins() {
	console.log('Launching gremlins attack...');

	const attackDurationElement = document.getElementById('attackDuration'),
		duration = attackDurationElement ? parseInt(attackDurationElement.value, 10) : gremlinState.duration;
	console.log('Attack duration determined:', duration);

	chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
		if (tabs.length === 0) {
			console.error('No active tabs found');
			return;
		}
		const tab = tabs[0];
		console.log('Active tab found:', tab.id);

		try {
			await sendMessageWithRetry(tab.id, {
				command: MESSAGE_TYPES.START,
				payload: {
					duration: duration,
					configuration: gremlinState.configuration
				}
			});

			console.log('Gremlins started successfully');
			gremlinState.attacking = true;
			gremlinState.duration = duration;
			updateButtonText();
		} catch (error) {
			console.error('Error starting gremlins:', error);
			handleGremlinsError(error);
		}
	});
}

// Toggle gremlins state
function toggleGremlins() {
	console.log('Toggling gremlins...');

	if (gremlinState.attacking) {
		console.log('Stopping gremlins...');
		stopGremlins();
	} else {
		console.log('Starting gremlins...');
		launchGremlins();
	}
}

// Export logs
function exportLogs() {
	console.log('Exporting logs...');
	const logString = logMessages.map(log => `[${log.type.toUpperCase()}] ${log.message}`).join('\n'),
		blob = new Blob([logString], { type: 'text/plain' }),
		url = URL.createObjectURL(blob),
		a = document.createElement('a');

	console.log('Log string:', logString);
	console.log('Blob created:', blob);
	console.log('URL created:', url);
	console.log('Anchor element created:', a);

	a.href = url;
	a.download = 'gremlins-log.txt';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
	console.log('Export complete');
}

// Add functions to window.testudoq namespace
window.testudoq = {
	toggleGremlins,
	launchGremlins,
	stopGremlins,
	updateButtonText,
	exportLogs
};

// Initialize popup
document.addEventListener('DOMContentLoaded', function () {
	console.log('Popup DOM fully loaded and parsed.');
	reloadActiveTab();

	const attackDurationElement = document.getElementById('attackDuration'),
		gremlinsButton = document.getElementById('gremlinsButton'),
		exportLogsButton = document.getElementById('exportLogsButton');

	if (attackDurationElement) {
		console.log('Setting attack duration to', gremlinState.duration);
		attackDurationElement.value = String(gremlinState.duration);
	} else {
		console.warn('Attack duration element not found.');
	}

	if (gremlinsButton) {
		console.log('Adding click event listener to gremlins button.');
		gremlinsButton.addEventListener('click', toggleGremlins);
	} else {
		console.warn('Gremlins button not found.');
	}

	if (exportLogsButton) {
		console.log('Adding click event listener to export logs button.');
		exportLogsButton.addEventListener('click', exportLogs);
	} else {
		console.warn('Export logs button not found.');
	}

	updateButtonText();

	// Listen for state updates
	chrome.runtime.onMessage.addListener((message) => {
		if (message.command === MESSAGE_TYPES.STATE) {
			console.log('Received state update:', message.payload);
			Object.assign(gremlinState, message.payload);
			updateButtonText();
		}
	});
});
