module.exports = function triggerEvents(element, eventArray) {
	if (!element) {
		throw new Error('Element cannot be null or undefined');
	}

	if (!eventArray || !Array.isArray(eventArray)) {
		throw new Error('Event array must be a non-null array');
	}

	console.log('triggerEvents called with element:', element, 'and eventArray:', eventArray);

	eventArray.forEach((eventName) => {
	  if (typeof eventName !== 'string') {
		  throw new Error('Event names in array must be strings');
	  }
	  const evt = document.createEvent('HTMLEvents');
	  evt.initEvent(eventName, true, false);
	  console.log('Dispatching event:', eventName);
	  element.dispatchEvent(evt);
	});

	console.log('triggerEvents completed');
};
