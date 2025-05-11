/* eslint-env webextensions */

let attacking = false;

export function updateButtonText() {
	const button = document.getElementById('gremlinsButton');
	button.textContent = attacking ? 'Stop Gremlins' : 'Start Gremlins';
}

export async function stopGremlins() {
	const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
	if (tabs.length === 0) {
		return;
	}

	try {
		await chrome.tabs.sendMessage(tabs[0].id, {
			command: 'stopGremlins'
		});
		attacking = false;
		updateButtonText();
		console.log('Gremlins stopped successfully');
	} catch (error) {
		console.error('Failed to stop gremlins:', error);
	}
}

export async function launchGremlins() {
	const attackDurationElement = document.getElementById('attackDuration'),
		attackDuration = attackDurationElement ? parseInt(attackDurationElement.value, 10) : 15,
		species = Array.from(document.querySelectorAll('input[name="species"]:checked'))
			.map(checkbox => checkbox.id),
		mogwais = Array.from(document.querySelectorAll('input[name="mogwais"]:checked'))
			.map(checkbox => checkbox.id),
		strategy = document.querySelector('input[name="strategy"]:checked').id,
		tabs = await chrome.tabs.query({ active: true, currentWindow: true });

	if (tabs.length === 0) {
		console.error('No active tabs found');
		return;
	}

	try {
		// First inject the gremlins library
		await chrome.scripting.executeScript({
			target: { tabId: tabs[0].id },
			files: ['gremlins.min.js']
		});

		// Then start the attack
		await chrome.tabs.sendMessage(tabs[0].id, {
			command: 'startGremlins',
			config: {
				attackDuration,
				species,
				mogwais,
				strategy
			}
		});

		console.log('Gremlins started successfully');
		attacking = true;
		updateButtonText();
	} catch (error) {
		console.error('Failed to launch gremlins:', error);
		attacking = false;
		updateButtonText();
	}
}

export function toggleGremlins() {
	if (attacking) {
		stopGremlins();
	} else {
		launchGremlins();
	}
}

// Listen for state updates from content script
chrome.runtime.onMessage.addListener((message) => {
	if (message.command === 'updateGremlinsState') {
		attacking = message.attacking;
		updateButtonText();
		console.log('Gremlins state updated:', attacking);
	}
});

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
	const gremlinsButton = document.getElementById('gremlinsButton');
	if (gremlinsButton) {
		gremlinsButton.addEventListener('click', toggleGremlins);
		updateButtonText();
	} else {
		console.error('Gremlins button not found.');
	}
});
