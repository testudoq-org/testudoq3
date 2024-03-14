module.exports = function injectValueRequestHandler(browserInterface, tabId, requestValue) {
	console.log('injectValueRequestHandler: start');
	console.log('injectValueRequestHandler: browserInterface:', browserInterface);
	console.log('injectValueRequestHandler: tabId:', tabId);
	console.log('injectValueRequestHandler: requestValue:', requestValue);
  
	return browserInterface.executeScript(tabId, '/inject-value.js')
	  .then(() => {
		console.log('injectValueRequestHandler: executeScript completed');
		return browserInterface.sendMessage(tabId, requestValue);
	  })
	  .then(() => {
		console.log('injectValueRequestHandler: sendMessage completed');
	  });
  };
  