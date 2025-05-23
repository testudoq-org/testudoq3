import { describe, beforeEach, afterEach, test, expect } from '@jest/globals';
import { builder as chromeBuilder } from '../../src/lib/chrome-menu-builder.mjs';
import { builder as firefoxBuilder } from '../../src/lib/firefox-menu-builder.mjs';
import { ContextMenu } from '../../src/lib/context-menu.mjs';

describe('Context Menu Visibility', () => {
	let contextMenu, testPage;

	const builders = [
		{ name: 'Chrome', builder: chromeBuilder },
		{ name: 'Firefox', builder: firefoxBuilder }
	];

	builders.forEach(({ name, builder }) => {
		describe(`${name} Menu Implementation`, () => {
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

			test('should show universal menu items in all contexts', async () => {
				const contexts = [
					{ id: 'regularArea', type: 'page' },
					{
						id: 'selectableText',
						type: 'selection',
						setupFn: () => {
							return function setupSelection(element) {
								const range = document.createRange(),
									selection = window.getSelection();
								range.selectNodeContents(element);
								selection.removeAllRanges();
								selection.addRange(range);
							};
						}
					},
					{ id: 'testLink', type: 'link' },
					{ id: 'textInput', type: 'editable' }
				];

				for (const context of contexts) {
					const menuItems = await testPage.evaluate(({ id, setupFn }) => {
						const element = document.getElementById(id),
							event = new MouseEvent('contextmenu', {
								bubbles: true,
								cancelable: true
							});
						if (setupFn) {
							setupFn()(element);
						}
						element.dispatchEvent(event);
						return global.chrome.contextMenus.getAll();
					}, context);

					// Universal items should be present in all contexts
					expect(menuItems.find(item => item.id === 'customise')).toBeTruthy();
					expect(menuItems.find(item => item.id === 'help')).toBeTruthy();

					// Context-specific items
					if (context.type === 'selection') {
						expect(menuItems.find(item => item.id === 'copyValue')).toBeTruthy();
					}
					if (context.type === 'link') {
						expect(menuItems.find(item => item.id === 'injectValue')).toBeTruthy();
					}
					if (context.type === 'editable') {
						expect(menuItems.find(item => item.id === 'pasteValue')).toBeTruthy();
					}
				}
			});

			test('should maintain correct menu structure and separators', async () => {
				const contexts = ['page', 'selection', 'link', 'editable'],
					elementMap = {
						page: 'regularArea',
						selection: 'selectableText',
						link: 'testLink',
						editable: 'textInput'
					};

				for (const contextType of contexts) {
					const elementId = elementMap[contextType],
						menuStructure = await testPage.evaluate((id) => {
							const element = document.getElementById(id),
								range = document.createRange(),
								selection = window.getSelection(),
								event = new MouseEvent('contextmenu', {
									bubbles: true,
									cancelable: true
								});

							if (id === 'selectableText') {
								range.selectNodeContents(element);
								selection.removeAllRanges();
								selection.addRange(range);
							}
							element.dispatchEvent(event);
							return global.chrome.contextMenus.getAll();
						}, elementId),
						separatorIndices = menuStructure
							.map((item, index) => item.type === 'separator' ? index : -1)
							.filter(index => index !== -1),
						customiseIndex = menuStructure.findIndex(item => item.id === 'customise'),
						helpIndex = menuStructure.findIndex(item => item.id === 'help'),
						modeSubmenu = menuStructure.find(item => item.id === 'operationalMode'),
						universalItemsSeparator = separatorIndices
							.find(index => index < customiseIndex);

					// Verify separator placement
					expect(separatorIndices.length).toBeGreaterThan(0);
					if (separatorIndices.length > 1) {
						expect(separatorIndices[0]).toBeLessThan(separatorIndices[1]);
					}

					// Check universal menu items are present and correctly positioned
					expect(customiseIndex).toBeGreaterThan(-1);
					expect(helpIndex).toBeGreaterThan(-1);
					expect(helpIndex).toBeGreaterThan(customiseIndex);

					// Verify operational mode submenu structure
					expect(modeSubmenu).toBeTruthy();
					expect(modeSubmenu.children).toBeDefined();
					expect(modeSubmenu.children.length).toBeGreaterThan(0);

					// Verify separators around universal items
					expect(universalItemsSeparator).toBeDefined();
				}
			});
		});
	});
});
