console.log('options.mjs loaded');
/* global chrome */

const optionsHandler = {
	utils: {
		addLink(element, url) {
			const link = document.createElement('a');
			link.href = url;
			link.textContent = url;
			link.target = '_blank';
			element.appendChild(link);
		},

		async saveOptions(additionalMenus) {
			await chrome.storage.sync.set({ additionalMenus });
			console.log('Options saved');
		},

		rebuildMenu(additionalMenus = []) {
			console.log('Rebuilding menu...');
			const list = document.getElementById('configOptions'),
				template = document.getElementById('menuTemplate'),
				noCustomDiv = document.getElementById('noCustomDiv'),
				yesCustomDiv = document.getElementById('yesCustomDiv');

			if (!list || !template || !noCustomDiv || !yesCustomDiv) {
				console.error('Required elements not found');
				return;
			}

			list.innerHTML = '';

			if (additionalMenus.length) {
				additionalMenus.forEach((configItem, index) => {
					const clone = template.cloneNode(true);
					list.appendChild(clone);

					clone.querySelector('[role=name]').textContent = configItem.name;

					if (configItem.remote) {
						this.addLink(clone.querySelector('[role=source]'), configItem.source);
					} else {
						clone.querySelector('[role=source]').textContent = configItem.source || '';
					}

					clone.querySelector('[role=remove]').addEventListener('click', () => {
						additionalMenus.splice(index, 1);
						this.rebuildMenu(additionalMenus);
						this.saveOptions(additionalMenus);
					});
				});

				noCustomDiv.style.display = 'none';
				yesCustomDiv.style.display = 'block';
			} else {
				yesCustomDiv.style.display = 'none';
				noCustomDiv.style.display = 'block';
			}
		}
	},

	init() {
		document.addEventListener('DOMContentLoaded', () => {
			const mainElement = document.getElementById('main');
			if (!mainElement) {
				console.error('Main element not found');
				return;
			}

			// Load saved options
			chrome.storage.sync.get('additionalMenus', (result) => {
				const additionalMenus = result.additionalMenus || [];
				this.utils.rebuildMenu(additionalMenus);
			});

			// Setup event listeners
			document.getElementById('addConfigFileButton')?.addEventListener('click', () => {
				const configOptions = document.getElementById('configOptions');
				if (configOptions) {
					configOptions.style.display = configOptions.style.display === 'none' ? 'block' : 'none';
				}
			});

			document.getElementById('closeButton')?.addEventListener('click', () => {
				const configOptions = document.getElementById('configOptions');
				if (configOptions) {
					configOptions.style.display = 'none';
				}
			});

			document.getElementById('closeExtension')?.addEventListener('click', () => {
				window.close();
			});
		});
	}
};

// Initialize options handler
optionsHandler.init();
