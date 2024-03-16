import ChromeConfigInterface from '../lib/chrome-browser-interface';
import initConfigWidget from '../lib/init-config-widget';

/**
 * Function to handle the DOMContentLoaded event.
 * It initializes the configuration widget.
 */
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
});

// Add event listener to show/hide configuration options
document.getElementById('addConfigFileButton').addEventListener('click', function () {
	console.log('Add Configuration File button clicked.');
	const configOptions = document.getElementById('configOptions'),
		noCustomDiv = document.getElementById('noCustomDiv');
	if (configOptions && noCustomDiv) {
		console.log('Toggling configuration options visibility.');
		configOptions.style.display = (configOptions.style.display === 'none') ? 'block' : 'none';
		if (noCustomDiv.style) { // Check if style property exists before accessing it
			noCustomDiv.style.display = 'none';
		}
	} else {
		console.error('Error: Configuration options or no custom div not found.');
	}
});

// Add event listener to close the configuration options
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


// Function to rebuild the menu
const rebuildMenu = function () {
	console.log('Rebuilding menu...');
	// Clear the menu list
	const list = document.getElementById('configOptions');
	console.log('Clearing menu list...');
	list.innerHTML = '';

	// Check if additional menus exist
	const additionalMenus = []; // Example data
	console.log('Checking if additional menus exist...');
	if (additionalMenus && additionalMenus.length) {
		console.log(`Found ${additionalMenus.length} additional menus.`);
		additionalMenus.forEach(function (configItem, index) {
			console.log(`Cloning template for menu item ${index + 1}...`);
			// Clone the template for each menu item
			const clone = template.cloneNode(true);
			list.appendChild(clone);
			console.log(`Setting name of menu item ${index + 1}...`);
			clone.querySelector('[role=name]').textContent = configItem.name;

			// Add link or text for source based on remote status
			console.log(`Setting source for menu item ${index + 1}...`);
			if (configItem.remote) {
				addLink(clone.querySelector('[role=source]'), configItem.source);
			} else {
				clone.querySelector('[role=source]').textContent = configItem.source || '';
			}

			// Add event listener to remove the menu item
			console.log(`Adding event listener to remove menu item ${index + 1}...`);
			clone.querySelector('[role=remove]').addEventListener('click', function () {
				console.log(`Removing menu item ${index + 1}...`);
				additionalMenus.splice(index, 1);
				rebuildMenu();
				saveOptions();
			});
		});
		console.log('Showing custom config loaded message...');
		document.getElementById('noCustomDiv').style.display = 'none';
		document.getElementById('yesCustomDiv').style.display = 'block';
	} else {
		console.log('Showing no custom config loaded message...');
		document.getElementById('yesCustomDiv').style.display = 'none';
		document.getElementById('noCustomDiv').style.display = 'block';
	}
};
