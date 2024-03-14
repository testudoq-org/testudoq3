//get-request-value.js
const type_flag = '_type',
	generators = {
		literal: function (request) {
			console.log('Literal generator called with request:', request);
			return request.value;
		},
		size: function (request) {
			console.log('Size generator called with request:', request);
			const size = parseInt(request.size, 10);
			if (isNaN(size)) {
				console.error('Error: Size is not a number:', request.size);
				return false;
			}
			let value = request.template;
			while (value.length < size) {
				value += request.template;
			}
			return value.substring(0, size);
		}
	};

module.exports = function getRequestValue(request) {
	console.log('getRequestValue called with request:', request);
	if (!request) {
		console.log('Request is falsy, returning false');
		return false;
	}
	if (!request.hasOwnProperty(type_flag)) {
		console.error('Error: Request does not have type_flag property:', type_flag);
		return false;
	}
	const generator = generators[request[type_flag]];
	if (!generator) {
		console.log('Generator for request type is falsy, returning false');
		return false;
	}
	try {
		const value = generator(request);
		console.log('Generated value:', value);
		return value;
	} catch (error) {
		console.error('Error caught in getRequestValue:', error);
		return false;
	}
};
