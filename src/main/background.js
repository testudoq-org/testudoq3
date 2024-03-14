/* global chrome, browser */
const browserAPI = (typeof browser !== 'undefined') ? browser : chrome, // Unified browser API access
	itemHandlers = {}; // Global variable for itemHandlers

// Common imports across browsers
const ContextMenu = require('../lib/context-menu');
const processMenuObject = require('../lib/process-menu-object');
const standardConfig = require('../../template/config.json'),

	// Determine the menu builder and browser interface based on the browser type
	MenuBuilder = (typeof browser !== 'undefined') ?
		require('../lib/firefox-menu-builder') :
		require('../lib/chrome-menu-builder'),
	BrowserInterface = (typeof browser !== 'undefined') ?
		require('../lib/firefox-browser-interface') :
		require('../lib/chrome-browser-interface'),

	// Create instances based on browser type
	menuBuilderInstance = new MenuBuilder(browserAPI),
	browserInterfaceInstance = new BrowserInterface(browserAPI),

	// Initialize ContextMenu with the appropriate browser interface
	isFirefox = (typeof browser !== 'undefined'),
	contextMenu = new ContextMenu(
		standardConfig,
		browserInterfaceInstance,
		menuBuilderInstance,
		processMenuObject,
		isFirefox
	);

// Event listener for extension installation
browserAPI.runtime.onInstalled.addListener(() => {
	console.log('Extension installed');
});

// Event listener for executing scripts
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === 'executeScript') {
		browserAPI.scripting.executeScript({
			target: { tabId: sender.tab.id },
			func: () => console.log('Executed from background script')
		});
	}
});

// Initialize the context menu
contextMenu.init();
