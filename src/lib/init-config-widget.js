/**
 * Initializes the configuration widget.
 * @param {HTMLElement} domElement - The DOM element representing the widget.
 * @param {Object} browserInterface - The browser interface object.
 * @returns {Promise} A promise that resolves when the initialization is complete.
 */
module.exports = function initConfigWidget(domElement, browserInterface) {


	// Variables
	let template,
		list,
		skipStandard,
		additionalMenus = [];

	// Function to display error messages
	const showErrorMsg = function (text) {
			const status = domElement.querySelector('[role=status]');
			status.textContent = text;
			setTimeout(function () {
				status.textContent = '';
			}, 1500);
		},

		// Function to add a link to a parent element
		addLink = function (parent, url) {
			const link = document.createElement('a');
			link.setAttribute('href', url);
			link.setAttribute('target', '_blank');
			link.textContent = url.replace(/.*\//g, '');
			parent.appendChild(link);
		},

		// Function to save options
		saveOptions = function () {
			browserInterface.saveOptions({
				additionalMenus: additionalMenus,
				skipStandard: skipStandard
			});
		},

		// Function to rebuild the menu
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
				domElement.querySelector('[role=no-custom]').style.display = 'none';
				domElement.querySelector('[role=yes-custom]').style.display = '';
			} else {
				domElement.querySelector('[role=yes-custom]').style.display = 'none';
				domElement.querySelector('[role=no-custom]').style.display = '';
			}
			domElement.querySelector('[role=option-skipStandard]').checked = (!!skipStandard);
		},

		// Function to show the main screen
		showMainScreen = function () {
			domElement.querySelector('[role=main-screen]').style.display = '';
			domElement.querySelector('[role=file-loader]').style.display = 'none';
		},

		// Function to add a submenu
		addSubMenu = function (textContent, props) {
			const parsed = JSON.parse(textContent);
			additionalMenus.push(Object.assign({}, props, { config: parsed }));
			showMainScreen();
			rebuildMenu();
			saveOptions();
		},

		// Function to restore options
		restoreOptions = function () {
			return browserInterface.getOptionsAsync().then(function (opts) {
				additionalMenus = opts && Array.isArray(opts.additionalMenus) ? opts.additionalMenus : [];
				skipStandard = opts && opts.skipStandard;
				rebuildMenu();
			});
		},

		// Function to show the file selector
		showFileSelector = function () {
			const submenuField = domElement.querySelector('[role=submenu-name]'),
				configTextArea = domElement.querySelector('[role=custom-config-text]');
			submenuField.value = '';
			configTextArea.value = '';
			domElement.querySelector('[role=main-screen]').style.display = 'none';
			domElement.querySelector('[role=file-loader]').style.display = '';
		},

		// Function to initialize the screen
		initScreen = function () {
			const submenuField = domElement.querySelector('[role=submenu-name]'),
				skipStandardCheckbox = domElement.querySelector('[role=option-skipStandard]');

			// Prevent form submission
			Array.from(domElement.querySelectorAll('form')).map(el => el.addEventListener('submit', e => e.preventDefault()));

			// Event listeners
			domElement.querySelector('[role=close]').addEventListener('click', browserInterface.closeWindow);
			domElement.querySelector('[role=add]').addEventListener('click', showFileSelector);
			Array.from(domElement.querySelectorAll('[role=back]')).map(el => el.addEventListener('click', showMainScreen));
			domElement.querySelector('[role=select-file-cover]').addEventListener('click', () => {
				const event = new MouseEvent('click', {
					view: window,
					bubbles: true,
					cancelable: true
				});
				domElement.querySelector('[role=file-selector]').dispatchEvent(event);
			});
			skipStandardCheckbox.addEventListener('change', function () {
				skipStandard = !!skipStandardCheckbox.checked;
				saveOptions();
			});
			domElement.querySelector('[role=file-selector]').addEventListener('change', function () {
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
			domElement.querySelector('[role=add-custom-config]').addEventListener('click', () => {
				const submenuName = submenuField.value && submenuField.value.trim(),
					customConfigText = domElement.querySelector('[role=custom-config-text]').value;
				if (!submenuName) {
					submenuField.value = '';
					return showErrorMsg('Please provide submenu name!');
				}
				if (!customConfigText) {
					return showErrorMsg('Please provide the configuration');
				}
				try {
					addSubMenu(customConfigText, { name: submenuName });
				} catch (e) {
					showErrorMsg(e);
				}
			});
			domElement.querySelector('[role=add-remote-config]').addEventListener('click', () => {
				const submenuName = submenuField.value && submenuField.value.trim(),
					urlField = domElement.querySelector('[role="remote-config-url"]'),
					url = urlField.value;
				if (!submenuName) {
					showErrorMsg('Please provide submenu name!');
					submenuField.value = '';
				} else if (!url) {
					return showErrorMsg('Please provide the url');
				} else {
					browserInterface.getRemoteFile(url).then(result => {
						addSubMenu(result, { name: submenuName, source: url, remote: true });
						submenuField.value = '';
						urlField.value = '';
					}).catch(showErrorMsg);
				}
			});

			// Remove the template from the DOM
			template = domElement.querySelector('[role=template]');
			list = template.parentElement;
			list.removeChild(template);

			// Show the main screen and restore options
			showMainScreen();
			return restoreOptions();
		};

	// Call the initialization function and return its result
	return initScreen();
};
