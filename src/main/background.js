/* global chrome, browser */
let browserAPI; // Unified browser API access
const itemHandlers = {}; // Global variable for itemHandlers

// Determine browser API
if (typeof browser !== 'undefined') {
  browserAPI = browser; // Firefox
} else {
  browserAPI = chrome; // Chrome/Edge
}

// Common imports across browsers
const ContextMenu = require('../lib/context-menu');
const processMenuObject = require('../lib/process-menu-object');
const standardConfig = require('../../template/config.json');

// Determine the menu builder and browser interface based on the browser type
let MenuBuilder, BrowserInterface;

if (typeof browser !== 'undefined') {
  // Firefox-specific modules
  MenuBuilder = require('../lib/firefox-menu-builder');
  BrowserInterface = require('../lib/firefox-browser-interface');
} else {
  // Chrome/Edge-specific modules
  MenuBuilder = require('../lib/chrome-menu-builder');
  BrowserInterface = require('../lib/chrome-browser-interface');
}

// Create instances based on browser type
const menuBuilderInstance = new MenuBuilder(browserAPI);
const browserInterfaceInstance = new BrowserInterface(browserAPI);

// Determine if it's Firefox or Chrome/Edge and initialize ContextMenu accordingly
const isFirefox = typeof browser === 'undefined';
const contextMenu = new ContextMenu(
  standardConfig,
  browserInterfaceInstance,
  menuBuilderInstance,
  processMenuObject,
  isFirefox
);

// Event listener for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

// Event listener for executing scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'executeScript') {
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      func: () => console.log('Executed from background script')
    });
  }
});

// Initialize the context menu
contextMenu.init();
