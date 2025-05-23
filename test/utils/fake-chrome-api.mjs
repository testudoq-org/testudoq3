import sinon from 'sinon';

export class FakeBrowserAPI {
	constructor() {
		const createEvent = () => ({
			addListener: sinon.stub(),
			removeListener: sinon.stub()
		});

		this.executeScript = sinon.stub().resolves([{ result: true }]);
		this.sendMessage = sinon.stub().resolves({ success: true });

		// Keep other APIs for potential future use
		this.runtime = {
			onMessage: createEvent()
		};

		this.contextMenus = {
			create: sinon.stub(),
			removeAll: sinon.stub().resolves(undefined),
			onClicked: createEvent(),
			update: sinon.stub().resolves(undefined),
			getAll: sinon.stub().resolves([])
		};

		this.tabs = {
			query: sinon.stub().resolves([{ id: 1 }])
		};

		this.storage = {
			local: {
				get: sinon.stub().resolves({}),
				set: sinon.stub().resolves(undefined),
				clear: sinon.stub().resolves(undefined)
			},
			sync: {
				get: sinon.stub().resolves({}),
				set: sinon.stub().resolves(undefined)
			},
			onChanged: createEvent()
		};

		this.permissions = {
			request: sinon.stub().resolves(true),
			remove: sinon.stub().resolves(true),
			contains: sinon.stub().resolves(true)
		};
	}
}
