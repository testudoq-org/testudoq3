console.log('inject-value.mjs loaded');
/* global chrome */

// Constants
const helpers = {
	constants: {
		defaultOptions: {
			bubbles: true,
			cancelable: false
		},
		element: {
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
		},
		request: {
			type_flag: '_type',
			request_types: {
				literal: 'literal',
				size: 'size'
			}
		}
	},

	triggerEvents(element, eventArray) {
		if (!(element instanceof HTMLElement)) {
			throw new TypeError('Element must be a valid HTMLElement');
		}
		const events = Array.isArray(eventArray) ? eventArray : [eventArray];
		events.forEach(eventName => {
			const event = new Event(eventName, Object.assign({}, this.constants.defaultOptions));
			element.dispatchEvent(event);
		});
	},

	findDeepestActiveElement(element) {
		let current = element;
		while (current.contentDocument) {
			current = current.contentDocument.activeElement;
		}
		return current;
	},

	getRequestValue(request) {
		if (!request) {
			return false;
		}

		const generators = {
			literal: (req) => {
				const value = req && req.value;
				console.log('Literal value:', value);
				return value;
			},
			size: (req) => {
				if (!req) {
					return false;
				}

				const size = parseInt(req.size, 10),
					template = req.template || '';

				if (isNaN(size) || size < 0 || !template) {
					return false;
				}

				let result = template;
				while (result.length < size) {
					result += template;
				}
				return result.substring(0, size);
			}
		};

		const generator = generators[request[this.constants.request.type_flag]];
		return generator ? generator(request) : false;
	},

	executeRequest(request) {
		console.log('Executing request:', request);
		const actualValue = this.getRequestValue(request),
			initialElement = document.activeElement,
			targetElement = initialElement ? this.findDeepestActiveElement(initialElement) : null;

		if (!targetElement || !actualValue) {
			return false;
		}

		if (targetElement.tagName === this.constants.element.tags.textarea ||
			targetElement.tagName === this.constants.element.tags.input) {
			targetElement.value = actualValue;
			this.triggerEvents(targetElement, this.constants.element.events.value_change);
			return true;
		}
		
		if (targetElement.hasAttribute(this.constants.element.attributes.contenteditable)) {
			targetElement.innerText = actualValue;
			return true;
		}

		return false;
	}
};

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	console.log('Message received:', request);
	try {
		const result = helpers.executeRequest(request);
		sendResponse({ success: result });
	} catch (error) {
		console.error('Error executing request:', error);
		sendResponse({ error: error.message });
	}
	return true;
});
