/**
 * Initializes the configuration widget.
 * @param {HTMLElement} domElement - The DOM element representing the widget.
 * @param {Object} browserInterface - The browser interface object.
 * @returns {Promise} A promise that resolves when the initialization is complete.
 */
export default function initConfigWidget(widgetElement, browserInterface) { // Renamed domElement to widgetElement
	// Variables
	let template,
		list,
		skipStandard,
		additionalMenus = [];

	// Function definitions
	const showErrorMsg = function (text) {
			const status = widgetElement.querySelector('[role=status]'); // Use widgetElement
			status.textContent = text;
			setTimeout(function () {
				status.textContent = '';
			}, 1500);
		},
		addLink = function (parent, url) {
			const link = document.createElement('a');
			link.setAttribute('href', url);
			link.setAttribute('target', '_blank');
			link.textContent = url.replace(/.*\//g, '');
			parent.appendChild(link);
		},
		saveOptions = function () {
			browserInterface.saveOptions({
				additionalMenus: additionalMenus,
				skipStandard: skipStandard
			});
		},
		rebuildMenu = function () {
			// Clear the menu list
			list.innerHTML = '';

			// Check if additional menus exist
			if (additionalMenus && additionalMenus.length) {
				additionalMenus.forEach(function (configItem, index) {
					// Clone the template for each menu item
					const clone = template.cloneNode(true);
					list.appendChild(clone);
					clone.querySelector('[role=name]').textContent = configItem.name;

					// Add link or text for source based on remote status
					if (configItem.remote) {
						addLink(clone.querySelector('[role=source]'), configItem.source);
					} else {
						clone.querySelector('[role=source]').textContent = configItem.source || '';
					}

					// Add event listener to remove the menu item
					clone.querySelector('[role=remove]').addEventListener('click', function () {
						additionalMenus.splice(index, 1);
						rebuildMenu();
						saveOptions();
					});
				});
				widgetElement.querySelector('[role=no-custom]').style.display = 'none'; // Use widgetElement
				widgetElement.querySelector('[role=yes-custom]').style.display = ''; // Use widgetElement
			} else {
				widgetElement.querySelector('[role=yes-custom]').style.display = 'none'; // Use widgetElement
				widgetElement.querySelector('[role=no-custom]').style.display = ''; // Use widgetElement
			}
			widgetElement.querySelector('[role=option-skipStandard]').checked = (!!skipStandard); // Use widgetElement
		},
		showMainScreen = function () {
			widgetElement.querySelector('[role=main-screen]').style.display = ''; // Use widgetElement
			widgetElement.querySelector('[role=file-loader]').style.display = 'none'; // Use widgetElement
		},
		addSubMenu = function (textContent, props) {
			const parsed = JSON.parse(textContent);
			additionalMenus.push(Object.assign({}, props, { config: parsed }));
			showMainScreen();
			rebuildMenu();
			saveOptions();
		},
		restoreOptions = function () {
			return browserInterface.getOptionsAsync().then(function (opts) {
				additionalMenus = opts && Array.isArray(opts.additionalMenus) ? opts.additionalMenus : [];
				skipStandard = opts && opts.skipStandard;
				rebuildMenu();
			});
		},
		showFileSelector = function () {
			const submenuField = widgetElement.querySelector('[role=submenu-name]'), // Use widgetElement
				configTextArea = widgetElement.querySelector('[role=custom-config-text]'); // Use widgetElement
			submenuField.value = '';
			configTextArea.value = '';
			widgetElement.querySelector('[role=main-screen]').style.display = 'none'; // Use widgetElement
			widgetElement.querySelector('[role=file-loader]').style.display = ''; // Use widgetElement
		},
		// Pass widgetElement to initScreen
		initScreen = function (currentDomElement) {
			const submenuField = currentDomElement.querySelector('[role=submenu-name]'),
				skipStandardCheckbox = currentDomElement.querySelector('[role=option-skipStandard]');

			// Prevent form submission
			Array.from(currentDomElement.querySelectorAll('form')).map(el => el.addEventListener('submit', e => e.preventDefault()));

			// Event listeners
			currentDomElement.querySelector('[role=close]').addEventListener('click', browserInterface.closeWindow);
			currentDomElement.querySelector('[role=add]').addEventListener('click', showFileSelector);
			Array.from(currentDomElement.querySelectorAll('[role=back]')).map(el => el.addEventListener('click', showMainScreen));
			currentDomElement.querySelector('[role=select-file-cover]').addEventListener('click', () => {
				const event = new MouseEvent('click', {
					view: window,
					bubbles: true,
					cancelable: true
				});
				currentDomElement.querySelector('[role=file-selector]').dispatchEvent(event);
			});
			skipStandardCheckbox.addEventListener('change', function () {
				skipStandard = !!skipStandardCheckbox.checked;
				saveOptions();
			});
			currentDomElement.querySelector('[role=file-selector]').addEventListener('change', function () {
				const element = this,
					fileInfo = this.files[0],
					fileName = fileInfo.name,
					submenuName = submenuField.value && submenuField.value.trim();
				if (!submenuName) {
					showErrorMsg('Please provide submenu name!');
					submenuField.value = '';
				} else {
					browserInterface.readFile(fileInfo).then(result => {
						addSubMenu(result, { name: submenuName, source: fileName });
					}).catch(showErrorMsg);
				}
				element.value = '';
			});
			currentDomElement.querySelector('[role=add-custom-config]').addEventListener('click', () => {
				const submenuName = submenuField.value && submenuField.value.trim(),
					customConfigText = currentDomElement.querySelector('[role=custom-config-text]').value;
				if (!submenuName) {
					submenuField.value = '';
					showErrorMsg('Please provide submenu name!');
					return;
				}
				if (!customConfigText) {
					showErrorMsg('Please provide the configuration');
					return;
				}
				try {
					addSubMenu(customConfigText, { name: submenuName });
				} catch (e) {
					showErrorMsg(e);
				}
			});
			currentDomElement.querySelector('[role=add-remote-config]').addEventListener('click', () => {
				const submenuName = submenuField.value && submenuField.value.trim(),
					urlField = currentDomElement.querySelector('[role="remote-config-url"]'),
					url = urlField.value;
				if (!submenuName) {
					showErrorMsg('Please provide submenu name!');
					submenuField.value = '';
					return;
				}
				if (!url) {
					showErrorMsg('Please provide the url');
					return;
				}
				// If both submenuName and url are provided, proceed
				browserInterface.getRemoteFile(url).then(result => {
					addSubMenu(result, { name: submenuName, source: url, remote: true });
					submenuField.value = '';
					urlField.value = '';
				}).catch(showErrorMsg);
			});

			// Remove the template from the DOM if it exists
			template = currentDomElement.querySelector('[role=template]');
			if (template && template.parentElement) {
				list = template.parentElement;
				list.removeChild(template);
			}

			// Show the main screen and restore options
			showMainScreen();
			return restoreOptions();
		};

	// Call the initialization function and return its result
	return initScreen(widgetElement); // Pass widgetElement to initScreen
}
