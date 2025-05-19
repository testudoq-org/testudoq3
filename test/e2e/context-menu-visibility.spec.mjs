import { describe, beforeEach, afterEach, test, expect } from '@jest/globals';
import { builder } from '../../src/lib/chrome-menu-builder.mjs';
import { ContextMenu } from '../../src/lib/context-menu.mjs';

describe('Context Menu Visibility', () => {
	let contextMenu, testPage;

	beforeEach(async () => {
		// Initialize extension components
		contextMenu = new ContextMenu(builder);
		await contextMenu.init();

		// Create test page with different clickable elements
		testPage = await global.browser.newPage();
		await testPage.setContent(`
			<html>
				<body>
					<div id="regularArea">Click area</div>
					<a href="#" id="testLink">Test Link</a>
					<input type="text" id="textInput" value="Input field">
					<div id="selectableText">Some selectable text</div>
				</body>
			</html>
		`);
	});

	afterEach(async () => {
		await testPage.close();
	});

	test('should show menu items in all appropriate contexts', async () => {
		const regularAreaMenu = await testPage.evaluate(() => {
				const element = document.getElementById('regularArea'),
					event = new MouseEvent('contextmenu', {
						bubbles: true,
						cancelable: true
					});
				element.dispatchEvent(event);
				return global.chrome.contextMenus.getAll();
			}),
			selectedTextMenu = await testPage.evaluate(() => {
				const element = document.getElementById('selectableText'),
					range = document.createRange(),
					event = new MouseEvent('contextmenu', {
						bubbles: true,
						cancelable: true
					});
				range.selectNodeContents(element);
				window.getSelection().removeAllRanges();
				window.getSelection().addRange(range);
				element.dispatchEvent(event);
				return global.chrome.contextMenus.getAll();
			}),
			linkMenu = await testPage.evaluate(() => {
				const element = document.getElementById('testLink'),
					event = new MouseEvent('contextmenu', {
						bubbles: true,
						cancelable: true
					});
				element.dispatchEvent(event);
				return global.chrome.contextMenus.getAll();
			}),
			inputMenu = await testPage.evaluate(() => {
				const element = document.getElementById('textInput'),
					event = new MouseEvent('contextmenu', {
						bubbles: true,
						cancelable: true
					});
				element.dispatchEvent(event);
				return global.chrome.contextMenus.getAll();
			});

		// Verify menu items in regular page area
		expect(regularAreaMenu.length).toBeGreaterThan(0);
		expect(regularAreaMenu.find(item => item.id === 'customise')).toBeTruthy();

		// Verify menu items in selected text
		expect(selectedTextMenu.find(item => item.id === 'copyValue')).toBeTruthy();

		// Verify menu items in links
		expect(linkMenu.find(item => item.id === 'injectValue')).toBeTruthy();

		// Verify menu items in input fields
		expect(inputMenu.find(item => item.id === 'pasteValue')).toBeTruthy();
	});

	test('should maintain correct menu structure', async () => {
		const menuStructure = await testPage.evaluate(() => {
				const element = document.body,
					event = new MouseEvent('contextmenu', {
						bubbles: true,
						cancelable: true
					});
				element.dispatchEvent(event);
				return global.chrome.contextMenus.getAll();
			}),
			separatorIndices = menuStructure
				.map((item, index) => item.type === 'separator' ? index : -1)
				.filter(index => index !== -1),
			customiseIndex = menuStructure.findIndex(item => item.id === 'customise'),
			helpIndex = menuStructure.findIndex(item => item.id === 'help'),
			modeSubmenu = menuStructure.find(item => item.id === 'operationalMode');

		// Verify separator placement
		expect(separatorIndices.length).toBeGreaterThan(0);
		expect(separatorIndices[0]).toBeLessThan(separatorIndices[1]);

		// Check menu item positions
		expect(customiseIndex).toBeGreaterThan(0);
		expect(helpIndex).toBeGreaterThan(customiseIndex);

		// Verify operational mode submenu
		expect(modeSubmenu).toBeTruthy();
		expect(modeSubmenu.children).toBeDefined();
		expect(modeSubmenu.children.length).toBeGreaterThan(0);
	});
});
