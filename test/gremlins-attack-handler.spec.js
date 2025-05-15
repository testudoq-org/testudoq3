/* global describe, beforeEach, afterEach, it */
import { expect } from 'chai';
import sinon from 'sinon';
import GremlinsHandler from '../src/lib/gremlins-attack-handler.mjs';

describe('GremlinsHandler', () => {
	let browserInterface,
		mockTab,
		clock;

	beforeEach(() => {
		browserInterface = {
			sendMessage: sinon.stub(),
			getActiveTabId: sinon.stub().resolves(123),
			showMessage: sinon.stub()
		};
		mockTab = { id: 123 };
		clock = sinon.useFakeTimers();
	});

	afterEach(() => {
		clock.restore();
		sinon.restore();
	});

	describe('Configuration Validation', () => {
		it('should validate duration within limits', async () => {
			// Test too short
			await expect(GremlinsHandler.start(browserInterface, mockTab.id, { attackDuration: 0 }))
				.to.be.rejectedWith('Attack duration must be between 1 and 300 seconds');

			// Test too long
			await expect(GremlinsHandler.start(browserInterface, mockTab.id, { attackDuration: 301 }))
				.to.be.rejectedWith('Attack duration must be between 1 and 300 seconds');
		});

		it('should validate species selection', async () => {
			// Test no species
			await expect(GremlinsHandler.start(browserInterface, mockTab.id, { species: [] }))
				.to.be.rejectedWith('At least one species must be selected');

			// Test invalid species
			await expect(GremlinsHandler.start(browserInterface, mockTab.id, { species: ['invalid'] }))
				.to.be.rejectedWith('Invalid species: invalid');
		});

		it('should validate mogwais if provided', async () => {
			await expect(GremlinsHandler.start(browserInterface, mockTab.id, { mogwais: ['invalid'] }))
				.to.be.rejectedWith('Invalid mogwais: invalid');
		});

		it('should validate strategy selection', async () => {
			await expect(GremlinsHandler.start(browserInterface, mockTab.id, { strategy: 'invalid' }))
				.to.be.rejectedWith('Invalid strategy: invalid. Must be one of: distribution,allTogether,bySpecies');
		});
	});

	describe('Attack Control', () => {
		beforeEach(() => {
			browserInterface.sendMessage.withArgs(mockTab.id, { command: 'getGremlinsState' })
				.resolves({ attacking: false });
		});

		it('should start attack with valid configuration', async () => {
			const config = {
					attackDuration: 15,
					species: ['clicker'],
					strategy: 'distribution'
				},
				result = await GremlinsHandler.start(browserInterface, mockTab.id, config);

			browserInterface.sendMessage.withArgs(mockTab.id, {
				command: 'startGremlins',
				config: { ...config, mogwais: ['alert', 'fps', 'gizmo'] }
			}).resolves({ success: true });

			expect(result).to.deep.equal({ success: true });
		});

		it('should prevent multiple simultaneous attacks', async () => {
			browserInterface.sendMessage.withArgs(mockTab.id, { command: 'getGremlinsState' })
				.resolves({ attacking: true });

			await expect(GremlinsHandler.start(browserInterface, mockTab.id))
				.to.be.rejectedWith('An attack is already in progress on this tab');
		});

		it('should auto-stop attack after duration', async () => {
			const config = { attackDuration: 5 };
			browserInterface.sendMessage.resolves({ success: true });

			await GremlinsHandler.start(browserInterface, mockTab.id, config);
			expect(browserInterface.sendMessage.callCount).to.equal(2); // getState + start

			// Fast-forward time
			await clock.tickAsync(5000);
			expect(browserInterface.sendMessage.callCount).to.equal(4); // +getState + stop
		});

		it('should handle stop request when no attack is running', async () => {
			browserInterface.sendMessage.withArgs(mockTab.id, { command: 'getGremlinsState' })
				.resolves({ attacking: false });

			const result = await GremlinsHandler.stop(browserInterface, mockTab.id);
			expect(result.status).to.equal('notRunning');
		});

		it('should stop running attack', async () => {
			browserInterface.sendMessage.withArgs(mockTab.id, { command: 'getGremlinsState' })
				.resolves({ attacking: true });
			browserInterface.sendMessage.withArgs(mockTab.id, { command: 'stopGremlins' })
				.resolves({ success: true });

			const result = await GremlinsHandler.stop(browserInterface, mockTab.id);
			expect(result.status).to.equal('stopped');
		});
	});

	describe('Tab Management', () => {
		it('should use active tab if none provided', async () => {
			browserInterface.sendMessage.resolves({ success: true });

			await GremlinsHandler.start(browserInterface);
			expect(browserInterface.getActiveTabId.calledOnce).to.be.true;
		});

		it('should verify tab accessibility', async () => {
			browserInterface.sendMessage.withArgs(mockTab.id, { command: 'ping' })
				.rejects(new Error('Tab not found'));

			await expect(GremlinsHandler.start(browserInterface, mockTab.id))
				.to.be.rejectedWith('Tab 123 is not accessible: Tab not found');
		});
	});

	describe('Configuration Options', () => {
		it('should provide valid configuration values', () => {
			const options = GremlinsHandler.getValidOptions();
			expect(options).to.have.all.keys('strategies', 'species', 'mogwais', 'durationLimits');
			expect(options.durationLimits).to.deep.equal({ min: 1, max: 300 });
		});

		it('should not allow modification of valid options', () => {
			const options = GremlinsHandler.getValidOptions(),
				newOptions = GremlinsHandler.getValidOptions();
			options.species.push('invalid');
			expect(newOptions.species).to.not.include('invalid');
		});
	});
});
