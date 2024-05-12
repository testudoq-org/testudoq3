const injectValueRequestHandler = require('./inject-value-request-handler'),
	pasteRequestHandler = require('./paste-request-handler'),
	copyRequestHandler = require('./copy-request-handler');

module.exports = function ContextMenu(standardConfig, browserInterface, menuBuilder, processMenuObject, pasteSupported) {
	const handlerType = 'injectValue',
		handlers = {
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
		return browserInterface.requestPermissions(['clipboardRead', 'clipboardWrite'])
			.then(() => handlerType = 'paste')
			.catch(() => {
				browserInterface.showMessage('Could not access clipboard');
			});
	}

	function turnOffPasting() {
		handlerType = 'injectValue';
		return browserInterface.removePermissions(['clipboardRead', 'clipboardWrite']);
	}

	function turnOnCopy() {
		handlerType = 'copy';
	}

	function loadAdditionalMenus(additionalMenus, rootMenu) {
		if (additionalMenus) {
			additionalMenus.forEach(configItem => processMenuObject({ [configItem.name]: configItem.config }, menuBuilder, rootMenu, onClick));
		}
	}

	function addGenericMenus(rootMenu) {
		console.log('addGenericMenus - start');
		menuBuilder.separator(rootMenu);
		console.log('add separator');
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
		console.log('addGenericMenus - end');
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
