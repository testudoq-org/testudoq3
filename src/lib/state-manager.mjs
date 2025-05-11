const initialState = {
		attacking: false,
		duration: 15,
		startTime: null,
		configuration: null,
		error: null,
		metrics: {
			injectionStartTime: null,
			injectionEndTime: null,
			startupTime: null,
			errors: [],
			warnings: []
		}
	},
	subscribers = new Set(),
	state = Object.assign({}, initialState);

function notifySubscribers() {
	subscribers.forEach(callback => {
		try {
			callback(state);
		} catch (error) {
			console.error('Error in state subscriber:', error);
		}
	});
}

async function updateState(newState) {
	Object.assign(state, newState);
	notifySubscribers();
	return state;
}

function subscribe(callback) {
	subscribers.add(callback);
	callback(state);
	return () => subscribers.delete(callback);
}

function getState() {
	return Object.assign({}, state);
}

function resetState() {
	Object.assign(state, initialState);
	notifySubscribers();
}

function addMetric(type, data) {
	const metric = Object.assign({}, data, {
		timestamp: Date.now()
	});

	if (type === 'error') {
		state.metrics.errors.push(metric);
	} else if (type === 'warning') {
		state.metrics.warnings.push(metric);
	}
	notifySubscribers();
}

function updateMetrics(metrics) {
	Object.assign(state.metrics, metrics);
	notifySubscribers();
}

export {
	updateState,
	subscribe,
	getState,
	resetState,
	addMetric,
	updateMetrics
};
