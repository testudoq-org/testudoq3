// Constants
const typeFlag = '_type',
	generators = {
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
			if (!request || !request.size || !request.template) {
				throw new Error('Invalid request for size type: ' + JSON.stringify(request));
			}
			const size = parseInt(request.size, 10);
			if (isNaN(size) || size < 0) {
				throw new Error('Invalid size for size type: ' + request.size);
			}
			let value = request.template;
			try {
				// Repeat the template until it reaches the specified size
				while (value.length < size) {
					value += request.template;
				}
				// Trim the value to match the requested size
				const result = value.substring(0, size);
				console.log('get-request-value: size Result:', result);
				return result;
			} catch (error) {
				console.error('Error executing size request:', error);
				throw error;
			}
		}
	};


/**
 * Function to get the value from a request.
 * @param {Object} request - The request object containing the value information.
 * @returns {any} The value obtained from the request.
 */
module.exports = function getRequestValue(request) {
	try {
		console.log('get-request-value: Start with request:', request);
		// Check if the request is falsy
		if (!request) {
			console.log('get-request-value: Request is falsy, returning false');
			return false;
		}

		// Get the generator based on the request type and Call the generator function with the request and return the result
		const generator = generators[request[typeFlag]], result = generator(request), // Add a comma after 'generator(request)'
			logMessage = 'get-request-value: Result:';
		if (!generator) {
			throw new Error(`No generator found for request type: ${request[typeFlag]}`);
		}
		console.log('get-request-value: generator:', generator);
		console.log(logMessage, result);
		return result;
	} catch (error) {
		console.error('Error in get-request-value:', error);

		// Rethrow the error if it was not handled to prevent it from being swallowed
		throw error;
	}
};
