/*global describe, it, beforeEach, jasmine, expect, expectAsync*/
const ContextMenu = require('../src/lib/context-menu');

describe('ContextMenu', function () {
	let fakeRoot, standardConfig, browserInterface, underTest, processMenuObject, menuBuilder;

	beforeEach(function () {
		standardConfig = {
			name: 'value'
		};
		fakeRoot = {fake: 'root'};
		processMenuObject = jasmine.createSpy('processMenuObject');
		menuBuilder = jasmine.createSpyObj('menuBuilder', ['rootMenu', 'separator', 'menuItem', 'removeAll', 'subMenu', 'choice']);
		browserInterface = jasmine.createSpyObj('browserInterface', [
			'getOptionsAsync',
			'openSettings',
			'addStorageListener',
			'executeScript',
			'sendMessage',
			'showMessage',
			'requestPermissions',
			'removePermissions',
			'openUrl'
		]);

		browserInterface.executeScript.and.returnValue(Promise.resolve({}));
		browserInterface.sendMessage.and.returnValue(Promise.resolve({}));
		browserInterface.requestPermissions.and.returnValue(Promise.resolve(true));
		browserInterface.removePermissions.and.returnValue(Promise.resolve(true));
		menuBuilder.rootMenu.and.returnValue(fakeRoot);
		menuBuilder.removeAll.and.returnValue(Promise.resolve({}));
		underTest = new ContextMenu(standardConfig, browserInterface, menuBuilder, processMenuObject, true);
	});

	describe('initial load', function () {
		it('sets up the basic menu when no local settings', async () => {
			browserInterface.getOptionsAsync.and.returnValue(Promise.resolve());
			await underTest.init();
			expect(processMenuObject.calls.count()).toBe(1);
			expect(processMenuObject.calls.argsFor(0)).toEqual([
				standardConfig,
				menuBuilder,
				fakeRoot,
				jasmine.any(Function)
			]);
		});

		it('sets up only the basic menu when local settings do not contain additional menus', async () => {
			browserInterface.getOptionsAsync.and.returnValue(Promise.resolve({another: true}));
			await underTest.init();
			expect(processMenuObject.calls.count()).toBe(1);
			expect(processMenuObject.calls.argsFor(0)).toEqual([
				standardConfig,
				menuBuilder,
				fakeRoot,
				jasmine.any(Function)
			]);
		});

		it('sets up additional menus between standard config and generic menus', async () => {
			browserInterface.getOptionsAsync.and.returnValue(Promise.resolve({
				additionalMenus: [
					{name: 'first', config: '123'},
					{name: 'second', config: 'xyz'}
				]
			}));
			await underTest.init();
			expect(processMenuObject.calls.count()).toBe(3);
			expect(processMenuObject.calls.argsFor(0)).toEqual([
				standardConfig,
				menuBuilder,
				fakeRoot,
				jasmine.any(Function)
			]);
			expect(processMenuObject.calls.argsFor(1)).toEqual([
				{first: '123'},
				menuBuilder,
				fakeRoot,
				jasmine.any(Function)
			]);
			expect(processMenuObject.calls.argsFor(2)).toEqual([
				{second: 'xyz'},
				menuBuilder,
				fakeRoot,
				jasmine.any(Function)
			]);
		});

		it('sets up only additional menus when skipStandard is set', async () => {
			browserInterface.getOptionsAsync.and.returnValue(Promise.resolve({
				skipStandard: true,
				additionalMenus: [
					{name: 'first', config: '123'},
					{name: 'second', config: 'xyz'}
				]
			}));
			await underTest.init();
			expect(processMenuObject.calls.count()).toBe(2);
			expect(processMenuObject.calls.argsFor(0)).toEqual([
				{first: '123'},
				menuBuilder,
				fakeRoot,
				jasmine.any(Function)
			]);
			expect(processMenuObject.calls.argsFor(1)).toEqual([
				{second: 'xyz'},
				menuBuilder,
				fakeRoot,
				jasmine.any(Function)
			]);
		});
	});

	describe('handler type management', () => {
		let clickHandler;

		beforeEach(async () => {
			browserInterface.getOptionsAsync.and.returnValue(Promise.resolve());
			await underTest.init();
			clickHandler = processMenuObject.calls.argsFor(0)[3];
		});

		it('starts in injectValue mode by default', async () => {
			await clickHandler(1, 'test');
			expect(browserInterface.executeScript).toHaveBeenCalledWith(1, '/inject-value.js');
		});

		it('switches to paste mode with proper permissions', async () => {
			const turnOnPasting = menuBuilder.choice.calls.argsFor(1)[2];
			await turnOnPasting();
			await clickHandler(1, 'test');
			expect(browserInterface.requestPermissions).toHaveBeenCalledWith(['clipboardRead', 'clipboardWrite']);
			expect(browserInterface.executeScript).toHaveBeenCalledWith(1, '/paste.js');
		});

		it('shows error message when paste permissions are denied', async () => {
			browserInterface.requestPermissions.and.returnValue(Promise.reject(new Error('Permission denied')));
			const turnOnPasting = menuBuilder.choice.calls.argsFor(1)[2];
			await turnOnPasting();
			expect(browserInterface.showMessage).toHaveBeenCalledWith('Could not access clipboard');
		});

		it('switches to copy mode', async () => {
			const turnOnCopy = menuBuilder.choice.calls.argsFor(2)[2];
			await turnOnCopy();
			await clickHandler(1, 'test');
			expect(browserInterface.executeScript).toHaveBeenCalledWith(1, '/copy.js');
		});

		it('reverts to injectValue mode when turning off paste', async () => {
			const turnOffPasting = menuBuilder.choice.calls.argsFor(0)[2];
			await turnOffPasting();
			await clickHandler(1, 'test');
			expect(browserInterface.executeScript).toHaveBeenCalledWith(1, '/inject-value.js');
			expect(browserInterface.removePermissions).toHaveBeenCalledWith(['clipboardRead', 'clipboardWrite']);
		});
	});

	describe('click handler error handling', () => {
		let clickHandler;

		beforeEach(async () => {
			browserInterface.getOptionsAsync.and.returnValue(Promise.resolve());
			await underTest.init();
			clickHandler = processMenuObject.calls.argsFor(0)[3];
		});

		it('rejects when tab ID is invalid', async () => {
			await expectAsync(clickHandler(null, 'test')).toBeRejectedWithError('Invalid tab ID');
		});

		it('handles script execution errors', async () => {
			browserInterface.executeScript.and.returnValue(Promise.reject(new Error('Script error')));
			await expectAsync(clickHandler(1, 'test')).toBeRejectedWithError('Script error');
			expect(browserInterface.showMessage).toHaveBeenCalledWith('Action failed: Script error');
		});

		it('handles message sending errors', async () => {
			browserInterface.sendMessage.and.returnValue(Promise.reject(new Error('Send error')));
			await expectAsync(clickHandler(1, 'test')).toBeRejectedWithError('Send error');
			expect(browserInterface.showMessage).toHaveBeenCalledWith('Action failed: Send error');
		});
	});

	describe('menu rebuilding', () => {
		it('prevents concurrent rebuilds', async () => {
			browserInterface.getOptionsAsync.and.returnValue(Promise.resolve({
				additionalMenus: [{name: 'test', config: '123'}]
			}));

			const rebuild1 = underTest.init(),
				rebuild2 = underTest.init();

			await Promise.all([rebuild1, rebuild2]);
			expect(menuBuilder.removeAll.calls.count()).toBe(1);
		});

		it('handles rebuild errors gracefully', async () => {
			menuBuilder.removeAll.and.returnValue(Promise.reject(new Error('Rebuild error')));
			browserInterface.getOptionsAsync.and.returnValue(Promise.resolve({}));

			await underTest.init();
			expect(browserInterface.showMessage).toHaveBeenCalledWith('Action failed: Rebuild error');
		});
	});

	describe('generic menu items', () => {
		it('adds help/support menu item with correct URL', async () => {
			await underTest.init();
			const helpHandler = menuBuilder.menuItem.calls.argsFor(1)[2];
			await helpHandler();
			expect(browserInterface.openUrl).toHaveBeenCalledWith('https://testudo.co.nz/futterman/testudoq-help.html');
		});

		it('handles missing browser interface gracefully', async () => {
			await underTest.init();
			const helpHandler = menuBuilder.menuItem.calls.argsFor(1)[2];
			browserInterface.openUrl = undefined;
			await expectAsync(helpHandler()).toBeRejectedWithError('browserInterface cannot be null or undefined');
		});
	});
});
