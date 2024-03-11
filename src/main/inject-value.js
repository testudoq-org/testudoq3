/*global chrome*/
const executeRequest = require('../lib/inject-value-to-active-element');

const listener = function (request /*, sender, sendResponse */) {
	'use strict';
	console.log('Received request:', request);
	executeRequest(request);
	chrome.runtime.onMessage.removeListener(listener);
	console.log('Listener removed');
};

console.log('Adding listener');
chrome.runtime.onMessage.addListener(listener);
console.log('Listener added');
chrome.runtime.onMessage.addListener(listener);
