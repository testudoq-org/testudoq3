import { test, expect } from '@playwright/test';

test.describe('Context Menu Integration', () => {
	let browser, context, page;

	test.beforeEach(async ({ playwright }) => {
		browser = await playwright.chromium.launch();
		context = await browser.newContext();
		page = await context.newPage();
		// Load the extension
		await context.addInitScript(() => {
			window.chrome = {
				runtime: {
					sendMessage: () => {},
					onMessage: {
						addListener: () => {}
					}
				},
				contextMenus: {
					create: () => {},
					removeAll: () => {}
				}
			};
		});

		await page.goto('about:blank');
	});

	test.afterEach(async () => {
		await browser.close();
	});

	test('should show menu items in page context', async () => {
		await page.click('body', { button: 'right' });
		const menu = page.getByRole('menu');

		await expect(menu.getByText('Testudoq')).toBeVisible();
		await expect(menu.getByText('Customize menus')).toBeVisible();
		await expect(menu.getByText('Help/Support')).toBeVisible();
	});

	test('should show menu items in text selection context', async () => {
		await page.setContent('<div>Sample text for selection</div>');
		await page.locator('div').selectText();
		await page.mouse.click(0, 0, { button: 'right' });

		const menu = page.getByRole('menu');
		await expect(menu.getByText('Testudoq')).toBeVisible();
		await expect(menu.getByText('Operational mode')).toBeVisible();
	});

	test('should show menu items in link context', async () => {
		await page.setContent('<a href="#">Test Link</a>');
		await page.locator('a').click({ button: 'right' });

		const menu = page.getByRole('menu');
		await expect(menu.getByText('Testudoq')).toBeVisible();
		await expect(menu.getByText('Customize menus')).toBeVisible();
	});

	test('should show menu items in editable context', async () => {
		await page.setContent('<input type="text">');
		await page.locator('input').click({ button: 'right' });

		const menu = page.getByRole('menu');
		await expect(menu.getByText('Testudoq')).toBeVisible();
		await expect(menu.getByText('Inject value')).toBeVisible();
	});

	test('should maintain essential items during error recovery', async () => {
		// Simulate menu rebuild error by removing chrome.contextMenus API
		await page.evaluate(() => {
			delete window.chrome.contextMenus;
		});

		// Trigger menu rebuild by changing handler type
		await page.click('body', { button: 'right' });
		const menu = page.getByRole('menu');

		// Verify essential menu items are still present
		await expect(menu.getByText('Testudoq')).toBeVisible();
		await expect(menu.getByText('Help/Support')).toBeVisible();
	});

	test('should handle multiple rapid menu rebuilds', async () => {
		// Trigger multiple rapid menu rebuilds
		for (let i = 0; i < 5; i++) {
			await page.click('body', { button: 'right' });
			await page.keyboard.press('Escape');
		}

		// Verify menu structure remains intact
		await page.click('body', { button: 'right' });
		const menu = page.getByRole('menu');

		await expect(menu.getByText('Testudoq')).toBeVisible();
		await expect(menu.getByText('Operational mode')).toBeVisible();
		await expect(menu.getByText('Customize menus')).toBeVisible();
	});

	test('should recover from permission errors', async () => {
		// Simulate permission error
		await page.evaluate(() => {
			window.chrome.permissions = {
				request: () => Promise.reject(new Error('Permission denied')),
				remove: () => Promise.resolve()
			};
		});

		await page.click('body', { button: 'right' });
		const menu = page.getByRole('menu');
		await menu.getByText('Operational mode').click();
		await menu.getByText('Simulate pasting').click();

		// Verify fallback to default mode
		await expect(menu.getByText('Inject value')).toBeVisible();
	});
});
