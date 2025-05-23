/**
 * Generates the bookmarklet code string from the given arrays.
 * @param {string[]} species - Array of gremlin species
 * @param {string[]} mogwais - Array of mogwais
 * @param {string[]} strategies - Array of strategies
 * @returns {string} The generated bookmarklet code
 */
function generateBookmarklet(species, mogwais, strategies) {
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
}

/**
 * Sets the bookmarklet script based on checkbox selections.
 * Updates bookmarklet href and code display with generated script.
 */
export function setBookmarkletScript() {
	const clicker = document.getElementById('clicker').checked,
		toucher = document.getElementById('toucher').checked,
		formFiller = document.getElementById('formFiller').checked,
		scroller = document.getElementById('scroller').checked,
		typer = document.getElementById('typer').checked,

		alert = document.getElementById('alert').checked,
		fps = document.getElementById('fps').checked,
		gizmo = document.getElementById('gizmo').checked,

		distribution = document.getElementById('distribution').checked,
		allTogether = document.getElementById('allTogether').checked,
		bySpecies = document.getElementById('bySpecies').checked,

		species = [],
		mogwais = [],
		strategies = [];

	if (clicker) {
		species.push('gremlins.species.clicker()');
	}
	if (toucher) {
		species.push('gremlins.species.toucher()');
	}
	if (formFiller) {
		species.push('gremlins.species.formFiller()');
	}
	if (scroller) {
		species.push('gremlins.species.scroller()');
	}
	if (typer) {
		species.push('gremlins.species.typer()');
	}

	if (alert) {
		mogwais.push('gremlins.mogwais.alert()');
	}
	if (fps) {
		mogwais.push('gremlins.mogwais.fps()');
	}
	if (gizmo) {
		mogwais.push('gremlins.mogwais.gizmo()');
	}

	if (distribution) {
		strategies.push('gremlins.strategies.distribution()');
	}
	if (allTogether) {
		strategies.push('gremlins.strategies.allTogether()');
	}
	if (bySpecies) {
		strategies.push('gremlins.strategies.bySpecies()');
	}

	// Generate and update bookmarklet
	document.getElementById('bookmarklet').href = generateBookmarklet(species, mogwais, strategies);
	document.getElementById('code').textContent = generateBookmarklet(species, mogwais, strategies);
}

/**
 * Creates and displays a configuration modal dialog.
 * @returns {HTMLElement} The created modal element
 */
function createConfigModal() {
	const configModal = document.createElement('div');
	configModal.innerHTML = `
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

	document.body.appendChild(configModal);
	return configModal;
}

/**
 * Initializes the bookmarklet handler by setting up event listeners.
 */
export function initBookmarkletHandler() {
	document.addEventListener('DOMContentLoaded', () => {
		const gremlinsForm = document.getElementById('gremlins-form'),
			closeButton = document.getElementById('closeButton'),
			addConfigFileButton = document.getElementById('addConfigFileButton');

		if (gremlinsForm) {
			gremlinsForm.addEventListener('input', setBookmarkletScript);
		}

		if (closeButton) {
			closeButton.addEventListener('click', () => window.close());
		}

		if (addConfigFileButton) {
			addConfigFileButton.addEventListener('click', () => {
				const modal = createConfigModal(),
					saveButton = modal.querySelector('#saveConfig');

				if (saveButton) {
					saveButton.addEventListener('click', () => {
						const configName = document.getElementById('configName').value,
							configSource = document.getElementById('configSource').value;
						// TODO: Implement configuration saving logic
						console.log('Saving config:', { configName, configSource });
					});
				}
			});
		}
	});
}
