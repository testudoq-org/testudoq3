/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/lib/get-request-value.js":
/*!**************************************!*\
  !*** ./src/lib/get-request-value.js ***!
  \**************************************/
/***/ ((module) => {

// Constants
const type_flag = '_type';

// Generators for different types of requests
const generators = {
	// Generator for literal type requests
	literal: function (request) {
		console.log('Getting literal value from request:', request);
		const value = request.value;
		console.log('get-request-value: literal Value:', value);
		return value;
	},
	// Generator for size type requests
	size: function (request) {
		console.log('Getting size value from request:', request);
		const size = parseInt(request.size, 10);
		console.log('get-request-value: size Size:', size);
		let value = request.template;
		console.log('get-request-value: size Template:', value);
		// Repeat the template until it reaches the specified size
		while (value.length < size) {
			console.log('get-request-value: size Value length:', value.length);
			console.log('get-request-value: size Template length:', request.template.length);
			value += request.template;
			console.log('get-request-value: size New Value length:', value.length);
		}
		// Trim the value to match the requested size
		const result = value.substring(0, request.size);
		console.log('get-request-value: size Result:', result);
		return result;
	}
};

/**
 * Function to get the value from a request.
 * @param {Object} request - The request object containing the value information.
 * @returns {any} The value obtained from the request.
 */
module.exports = function getRequestValue(request) {
	console.log('get-request-value: Start with request:', request);
	// Check if the request is falsy
	if (!request) {
		console.log('get-request-value: Request is falsy, returning false');
		return false;
	}
	// Get the generator based on the request type
	const generator = generators[request[type_flag]];
	console.log('get-request-value: generator:', generator);
	// If no generator found for the request type, return false
	if (!generator) {
		console.log('get-request-value: No generator found, returning false');
		return false;
	}
	console.log('get-request-value: Calling generator with request:', request);
	// Call the generator function with the request and return the result
	const result = generator(request);
	console.log('get-request-value: Result:', result);
	return result;
};


/***/ }),

/***/ "./src/lib/inject-value-to-active-element.js":
/*!***************************************************!*\
  !*** ./src/lib/inject-value-to-active-element.js ***!
  \***************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const getValue = __webpack_require__(/*! ./get-request-value */ "./src/lib/get-request-value.js"); // Importing the function to get the value
const triggerEvents = __webpack_require__(/*! ./trigger-events */ "./src/lib/trigger-events.js"); // Importing the function to trigger events

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


/***/ }),

/***/ "./src/lib/trigger-events.js":
/*!***********************************!*\
  !*** ./src/lib/trigger-events.js ***!
  \***********************************/
/***/ ((module) => {

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


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!**********************************!*\
  !*** ./src/main/inject-value.js ***!
  \**********************************/
/* global chrome */
const executeRequest = __webpack_require__(/*! ../lib/inject-value-to-active-element */ "./src/lib/inject-value-to-active-element.js"),

	/**
 * Listener function for handling incoming requests.
 *
 * @param {Object} request - The request object containing the data.
 * @param {Object} [sender] - The sender of the request.
 * @param {Function} [sendResponse] - The function to send the response.
 * @returns {boolean} Indicates if the response will be sent asynchronously.
 */
	listener = function (request, sender, sendResponse) {
	// Log the received request
		console.log('Received request:', request);

		try {
		// Execute the request
			const result = executeRequest(request);
			// Send a response if needed
			if (sendResponse) {
				sendResponse({ result: result });
			}
		} catch (error) {
			console.error('Error executing request:', error);
			if (sendResponse) {
				sendResponse({ error: error.message });
			}
		}

		// Return true if the response will be sent asynchronously
		return true;
	};

// Log that the listener is being added
console.log('Adding listener');
chrome.runtime.onMessage.addListener(listener);

})();

/******/ })()
;
//# sourceMappingURL=inject-value.js.map