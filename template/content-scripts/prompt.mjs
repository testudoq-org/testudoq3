console.log('prompt.mjs loaded');

const promptHandler = {
	// Original dialog functions
	originals: {
		prompt: window.prompt,
		confirm: window.confirm,
		alert: window.alert
	},

	// Dialog state
	state: {
		nextPromptResult: false,
		recordedPrompt: null,
		nextConfirmationResult: false,
		recordedConfirmation: null,
		recordedAlert: null
	},

	getFrameLocation() {
		let frameLocation = '',
			currentWindow = window,
			currentParentWindow;

		while (currentWindow !== window.top) {
			currentParentWindow = currentWindow.parent;
			for (let idx = 0; idx < currentParentWindow.frames.length; idx++) {
				if (currentParentWindow.frames[idx] === currentWindow) {
					frameLocation = ':' + idx + frameLocation;
					currentWindow = currentParentWindow;
					break;
				}
			}
		}
		return 'root' + frameLocation;
	},

	handleMessage(event) {
		if (event.source === window &&
			event.data &&
			event.data.direction === 'from-content-script') {

			if (event.data.detach) {
				window.removeEventListener('message', this.handleMessage.bind(this));
				window.prompt = this.originals.prompt;
				window.confirm = this.originals.confirm;
				window.alert = this.originals.alert;
				return;
			}

			let result;
			switch (event.data.command) {
			case 'setNextPromptResult':
				this.state.nextPromptResult = event.data.target;
				document.body.setAttribute('setPrompt', true);
				window.postMessage({
					direction: 'from-page-script',
					response: 'prompt'
				}, '*');
				break;

			case 'getPromptMessage':
				result = this.state.recordedPrompt;
				this.state.recordedPrompt = null;
				window.postMessage({
					direction: 'from-page-script',
					response: 'prompt',
					value: result
				}, '*');
				break;

			case 'setNextConfirmationResult':
				this.state.nextConfirmationResult = event.data.target;
				document.body.setAttribute('setConfirm', true);
				window.postMessage({
					direction: 'from-page-script',
					response: 'confirm'
				}, '*');
				break;

			case 'getConfirmationMessage':
				result = this.state.recordedConfirmation;
				this.state.recordedConfirmation = null;
				window.postMessage({
					direction: 'from-page-script',
					response: 'confirm',
					value: result
				}, '*');
				break;

			case 'setNextAlertResult':
				document.body.setAttribute('setAlert', true);
				window.postMessage({
					direction: 'from-page-script',
					response: 'alert'
				}, '*');
				break;
			}
		}
	},

	setupDialogs() {
		const self = this;

		// Override dialogs in non-top window
		if (window !== window.top) {
			window.prompt = function (text, defaultText) {
				if (document.body.hasAttribute('SideeXPlayingFlag')) {
					return window.top.prompt(text, defaultText);
				}
				const result = self.originals.prompt(text, defaultText);
				window.top.postMessage({
					direction: 'from-page-script',
					recordedType: 'prompt',
					recordedMessage: text,
					recordedResult: result,
					frameLocation: self.getFrameLocation()
				}, '*');
				return result;
			};

			window.confirm = function (text) {
				if (document.body.hasAttribute('SideeXPlayingFlag')) {
					return window.top.confirm(text);
				}
				const result = self.originals.confirm(text);
				window.top.postMessage({
					direction: 'from-page-script',
					recordedType: 'confirm',
					recordedMessage: text,
					recordedResult: result,
					frameLocation: self.getFrameLocation()
				}, '*');
				return result;
			};

			window.alert = function (text) {
				if (document.body.hasAttribute('SideeXPlayingFlag')) {
					self.state.recordedAlert = text;
					window.top.postMessage({
						direction: 'from-page-script',
						response: 'alert',
						value: self.state.recordedAlert
					}, '*');
					return;
				}
				const result = self.originals.alert(text);
				window.top.postMessage({
					direction: 'from-page-script',
					recordedType: 'alert',
					recordedMessage: text,
					recordedResult: result,
					frameLocation: self.getFrameLocation()
				}, '*');
				return result;
			};
		} else {
			// Override dialogs in top window
			window.prompt = function (text, defaultText) {
				self.state.recordedPrompt = text;
				if (document.body.hasAttribute('setPrompt')) {
					document.body.removeAttribute('setPrompt');
					return self.state.nextPromptResult;
				}
				const result = self.originals.prompt(text, defaultText);
				window.top.postMessage({
					direction: 'from-page-script',
					recordedType: 'prompt',
					recordedMessage: text,
					recordedResult: result,
					frameLocation: self.getFrameLocation()
				}, '*');
				return result;
			};

			window.confirm = function (text) {
				self.state.recordedConfirmation = text;
				if (document.body.hasAttribute('setConfirm')) {
					document.body.removeAttribute('setConfirm');
					return self.state.nextConfirmationResult;
				}
				const result = self.originals.confirm(text);
				window.top.postMessage({
					direction: 'from-page-script',
					recordedType: 'confirm',
					recordedMessage: text,
					recordedResult: result,
					frameLocation: self.getFrameLocation()
				}, '*');
				return result;
			};

			window.alert = function (text) {
				self.state.recordedAlert = text;
				if (document.body.hasAttribute('SideeXPlayingFlag')) {
					window.top.postMessage({
						direction: 'from-page-script',
						response: 'alert',
						value: self.state.recordedAlert
					}, '*');
					return;
				}
				const result = self.originals.alert(text);
				window.top.postMessage({
					direction: 'from-page-script',
					recordedType: 'alert',
					recordedMessage: text,
					recordedResult: result,
					frameLocation: self.getFrameLocation()
				}, '*');
				return result;
			};
		}
	},

	init() {
		this.setupDialogs();
		if (window === window.top) {
			window.addEventListener('message', this.handleMessage.bind(this));
		}
	}
};

// Initialize the prompt handler
promptHandler.init();
