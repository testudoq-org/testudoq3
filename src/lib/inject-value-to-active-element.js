const getValue = require('./get-request-value'),
	triggerEvents = require('./trigger-events');
module.exports = function injectValueToActiveElement(request) {
	console.log('Injecting value to active element', request);
	const actualValue = getValue(request);
	let domElement = document.activeElement;
	console.log('Active element', domElement);
	console.log('Actual value', actualValue);
	if (!domElement || !actualValue) {
		console.log('Early return');
		return;
	}
	while (domElement.contentDocument) {
		domElement = domElement.contentDocument.activeElement;
		console.log('Entered content document', domElement);
	}
	if (domElement.tagName === 'TEXTAREA' || domElement.tagName === 'INPUT') {
		domElement.value = actualValue;
		console.log('Setting value', domElement.value);
		triggerEvents(domElement, ['input', 'change']);
	} else if (domElement.hasAttribute('contenteditable')) {
		domElement.innerText = actualValue;
		console.log('Setting innerText', domElement.innerText);
	}
};
