/* global chrome */

console.log('Popup initialized.');

document.addEventListener('DOMContentLoaded', function () {
	const tooltips = document.querySelectorAll('.tooltip'),
		form = document.getElementById('gremlin-form'),
		errorMessage = document.getElementById('errorMessage');

	for (let i = 0; i < tooltips.length; i++) {
		const tooltip = tooltips[i];
		tooltip.setAttribute('role', 'tooltip');
		tooltip.setAttribute('aria-label', tooltip.getAttribute('data-tooltip'));
	}

	// Initialize configuration panel
	if (form) {
		// Save configuration when changed
		form.addEventListener('change', function () {
			const speciesInputs = form.querySelectorAll('input[name="species"]:checked'),
				mogwaisInputs = form.querySelectorAll('input[name="mogwais"]:checked'),
				strategyInput = form.querySelector('input[name="strategy"]:checked'),
				species = [],
				mogwais = [],
				config = {
					species: species,
					mogwais: mogwais,
					strategy: strategyInput ? strategyInput.id : 'distribution'
				};

			for (let j = 0; j < speciesInputs.length; j++) {
				species.push(speciesInputs[j].id);
			}

			for (let k = 0; k < mogwaisInputs.length; k++) {
				mogwais.push(mogwaisInputs[k].id);
			}

			chrome.storage.local.set({ gremlinConfig: config });
			console.log('Saved configuration:', config);
		});

		// Load saved configuration
		chrome.storage.local.get(['gremlinConfig'], function (result) {
			if (result.gremlinConfig) {
				const config = result.gremlinConfig,
					species = config.species || [],
					mogwais = config.mogwais || [],
					strategy = config.strategy || 'distribution',
					strategyInput = form.querySelector('input#' + strategy + '[name="strategy"]');

				// Set species checkboxes
				for (let m = 0; m < species.length; m++) {
					const speciesCheckbox = form.querySelector('input#' + species[m] + '[name="species"]');
					if (speciesCheckbox) {
						speciesCheckbox.checked = true;
					}
				}

				// Set mogwais checkboxes
				for (let n = 0; n < mogwais.length; n++) {
					const mogwaisCheckbox = form.querySelector('input#' + mogwais[n] + '[name="mogwais"]');
					if (mogwaisCheckbox) {
						mogwaisCheckbox.checked = true;
					}
				}

				// Set strategy radio
				if (strategyInput) {
					strategyInput.checked = true;
				}
			}
		});
	}

	// Initialize error message handling
	if (errorMessage) {
		chrome.runtime.onMessage.addListener(function (message) {
			if (message.type === 'error') {
				errorMessage.textContent = message.message;
				errorMessage.classList.add('visible');
				setTimeout(function () {
					errorMessage.classList.remove('visible');
				}, 5000);
			}
		});
	}
});
