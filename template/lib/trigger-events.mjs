/**
 * @module trigger-events
 * Function module for triggering multiple DOM events on elements
 * ES Module for Chrome Extension V3
 */

/**
 * Default event options
 * @type {Object}
 */
const default_options = {
	bubbles: true,
	cancelable: false
};

/**
 * Triggers multiple events on a given element.
 * @param {HTMLElement} element - The element to trigger the events on.
 * @param {Array<string>} eventArray - An array of event names to trigger.
 * @returns {void}
 * @throws {TypeError} If element is not a valid HTMLElement
 */
export default function triggerEvents(element, eventArray) {
	if (!(element instanceof HTMLElement)) {
		throw new TypeError('Element must be a valid HTMLElement');
	}

	// Ensure array input and trigger each event
	const events = Array.isArray(eventArray) ? eventArray : [eventArray];
	events.forEach(eventName => {
		const event = new Event(eventName, Object.assign({}, default_options));
		element.dispatchEvent(event);
	});
}
