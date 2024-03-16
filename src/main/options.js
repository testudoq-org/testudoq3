import ChromeConfigInterface from '../lib/chrome-browser-interface';
import initConfigWidget from '../lib/init-config-widget';

/**
 * Function to handle the DOMContentLoaded event.
 * It initializes the configuration widget.
 */
document.addEventListener('DOMContentLoaded', () => {
	console.log('DOMContentLoaded event triggered.');

	// Get the main element
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

// Add event listener to show/hide configuration options
document.getElementById('addConfigFileButton').addEventListener('click', function () {
	console.log('Add Configuration File button clicked.');
	const configOptions = document.getElementById('configOptions'),
		noCustomDiv = document.getElementById('noCustomDiv');
	if (configOptions && noCustomDiv) {
		console.log('Toggling configuration options visibility.');
		configOptions.style.display = (configOptions.style.display === 'none') ? 'block' : 'none';
		noCustomDiv.style.display = 'none';
	} else {
		console.error('Error: Configuration options or no custom div not found.');
	}
});

// Add event listener to close the entire extension page
document.getElementById('closeExtension').addEventListener('click', function () {
	console.log('Close Extension button clicked.');
	window.close();
});

// Add event listener to close the configuration options
document.getElementById('closeButton').addEventListener('click', function () {
	console.log('Close button clicked.');
	const configOptions = document.getElementById('configOptions');
	if (configOptions) {
		console.log('Closing configuration options.');
		configOptions.style.display = 'none';
	} else {
		console.error('Error: Configuration options not found.');
	}
});
