/**
 * Function to trigger multiple events on a given element.
 *
 * @param {Element} element - The element to trigger the events on.
 * @param {Array<string>} eventArray - An array of event names to trigger.
 */
module.exports = function triggerEvents(element, eventArray) {
	/**
	 * Trigger each event in the event array on the given element.
	 */
	eventArray.forEach((eventName) => {
		// Create a new 'HTMLEvents' event
		const evt = document.createEvent('HTMLEvents');
		// Initialize the event with the given name, and set bubbling and cancelability to false
		evt.initEvent(eventName, true, false);
		// Dispatch the event on the given element
		element.dispatchEvent(evt);
	});
};
