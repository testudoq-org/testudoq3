const injectValueRequestHandler = require('./inject-value-request-handler'),
	pasteRequestHandler = require('./paste-request-handler'),
	copyRequestHandler = require('./copy-request-handler');

module.exports = function ContextMenu(standardConfig, browserInterface, menuBuilder, processMenuObject, pasteSupported) {

	let handlerType = 'injectValue';
	const handlers = {
		injectValue: injectValueRequestHandler,
		paste: pasteRequestHandler,
		copy: copyRequestHandler
	},

		onClick = (info, tab) => {
			const tabId = tab.id,
				itemMenuValue = info.menuItemId,
				requestValue = { '_type': 'literal', 'value': itemMenuValue };

			if (!itemMenuValue) {
				return;
			}

			const handler = handlers[handlerType];
			if (handler) {
				return handler(browserInterface, tabId, requestValue);
			} else {
				throw new Error(`Invalid handler type: ${handlerType}`);
			}
		},

		loadMenus = (options) => {
			const rootMenu = menuBuilder.rootMenu('Bug Magnet'),
				{ additionalMenus, skipStandard } = options || {};
			if (!skipStandard) {
				processMenuObject(standardConfig, menuBuilder, rootMenu, onClick);
			}
			if (additionalMenus) {
				additionalMenus.forEach((config) => {
					processMenuObject(config, menuBuilder, rootMenu, onClick);
				});
			}
			addOperationalModes(rootMenu);
			addHelpMenu(rootMenu);
		},

		addOperationalModes = (rootMenu) => {
			if (pasteSupported) {
				const modeMenu = menuBuilder.subMenu('Operational mode', rootMenu);
				menuBuilder.choice('Inject value', modeMenu, () => handlerType = 'injectValue', true);
				menuBuilder.choice('Simulate pasting', modeMenu, requestPastePermission);
				menuBuilder.choice('Copy to clipboard', modeMenu, () => handlerType = 'copy');
			}
		},

		requestPastePermission = () => {
			handlerType = 'paste';
			return browserInterface.requestPermissions(['clipboardRead', 'clipboardWrite'])
				.catch(() => {
					browserInterface.showMessage('Could not access clipboard');
				});
		},

		addHelpMenu = (rootMenu) => {
			menuBuilder.menuItem('Help/Support', rootMenu, () => browserInterface.openUrl('https://bugmagnet.org/contributing.html'));
		},

		wireStorageListener = () => {
			browserInterface.addStorageListener(() => {
				menuBuilder.removeAll().then(browserInterface.getOptionsAsync).then(loadMenus);
			});
		},

		init = () => {
			chrome.contextMenus.onClicked.addListener(onClick);
			browserInterface.getOptionsAsync().then(loadMenus).then(wireStorageListener);
		};

	return { init };
};
