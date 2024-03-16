import ChromeConfigInterface from '../lib/chrome-browser-interface';
import initConfigWidget from '../lib/init-config-widget';

/**
 * Function to handle the DOMContentLoaded event.
 * It initializes the configuration widget.
 */
document.addEventListener('DOMContentLoaded', () => {
	console.log('DOMContentLoaded event triggered.');

	// Get the main elementa
	const mainElement = document.getElementById('main');
	console.log('Main element:', mainElement);

	// Check if main element exists
	if (!mainElement) {
		console.error('Error: Main element not found.');
		return;
	}

	// Initialize configuration widget
	console.log('Initializing configuration widget.');
	initConfigWidget(mainElement, new ChromeConfigInterface(chrome));

	console.log('Configuration widget initialized successfully.');
});
