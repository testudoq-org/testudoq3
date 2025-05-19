/* global chrome */

/**
 * Handles pasting of text from clipboard with tab context validation.
 */
export const handlePaste = async () => {
		try {
			const context = {
					tabInfo: await chrome.tabs.getCurrent(),
					permissionStatus: await navigator.permissions.query({ name: 'clipboard-read' })
				},
				diagnostics = {
					hasTabContext: !!context.tabInfo?.id,
					tabId: context.tabInfo?.id,
					documentState: document.readyState,
					hasClipboardAPI: 'clipboard' in navigator,
					clipboardPermission: context.permissionStatus.state,
					timestamp: Date.now()
				},
				clipboardData = {
					text: await navigator.clipboard.readText(),
					timestamp: Date.now()
				},
				submenuText = clipboardData.text.includes(':') ?
					clipboardData.text.split(':')[1].trim() :
					clipboardData.text;

			console.log('[Paste Flow] Context validation:', diagnostics);

			if (!diagnostics.hasTabContext) {
				throw new Error('Missing tab context');
			}

			console.log('[Paste Flow] Operation completed:', {
				submenuText,
				originalText: clipboardData.text,
				tabId: diagnostics.tabId,
				timing: clipboardData.timestamp - diagnostics.timestamp
			});

			return submenuText;
		} catch (error) {
			console.error('[Paste Flow] Operation failed:', {
				error: error.message,
				stack: error.stack
			});
			throw error;
		}
	},

	testPasteOperation = async () => {
		console.log('[Test] Starting paste operation test...');

		try {
			const context = {
					permissionStatus: await navigator.permissions.query({ name: 'clipboard-read' }),
					tabInfo: await chrome.tabs.getCurrent()
				},
				result = await handlePaste();

			console.log('[Test] Environment check:', {
				clipboardRead: context.permissionStatus.state,
				hasClipboardAPI: 'clipboard' in navigator,
				hasTabInfo: !!context.tabInfo,
				tabId: context.tabInfo?.id,
				url: context.tabInfo?.url
			});

			console.log('[Test] Operation complete:', {
				success: true,
				result
			});
		} catch (error) {
			console.error('[Test] Operation failed:', {
				error: error.message,
				stack: error.stack
			});
		}
	};

// Initialize paste handler and run tests in development
document.addEventListener('DOMContentLoaded', () => {
	handlePaste();
	if (process.env.NODE_ENV === 'development') {
		testPasteOperation();
	}
});
