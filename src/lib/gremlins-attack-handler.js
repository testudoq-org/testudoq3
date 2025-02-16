async function executeGremlinsAttack(browserInterface, tabId, options = {}) {
	console.log('Executing Gremlins attack handler with options:', options);

	const message = {
		command: 'startGremlins',
		duration: options.duration || 15
	};

	return browserInterface.sendMessage(tabId, message)
		.then(response => {
			if (response && response.status === 'started') {
				console.log('Gremlins attack started successfully');
			} else {
				throw new Error('Failed to start gremlins attack: ' + (response ? response.error : 'Unknown error'));
			}
		})
		.catch(error => {
			console.error('Failed to execute gremlins attack:', error);
			throw error;
		});
}

// Helper function to stop gremlins attack
function stopGremlinsAttack(browserInterface, tabId) {
	if (!browserInterface || !tabId) {
		throw new Error('browserInterface and tabId are required');
	}

	return browserInterface.sendMessage(tabId, { command: 'stopGremlins' })
		.then(response => {
			if (response && response.status === 'stopped') {
				console.log('Stop gremlins command sent successfully');
			} else {
				throw new Error('Failed to stop gremlins: ' + (response ? response.error : 'Unknown error'));
			}
		})
		.catch(error => {
			console.error('Failed to stop gremlins:', error);
			throw error;
		});
}

module.exports = {
	start: function (browserInterface, tabId, options = {}) {
		if (!browserInterface) {
			throw new Error('browserInterface is required');
		}

		// If tabId is not provided, default to the active tab ID
		if (!tabId) {
			return browserInterface.getActiveTabId()
				.then(activeTabId => {
					console.log('Active tab ID:', activeTabId);
					return executeGremlinsAttack(browserInterface, activeTabId, options);
				})
				.catch(error => {
					console.error('Failed to get active tab ID:', error);
					throw error;
				});
		} else {
			return executeGremlinsAttack(browserInterface, tabId, options);
		}
	},
	stop: stopGremlinsAttack
};
