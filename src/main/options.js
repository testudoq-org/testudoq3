import ChromeConfigInterface from '../lib/chrome-browser-interface';
import initConfigWidget from '../lib/init-config-widget';

/**
 * Function to handle the DOMContentLoaded event.
 * It initializes the configuration widget.
 */
/* global chrome */
document.addEventListener('DOMContentLoaded', () => {
	console.log('DOMContentLoaded event triggered.');

	// Get the main element
	let mainElement;
	try {
		mainElement = document.getElementById('main');
		console.log('Main element:', mainElement);
	} catch (error) {
		console.error('Error while accessing main element:', error);
		return;
	}

	// Check if main element exists
	if (!mainElement) {
		console.error('Error: Main element not found.');
		return;
	}

	// Initialize configuration widget
	console.log('Initializing configuration widget.');
	try {
		initConfigWidget(mainElement, new ChromeConfigInterface(chrome));
		console.log('Configuration widget initialized successfully.');
	} catch (error) {
		console.error('Error while initializing configuration widget:', error);
	}

	// Setup event listeners with error handling
	try {
		// Add Configuration File button
		const addConfigButton = document.getElementById('addConfigFileButton'),
			configOptions = document.getElementById('configOptions'),
			noCustomDiv = document.getElementById('noCustomDiv'),
			closeButton = document.getElementById('closeButton'),
			closeExtensionButton = document.getElementById('closeExtension');

		if (addConfigButton) {
			addConfigButton.addEventListener('click', function () {
				console.log('Add Configuration File button clicked.');
				if (configOptions && noCustomDiv) {
					console.log('Toggling configuration options visibility.');
					configOptions.style.display = (configOptions.style.display === 'none') ? 'block' : 'none';
					if (noCustomDiv.style) {
						noCustomDiv.style.display = 'none';
					}
				} else {
					console.error('Error: Configuration options or no custom div not found.');
				}
			});
		} else {
			console.error('Error: Add Configuration File button not found');
		}

		if (closeButton) {
			closeButton.addEventListener('click', function () {
				console.log('Close button clicked.');
				if (configOptions) {
					console.log('Closing configuration options.');
					configOptions.style.display = 'none';
				} else {
					console.error('Error: Configuration options not found.');
				}
			});
		} else {
			console.error('Error: Close button not found');
		}

		if (closeExtensionButton) {
			closeExtensionButton.addEventListener('click', function () {
				window.close();
			});
		} else {
			console.error('Error: Close Extension button not found');
		}
	} catch (error) {
		console.error('Error setting up event listeners:', error);
	}
});
