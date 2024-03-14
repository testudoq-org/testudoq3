const type_flag = '_type',
	generators = {
		literal: function (request) {
			console.log('Getting literal value from request:', request);
			const value = request.value;
			console.log('get-request-value: literal Value:', value);
			return value;
		},
		size: function (request) {
			console.log('Getting size value from request:', request);
			const size = parseInt(request.size, 10);
			console.log('get-request-value: size Size:', size);
			let value = request.template;
			console.log('get-request-value: size Template:', value);
			while (value.length < size) {
				console.log('get-request-value: size Value length:', value.length);
				console.log('get-request-value: size Template length:', request.template.length);
				value += request.template;
				console.log('get-request-value: size New Value length:', value.length);
			}
			const result = value.substring(0, request.size);
			console.log('get-request-value: size Result:', result);
			return result;
		}
	};
module.exports = function getRequestValue(request) {
	console.log('get-request-value: Start with request:', request);
	if (!request) {
		console.log('get-request-value: Request is falsy, returning false');
		return false;
	}
	const generator = generators[request[type_flag]];
	console.log('get-request-value: generator:', generator);
	if (!generator) {
		console.log('get-request-value: No generator found, returning false');
		return false;
	}
	console.log('get-request-value: Calling generator with request:', request);
	const result = generator(request);
	console.log('get-request-value: Result:', result);
	return result;
};
