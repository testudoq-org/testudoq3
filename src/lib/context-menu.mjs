import injectValueRequestHandler from './inject-value-request-handler.mjs';
import pasteRequestHandler from './paste-request-handler.mjs';
import copyRequestHandler from './copy-request-handler.mjs';
import gremlinsAttackHandler from './gremlins-attack-handler.mjs';

/**
 * Creates a context menu manager.
 * @param {Object} standardConfig - The standard menu configuration
 * @param {Object} browserInterface - The browser interface for menu operations
 * @param {Object} menuBuilder - The menu builder instance
 * @param {Function} processMenuObject - Function to process menu objects
 * @param {boolean} pasteSupported - Whether paste operations are supported
 */
export default function ContextMenu(standardConfig, browserInterface, menuBuilder, processMenuObject, pasteSupported) {
	let handlerType = 'injectValue',
		isRebuilding = false;

	const handlers = {
		injectValue: injectValueRequestHandler,
		paste: pasteRequestHandler,
		copy: copyRequestHandler,
		gremlinsAttack: gremlinsAttackHandler
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
		const handlerChoices = {},
			modeMenu = menuBuilder.subMenu('Operational mode', rootMenu);

		menuBuilder.separator(rootMenu);

		if (pasteSupported !== undefined) {
			pasteSupported = pasteSupported || true;
		}

		if (pasteSupported) {
			handlerChoices.injectValue = menuBuilder.choice('Inject value', modeMenu, turnOffPasting, true, handlerType);
			handlerChoices.paste = menuBuilder.choice('Simulate pasting', modeMenu, turnOnPasting, false, handlerType);
			handlerChoices.copy = menuBuilder.choice('Copy to clipboard', modeMenu, turnOnCopy, false, handlerType);
		}

		menuBuilder.menuItem('Customise menus', rootMenu, browserInterface.openSettings);

		menuBuilder.menuItem('Help/Support', rootMenu, () => {
			if (!browserInterface) {
				throw new TypeError('browserInterface cannot be null or undefined');
			}
			browserInterface.openUrl('https://testudo.co.nz/futterman/testudoq-help.html');
		});
	}

	async function rebuildMenu(options) {
		if (isRebuilding) {
			return;
		}

		isRebuilding = true;
		try {
			await menuBuilder.removeAll();
			const rootMenu = menuBuilder.rootMenu('Testudoq');
			if (!options || !options.skipStandard) {
				processMenuObject(standardConfig, menuBuilder, rootMenu, onClick);
			}
			loadAdditionalMenus(options && options.additionalMenus, rootMenu);
			addGenericMenus(rootMenu);
		} finally {
			isRebuilding = false;
		}
	}

	function wireStorageListener() {
		browserInterface.addStorageListener(async () => {
			const options = await browserInterface.getOptionsAsync();
			await rebuildMenu(options);
		});
	}

	this.init = async function () {
		const options = await browserInterface.getOptionsAsync();
		await rebuildMenu(options);
		wireStorageListener();
	};
}
