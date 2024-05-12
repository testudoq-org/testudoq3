const injectValueRequestHandler = require('./inject-value-request-handler');
const pasteRequestHandler = require('./paste-request-handler');
const copyRequestHandler = require('./copy-request-handler');

module.exports = function ContextMenu(standardConfig, browserInterface, menuBuilder, processMenuObject, pasteSupported) {
	let handlerType = 'injectValue';
	const handlers = {
		injectValue: injectValueRequestHandler,
		paste: pasteRequestHandler,
		copy: copyRequestHandler
	};

	function onClick(tabId, itemMenuValue) {
		if (!itemMenuValue) {
			return;
		}
		const requestValue = typeof itemMenuValue === 'string' ? { '_type': 'literal', 'value': itemMenuValue } : itemMenuValue;
		return handlers[handlerType](browserInterface, tabId, requestValue);
	}

	function turnOnPasting() {
		if (!browserInterface) {
			throw new TypeError('browserInterface cannot be null or undefined');
		}
		return browserInterface.requestPermissions(['clipboardRead', 'clipboardWrite'])
			.then(() => {
				if (handlerType !== 'paste') {
					handlerType = 'paste'; // Modify handlerType here
				}
			})
			.catch((err) => {
				browserInterface.showMessage('Could not access clipboard');
				if (err && (err.message || err.stack)) {
					throw err;
				}
			});
	}

	function turnOffPasting() {
		if (!browserInterface) {
			throw new TypeError('browserInterface cannot be null or undefined');
		}
		try {
			browserInterface.removePermissions(['clipboardRead', 'clipboardWrite']);
			handlerType = 'injectValue';
		} catch (err) {
			// Re-throw the error so that it can be handled externally if desired
			if (err && (err.message || err.stack)) {
				throw err;
			} else {
				throw new TypeError('Error occurred while removing permissions: ' + err);
			}
		}
	}

	function turnOnCopy() {
		handlerType = 'copy';
	}

	function loadAdditionalMenus(additionalMenus, rootMenu) {
		if (!rootMenu || !additionalMenus) {
			return;
		}
		additionalMenus.forEach(configItem => processMenuObject({ [configItem.name]: configItem.config }, menuBuilder, rootMenu, onClick));
	}

	function addGenericMenus(rootMenu) {
		if (!rootMenu) {
			return;
		}
		menuBuilder.separator(rootMenu);
		const handlerChoices = {};
		if (pasteSupported !== undefined) {
			pasteSupported = pasteSupported || true;
		}
		if (pasteSupported) {
			const modeMenu = menuBuilder.subMenu('Operational mode', rootMenu);
			handlerChoices.injectValue = menuBuilder.choice('Inject value', modeMenu, turnOffPasting, true, handlerType);
			handlerChoices.paste = menuBuilder.choice('Simulate pasting', modeMenu, turnOnPasting, false, handlerType);
			handlerChoices.copy = menuBuilder.choice('Copy to clipboard', modeMenu, turnOnCopy, false, handlerType);
		}
		menuBuilder.menuItem('Customize menus', rootMenu, browserInterface.openSettings);
		menuBuilder.menuItem('Help/Support', rootMenu, () => {
			if (!browserInterface) {
				throw new TypeError('browserInterface cannot be null or undefined');
			}
			browserInterface.openUrl('https://xanpho.x10.bz/testudoq-help.html');
		});
	}

	function rebuildMenu(options) {
		const rootMenu = menuBuilder.rootMenu('Testudoq');
		if (!options || !options.skipStandard) {
			processMenuObject(standardConfig, menuBuilder, rootMenu, onClick);
		}
		loadAdditionalMenus(options && options.additionalMenus, rootMenu);
		addGenericMenus(rootMenu);
	}

	function wireStorageListener() {
		browserInterface.addStorageListener(() => menuBuilder.removeAll().then(browserInterface.getOptionsAsync).then(rebuildMenu));
	}

	this.init = function () {
		return browserInterface.getOptionsAsync().then(rebuildMenu).then(wireStorageListener);
	};

};
