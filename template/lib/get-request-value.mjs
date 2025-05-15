/**
 * @module get-request-value
 * Request value generation module
 * ES Module for Chrome Extension V3
 */

/**
 * @typedef {Object} ValueRequest
 * @property {string} _type - The type of value to generate ('literal' or 'size')
 * @property {string} [value] - The literal value for literal type requests
 * @property {number} [size] - The size for size type requests
 * @property {string} [template] - The template for size type requests
 */

/**
 * Constants for request handling
 * @type {Object}
 */
const [
	request_constants,
	generators
] = [
	{
		type_flag: '_type',
		request_types: {
			literal: 'literal',
			size: 'size'
		}
	},
	{
		/**
		 * Generator for literal type requests
		 * @param {ValueRequest} request - The request object
		 * @returns {string} The literal value
		 */
		literal(request) {
			console.log('Getting literal value from request:', request);
			const value = request && request.value;
			console.log('get-request-value: literal Value:', value);
			return value;
		},

		/**
		 * Generator for size type requests
		 * @param {ValueRequest} request - The request object
		 * @returns {string} The generated value of specified size
		 */
		size(request) {
			console.log('Getting size value from request:', request);
			if (!request) {
				return false;
			}

			const [
				size,
				template,
				currentValue
			] = [
				parseInt(request.size, 10),
				request.template || '',
				request.template || ''
			];

			if (isNaN(size) || size < 0) {
				console.log('get-request-value: Invalid size value');
				return false;
			}

			console.log('get-request-value: size Size:', size);
			if (!template) {
				console.log('get-request-value: No template provided');
				return false;
			}

			console.log('get-request-value: size Template:', template);

			// Repeat the template until it reaches the specified size
			let result = currentValue;
			while (result.length < size) {
				console.log('get-request-value: size Value length:', result.length);
				console.log('get-request-value: size Template length:', template.length);
				result += template;
				console.log('get-request-value: size New Value length:', result.length);
			}

			// Trim the value to match the requested size
			result = result.substring(0, size);
			console.log('get-request-value: size Result:', result);
			return result;
		}
	}
];

/**
 * Gets the value from a request object based on its type
 * @param {ValueRequest} request - The request object containing the value information
 * @returns {string|boolean} The generated value or false if invalid request
 */
export default function getRequestValue(request) {
	console.log('get-request-value: Start with request:', request);
	if (!request) {
		console.log('get-request-value: Request is falsy, returning false');
		return false;
	}

	const generator = generators[request[request_constants.type_flag]];
	console.log('get-request-value: generator:', generator);

	if (!generator) {
		console.log('get-request-value: No generator found, returning false');
		return false;
	}

	console.log('get-request-value: Calling generator with request:', request);
	return generator(request);
}
