console.log('options-gremlins-bookmarklet-handler.mjs loaded');
/* global chrome */

const gremlinsBookmarkletHandler = {
	generateBookmarklet(species, mogwais, strategies) {
		return `javascript:(function() {
			function callback() {
				gremlins.createHorde({
					species: [${species.join(',')}],
					mogwais: [${mogwais.join(',')}],
					strategies: [${strategies.join(',')}]
				}).unleash();
			}
			var s = document.createElement("script");
			s.src = "https://unpkg.com/gremlins.js";
			if (s.addEventListener) { s.addEventListener("load", callback, false); }
			else if (s.readyState) { s.onreadystatechange = callback; }
			document.body.appendChild(s);
		})()`;
	},

	setBookmarkletScript() {
		const inputs = {
				species: ['clicker', 'toucher', 'formFiller', 'scroller', 'typer'],
				mogwais: ['alert', 'fps', 'gizmo'],
				strategies: ['distribution', 'allTogether', 'bySpecies']
			},
			selections = {
				species: inputs.species
					.filter(id => document.getElementById(id)?.checked)
					.map(type => `gremlins.species.${type}()`),
				mogwais: inputs.mogwais
					.filter(id => document.getElementById(id)?.checked)
					.map(type => `gremlins.mogwais.${type}()`),
				strategy: inputs.strategies
					.find(id => document.getElementById(id)?.checked)
			},
			strategies = selections.strategy ?
				[`gremlins.strategies.${selections.strategy}()`] :
				['gremlins.strategies.distribution()'],
			generatedCode = this.generateBookmarklet(
				selections.species,
				selections.mogwais,
				strategies
			),
			elements = {
				bookmarklet: document.getElementById('bookmarklet'),
				code: document.getElementById('code')
			};

		if (elements.bookmarklet) {
			elements.bookmarklet.href = generatedCode;
		}
		if (elements.code) {
			elements.code.textContent = generatedCode;
		}
	},

	createConfigModal() {
		const modal = document.createElement('div');
		modal.innerHTML = `
			<h2>Add Configuration File</h2>
			<label for="configName">Configuration Name:</label>
			<input type="text" id="configName" required><br>
			<label for="configSource">Configuration Source:</label>
			<select id="configSource">
				<option value="local">Local File</option>
				<option value="remote">Remote URL</option>
				<option value="source">Paste Configuration</option>
			</select><br>
			<button id="saveConfig">Save</button>
		`;

		document.body.appendChild(modal);
		return modal;
	},

	init() {
		document.addEventListener('DOMContentLoaded', () => {
			const elements = {
				form: document.getElementById('gremlins-form'),
				closeButton: document.getElementById('closeButton'),
				addConfigButton: document.getElementById('addConfigFileButton')
			};

			if (elements.form) {
				elements.form.addEventListener('input', () => this.setBookmarkletScript());
			}

			if (elements.closeButton) {
				elements.closeButton.addEventListener('click', () => window.close());
			}

			if (elements.addConfigButton) {
				elements.addConfigButton.addEventListener('click', () => {
					const modal = this.createConfigModal(),
						saveButton = modal.querySelector('#saveConfig');

					if (saveButton) {
						saveButton.addEventListener('click', () => {
							const config = {
								name: document.getElementById('configName')?.value,
								source: document.getElementById('configSource')?.value
							};
							chrome.runtime.sendMessage({
								command: 'saveConfig',
								config
							});
						});
					}
				});
			}

			// Initial setup
			this.setBookmarkletScript();
		});
	}
};

// Initialize handler
gremlinsBookmarkletHandler.init();
