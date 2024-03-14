const injectValueRequestHandler = require('./inject-value-request-handler'),
	pasteRequestHandler = require('./paste-request-handler'),
	copyRequestHandler = require('./copy-request-handler');
module.exports = function ContextMenu(standardConfig, browserInterface, menuBuilder, processMenuObject, pasteSupported) {
	const handlerType = 'injectValue',
		handlerMenus = {
			injectValue: 'injectValue',
			paste: 'paste',
			copy: 'copy'
		},
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
			.then(() => handlerType = handlerMenus.paste)
			.catch(browserInterface.showMessage.bind(null, 'Could not access clipboard'));
	}

	function turnOffPasting() {
		handlerType = handlerMenus.injectValue;
		return browserInterface.removePermissions(['clipboardRead', 'clipboardWrite']);
	}

	function turnOnCopy() {
		handlerType = handlerMenus.copy;
	}

	function loadAdditionalMenus(additionalMenus, rootMenu) {
		if (additionalMenus) {
			additionalMenus.forEach(configItem => processMenuObject({ [configItem.name]: configItem.config }, menuBuilder, rootMenu, onClick));
		}
	}

	function addGenericMenus(rootMenu) {
		if (pasteSupported) {
			const modeMenu = menuBuilder.subMenu('Operational mode', rootMenu);
			menuBuilder.choice('Inject value', modeMenu, turnOffPasting, true, handlerMenus.injectValue);
			menuBuilder.choice('Simulate pasting', modeMenu, turnOnPasting, false, handlerMenus.paste);
			menuBuilder.choice('Copy to clipboard', modeMenu, turnOnCopy, false, handlerMenus.copy);
		}
		menuBuilder.menuItem('Customise menus', rootMenu, browserInterface.openSettings);
		menuBuilder.menuItem('Help/Support', rootMenu, () => browserInterface.openUrl('https://xanpho.x10.bz/simple-input.html'));
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
