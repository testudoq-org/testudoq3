/**
 * Function to trigger multiple events on a given element.
 *
 * @param {Element} element - The element to trigger the events on.
 * @param {Array<string>} eventArray - An array of event names to trigger.
 */
module.exports = function triggerEvents(element, eventArray) {
	const event = new CustomEvent('', { bubbles: true, cancelable: false });
	eventArray.forEach((eventName) => {
		element.dispatchEvent(new Event(eventName, event));
	});
};
