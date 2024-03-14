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
