/**
 * @module inject-value-to-active-element
 * Element value injection module
 * ES Module for Chrome Extension V3
 */

import getValue from './get-request-value.mjs';
import triggerEvents from './trigger-events.mjs';

/**
 * Constants for element types and events
 * @type {Object}
 */
const element_constants = {
	tags: {
		textarea: 'TEXTAREA',
		input: 'INPUT'
	},
	attributes: {
		contenteditable: 'contenteditable'
	},
	events: {
		value_change: ['input', 'change']
	}
};

/**
 * Helper to find the deepest active element within iframes
 * @param {HTMLElement} element - The starting element to traverse from
 * @returns {HTMLElement} The deepest active element found
 */
function findDeepestActiveElement(element) {
	let current = element;
	while (current.contentDocument) {
		current = current.contentDocument.activeElement;
		console.log('Entered content document', current);
	}
	return current;
}

/**
 * @typedef {Object} ValueInjectionRequest
 * @property {string} _type - Type of value to generate
 * @property {string|number} [value] - Value to inject for literal type
 * @property {number} [size] - Size for generated values
 * @property {string} [template] - Template for generated values
 */

/**
 * Injects a value into the active element of the document.
 * @param {ValueInjectionRequest} request - The request containing value information
 * @returns {void}
 */
export default function injectValueToActiveElement(request) {
	console.log('Injecting value to active element', request);

	const [
		actualValue,
		initialElement,
		{ tags, attributes, events },
		targetElement
	] = [
		getValue(request),
		document.activeElement,
		element_constants,
		document.activeElement ? findDeepestActiveElement(document.activeElement) : null
	];

	console.log('Active element', initialElement);
	console.log('Actual value', actualValue);

	// Check if the elements or actual value is falsy
	if (!targetElement || !actualValue) {
		console.log('Early return - no element or value');
		return;
	}

	// Inject the value into the active element based on its type
	if (targetElement.tagName === tags.textarea || targetElement.tagName === tags.input) {
		targetElement.value = actualValue;
		console.log('Setting value', targetElement.value);
		// Trigger input and change events to notify listeners
		triggerEvents(targetElement, events.value_change);
	} else if (targetElement.hasAttribute(attributes.contenteditable)) {
		targetElement.innerText = actualValue;
		console.log('Setting innerText', targetElement.innerText);
	} else {
		console.log('Element not injectable:', targetElement.tagName);
	}
}
