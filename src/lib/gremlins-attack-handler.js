module.exports = function (browserInterface, tabId) {
	if (!browserInterface) {
		throw new Error('browserInterface is required');
	}

	// If tabId is not provided, default to the active tab ID
	if (!tabId) {
		browserInterface.getActiveTabId()
			.then(activeTabId => {
				console.log('Active tab ID:', activeTabId);
				executeGremlinsAttack(browserInterface, activeTabId);
			})
			.catch(error => {
				console.error('Failed to get active tab ID:', error);
				throw error;
			});
	} else {
		executeGremlinsAttack(browserInterface, tabId);
	}
};

function executeGremlinsAttack(browserInterface, tabId) {
	console.log('Executing Gremlins attack handler');
	const script = `
        (function() {
            function loadGremlinsHandler() {
                console.log('Loading gremlins handler');
                var script = document.createElement("script");
                script.src = "gremlins-handler.js";  // Make sure to update this path
                script.addEventListener("load", function() {
                    console.log("Gremlins handler script loaded");
                });
                script.addEventListener("error", function() {
                    console.error("Failed to load the Gremlins handler script.");
                });
                document.body.appendChild(script);
            }

            if (document.readyState === "complete" || document.readyState === "interactive") {
                console.log('Document is ready, loading gremlins handler');
                loadGremlinsHandler();
            } else {
                console.log('Document is not ready, adding load event listener');
                window.addEventListener("load", loadGremlinsHandler);
            }
        })();
    `;

	browserInterface.executeScript(tabId, { code: script })
		.then(() => {
			console.log('Gremlins attack script executed successfully');
		})
		.catch(error => {
			console.error('Gremlins attack failed:', error);
			throw error;
		});
}
