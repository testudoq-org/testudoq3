const getValue = require('./get-request-value'); // Importing the function to get the value
const triggerEvents = require('./trigger-events'); // Importing the function to trigger events

/**
 * Injects a value into the active element of the document.
 * @param {Object} request - The request object containing information about the value to inject.
 */
module.exports = function injectValueToActiveElement(request) {
	console.log('Injecting value to active element', request);

	// Get the actual value based on the request
	const actualValue = getValue(request);
	let domElement = document.activeElement; // Get the currently active element in the document
	console.log('Active element', domElement);
	console.log('Actual value', actualValue);

	// Check if the active element or the actual value is falsy
	if (!domElement || !actualValue) {
		console.log('Early return');
		return; // Exit early if either is falsy
	}

	// Traverse through content documents if the active element is within an iframe
	while (domElement.contentDocument) {
		domElement = domElement.contentDocument.activeElement;
		console.log('Entered content document', domElement);
	}

	// Inject the value into the active element based on its type
	if (domElement.tagName === 'TEXTAREA' || domElement.tagName === 'INPUT') {
		// If the active element is a textarea or input field, set its value
		domElement.value = actualValue;
		console.log('Setting value', domElement.value);
		// Trigger input and change events to notify listeners about the value change
		triggerEvents(domElement, ['input', 'change']);
	} else if (domElement.hasAttribute('contenteditable')) {
		// If the active element is content editable, set its inner text
		domElement.innerText = actualValue;
		console.log('Setting innerText', domElement.innerText);
	}
};
