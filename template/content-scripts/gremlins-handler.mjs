console.log('gremlins-handler.mjs loaded');
/* global chrome */

const gremlinsHandler = {
	state: {
		horde: null,
		attackTimeout: null,
		gremlins: null
	},

	async loadGremlins() {
		if (this.state.gremlins) {
			return this.state.gremlins;
		}

		const script = document.createElement('script'),
			loaded = new Promise(resolve => {
				script.onload = () => {
					this.state.gremlins = window.gremlins;
					resolve(this.state.gremlins);
				};
			});

		script.src = chrome.runtime.getURL('gremlins.min.js');
		document.head.appendChild(script);
		return loaded;
	},

	stopGremlins() {
		console.log('[Gremlins] Stopping attack');
		if (this.state.horde) {
			this.state.horde.stop();
			this.state.horde = null;
		}
		if (this.state.attackTimeout) {
			clearTimeout(this.state.attackTimeout);
			this.state.attackTimeout = null;
		}
		chrome.runtime.sendMessage({ command: 'updateGremlinsState', attacking: false });
	},

	async startGremlins(config) {
		console.log('[Gremlins] Starting attack with config:', config);
		const { attackDuration, species, mogwais, strategy } = config;

		if (this.state.horde) {
			this.stopGremlins();
		}

		try {
			const gremlins = await this.loadGremlins(),
				speciesConfig = species.map(s => gremlins.species[s]()),
				mogwaisConfig = mogwais.map(m => gremlins.mogwais[m]()),
				strategyConfig = gremlins.strategies[strategy]();

			this.state.horde = gremlins.createHorde({
				species: speciesConfig,
				mogwais: mogwaisConfig,
				strategies: [strategyConfig]
			});

			console.log('[Gremlins] Unleashing horde');
			this.state.horde.unleash();

			chrome.runtime.sendMessage({ command: 'updateGremlinsState', attacking: true });

			this.state.attackTimeout = setTimeout(() => this.stopGremlins(),
				attackDuration * 1000);

			return { success: true };
		} catch (error) {
			console.error('[Gremlins] Attack failed:', error);
			chrome.runtime.sendMessage({ command: 'updateGremlinsState', attacking: false });
			return { success: false, error: error.message };
		}
	},

	init() {
		chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
			console.log('[Gremlins] Received message:', message);

			if (message.command === 'startGremlins') {
				this.startGremlins(message.config)
					.then(sendResponse)
					.catch(error => {
						console.error('[Gremlins] Error starting gremlins from message listener:', error);
						sendResponse({ success: false, error: error.message || 'Unknown error' });
					});
				return true;
			}

			if (message.command === 'stopGremlins') {
				this.stopGremlins();
				sendResponse({ success: true });
				return true;
			}

			return false;
		});

		window.addEventListener('error', event => {
			console.error('[Gremlins] Error:', event.error);
			chrome.runtime.sendMessage({ command: 'updateGremlinsState', attacking: false });
		});

		window.addEventListener('unhandledrejection', event => {
			console.error('[Gremlins] Unhandled rejection:', event.reason);
			chrome.runtime.sendMessage({ command: 'updateGremlinsState', attacking: false });
		});

		console.log('[Gremlins] Content script initialized');
	}
};

gremlinsHandler.init();
