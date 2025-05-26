import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import initConfigWidget from '../../../src/lib/init-config-widget.mjs';

describe('initConfigWidget', () => {
	let mockBrowserInterface;
	const domElementId = 'config-widget-test';
	let testWidgetElement; // Added
	// let configDisplay; // Used by old tests
	// let messageArea;   // Used by old tests
	// let saveButton;    // Used by old tests
	// let loadButton;    // Used by old tests
	// let clearButton;   // Used by old tests
	// let closeButton; // Replaced by actualCloseButton in its test, or not used if initConfigWidget is called per test
	// Add other element variables if needed for specific assertions

	beforeEach(() => {
		// Create mock browser interface
		mockBrowserInterface = {
			storage: { // Though not directly used by initConfigWidget, keep for other test assertions if any
				local: {
					get: jest.fn().mockResolvedValue({}),
					set: jest.fn().mockResolvedValue(undefined),
					remove: jest.fn().mockResolvedValue(undefined)
				}
			},
			closeWindow: jest.fn(),
			showMessage: jest.fn(), // Used by tests, not directly by initConfigWidget's core logic being fixed
			confirmAction: jest.fn().mockResolvedValue(true), // Used by tests

			// Methods used by initConfigWidget.mjs
			getOptionsAsync: jest.fn().mockResolvedValue({ additionalMenus: [], skipStandard: false }),
			saveOptions: jest.fn(),
			readFile: jest.fn().mockResolvedValue('{"file": "content"}'), // Mock to return valid JSON content
			getRemoteFile: jest.fn().mockResolvedValue('{"remote": "content"}') // Mock to return valid JSON content
		};

		// Create the DOM structure
		document.body.innerHTML = `
		          <div id="${domElementId}">
		              <div role="status"></div> <!-- For showErrorMsg -->

		              <div role="main-screen">
		                  <input type="checkbox" role="option-skipStandard" /> <!-- Crucial for the error -->
		                  <div role="no-custom" style="display: none;">No custom menus defined.</div> <!-- For rebuildMenu -->
		                  <div role="yes-custom"> <!-- For rebuildMenu -->
		                      <ul id="additional-menus-list"> <!-- This will be 'list' -->
		                          <li role="template">
		                              <span role="name"></span>
		                              <span role="source"></span>
		                              <button role="remove">Remove</button>
		                          </li>
		                      </ul>
		                  </div>
		                  <button role="add">Add New Menu</button> <!-- Used by initScreen -->
		              </div>

		              <div role="file-loader" style="display: none;"> <!-- Was file-selector-screen, used by initScreen & others -->
		                  Name: <input type="text" role="submenu-name" /><br/>
		                  Source File: <div role="select-file-cover">Click to select file</div> <!-- Used by initScreen -->
		                  <input type="file" role="file-selector" style="display: none;" /><br/> <!-- Was file-input, Used by initScreen -->
		                  Or Paste JSON: <textarea role="custom-config-text"></textarea> <!-- Used by initScreen -->
		                  <button role="add-custom-config">Add from Text</button><br/> <!-- Used by initScreen -->
		                  Or Remote URL: <input type="text" role="remote-config-url" /> <!-- Used by initScreen -->
		                  <button role="add-remote-config">Add from URL</button><br/> <!-- Used by initScreen -->
		                  <button role="back" class="back-button-file-loader">Back to Main</button> <!-- Used by initScreen -->
		              </div>

		              <button role="close">Close Widget</button> <!-- Used by initScreen -->
		              
		              <!-- Elements from the original test that initConfigWidget.mjs might not use directly for its primary logic,
		                   but tests expect them for assertions. Keep them. -->
		              <textarea role="config-display"></textarea>
		              <button role="save"></button>
		              <button role="load"></button>
		              <button role="clear"></button>
		              <div role="message-area"></div>

		              <!-- Ensure at least one generic back button for querySelectorAll('[role=back]') -->
		              <button role="back" class="back-button-main">Back (Main)</button>
		          </div>
		      `;
		// Assign elements for easier access in tests
		testWidgetElement = document.getElementById(domElementId);
		// configDisplay = document.body.querySelector('[role="config-display"]'); // Used by old tests
		// messageArea = document.body.querySelector('[role="message-area"]');   // Used by old tests
		// saveButton = document.body.querySelector('[role="save"]');    // Used by old tests
		// loadButton = document.body.querySelector('[role="load"]');    // Used by old tests
		// clearButton = document.body.querySelector('[role="clear"]');   // Used by old tests
		// closeButton = document.body.querySelector('[role="close"]'); // This top-level var is no longer used
	});

	afterEach(() => {
		// Clean up DOM
		document.body.innerHTML = '';
		// Reset mocks
		jest.clearAllMocks();
	});

	it('should initialize event listeners and load initial config', async () => {
		// const initialConfig = { test: 'data' }; // This variable is not used as initConfigWidget uses getOptionsAsync
		// mockBrowserInterface.storage.local.get.mockResolvedValue({ userConfig: JSON.stringify(initialConfig) });

		// console.log('testWidgetElement before call:', testWidgetElement ? testWidgetElement.outerHTML.replace(/\s+/g, ' ').substring(0, 500) : 'null'); // Removed
		// if (testWidgetElement) {
		// 	const problemCheckbox = testWidgetElement.querySelector('[role="option-skipStandard"]');
		// 	console.log('Problem checkbox in test before call:', problemCheckbox ? problemCheckbox.outerHTML : 'null'); // Removed
		// }

		await initConfigWidget(testWidgetElement, mockBrowserInterface);

		expect(mockBrowserInterface.getOptionsAsync).toHaveBeenCalled();
		// Further assertions can be added here based on the initial state set by getOptionsAsync, e.g., checkbox state
		const skipStandardCheckbox = testWidgetElement.querySelector('[role="option-skipStandard"]');
		expect(skipStandardCheckbox.checked).toBe(false); // Based on mockResolvedValue for getOptionsAsync
	});

	it('should save options when skipStandard checkbox is changed', async () => {
		// Initial options: skipStandard is false
		mockBrowserInterface.getOptionsAsync.mockResolvedValueOnce({ additionalMenus: [], skipStandard: false });
		await initConfigWidget(testWidgetElement, mockBrowserInterface);

		const skipStandardCheckbox = testWidgetElement.querySelector('[role="option-skipStandard"]');
		expect(skipStandardCheckbox.checked).toBe(false); // Initial state

		// Simulate user checking the box
		skipStandardCheckbox.checked = true;
		skipStandardCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

		// saveOptions should be called with the new state
		expect(mockBrowserInterface.saveOptions).toHaveBeenCalledWith({
			additionalMenus: [], // Assuming no additional menus were added in this test
			skipStandard: true
		});

		// Simulate unchecking
		skipStandardCheckbox.checked = false;
		skipStandardCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

		expect(mockBrowserInterface.saveOptions).toHaveBeenCalledWith({
			additionalMenus: [],
			skipStandard: false
		});
	});


	// The following tests for generic save, load, clear buttons and configDisplay textarea
	// are misaligned with initConfigWidget's actual UI and logic.
	// They need to be refactored or removed. For now, I will comment them out
	// to focus on tests that match the component's behavior.

	/*
	it('should save configuration to storage when save button is clicked', async () => {
		await initConfigWidget(testWidgetElement, mockBrowserInterface);
		const newConfig = { key: 'value' };
		configDisplay.value = JSON.stringify(newConfig);
		saveButton.click();
		expect(mockBrowserInterface.storage.local.set).toHaveBeenCalledWith({ userConfig: JSON.stringify(newConfig) });
		expect(messageArea.textContent).toContain('Configuration saved successfully.');
	});

	it('should handle JSON parsing errors when saving', async () => {
		await initConfigWidget(testWidgetElement, mockBrowserInterface);
		configDisplay.value = 'invalid json';
		saveButton.click();
		expect(mockBrowserInterface.storage.local.set).not.toHaveBeenCalled();
		expect(messageArea.textContent).toContain('Error: Invalid JSON format.');
	});

	it('should load configuration from storage when load button is clicked', async () => {
		const storedConfig = { loaded: 'data' };
		mockBrowserInterface.storage.local.get.mockResolvedValue({ userConfig: JSON.stringify(storedConfig) });

		await initConfigWidget(testWidgetElement, mockBrowserInterface);
		// Clear initial load message for this test
		messageArea.textContent = '';
		configDisplay.value = ''; // Clear textarea

		loadButton.click();
		// Need to wait for async operations within load to complete
		await new Promise(resolve => setTimeout(resolve, 0));


		expect(mockBrowserInterface.storage.local.get).toHaveBeenCalledWith('userConfig');
		expect(configDisplay.value).toBe(JSON.stringify(storedConfig, null, 2));
		expect(messageArea.textContent).toContain('Configuration loaded successfully.');
	});

	it('should handle errors when loading configuration', async () => {
		mockBrowserInterface.storage.local.get.mockRejectedValue(new Error('Storage error'));

		await initConfigWidget(testWidgetElement, mockBrowserInterface);
		messageArea.textContent = ''; // Clear initial message

		loadButton.click();
		await new Promise(resolve => setTimeout(resolve, 0));


		expect(messageArea.textContent).toContain('Error loading configuration: Storage error');
	});

	it('should clear the textarea and storage when clear button is clicked after confirmation', async () => {
		mockBrowserInterface.confirmAction.mockResolvedValue(true); // User confirms
		await initConfigWidget(testWidgetElement, mockBrowserInterface);
		configDisplay.value = 'some config';

		clearButton.click();
		await new Promise(resolve => setTimeout(resolve, 0));


		expect(mockBrowserInterface.confirmAction).toHaveBeenCalledWith('Are you sure you want to clear the configuration? This will remove it from storage.');
		expect(configDisplay.value).toBe('');
		expect(mockBrowserInterface.storage.local.remove).toHaveBeenCalledWith('userConfig');
		expect(messageArea.textContent).toContain('Configuration cleared.');
	});

	it('should not clear if user cancels confirmation', async () => {
		mockBrowserInterface.confirmAction.mockResolvedValue(false); // User cancels
		await initConfigWidget(testWidgetElement, mockBrowserInterface);
		configDisplay.value = 'some config';
		mockBrowserInterface.storage.local.set({ userConfig: JSON.stringify({ initial: 'data' }) });


		clearButton.click();
		await new Promise(resolve => setTimeout(resolve, 0));

		expect(mockBrowserInterface.confirmAction).toHaveBeenCalled();
		expect(configDisplay.value).toBe('some config'); // Or initial config if load happened
		expect(mockBrowserInterface.storage.local.remove).not.toHaveBeenCalled();
		expect(messageArea.textContent).not.toContain('Configuration cleared.');
	});


	it('should handle errors when clearing configuration from storage', async () => {
		mockBrowserInterface.storage.local.remove.mockRejectedValue(new Error('Clear error'));
		mockBrowserInterface.confirmAction.mockResolvedValue(true);

		await initConfigWidget(testWidgetElement, mockBrowserInterface);

		clearButton.click();
		await new Promise(resolve => setTimeout(resolve, 0));

		expect(messageArea.textContent).toContain('Error clearing configuration: Clear error');
	});

	it('should display a message if no configuration is found on load', async () => {
		mockBrowserInterface.storage.local.get.mockResolvedValue({}); // No userConfig

		await initConfigWidget(testWidgetElement, mockBrowserInterface); // Initial load
		messageArea.textContent = ''; // Clear initial load message

		loadButton.click();
		await new Promise(resolve => setTimeout(resolve, 0));

		expect(configDisplay.value).toBe('{}'); // Default empty object
		expect(messageArea.textContent).toContain('No configuration found in storage.');
	});


	it('should handle empty or undefined config from storage gracefully on initial load', async () => {
		mockBrowserInterface.storage.local.get.mockResolvedValue({ userConfig: undefined });
		await initConfigWidget(testWidgetElement, mockBrowserInterface);
		expect(configDisplay.value).toBe('{}'); // Default to empty JSON object
		expect(messageArea.textContent).toContain('No configuration found or configuration is empty.');

		mockBrowserInterface.storage.local.get.mockResolvedValue({ userConfig: '' });
		await initConfigWidget(testWidgetElement, mockBrowserInterface);
		expect(configDisplay.value).toBe('{}');
		expect(messageArea.textContent).toContain('No configuration found or configuration is empty.');
	});

	it('should handle invalid JSON from storage gracefully on initial load', async () => {
		mockBrowserInterface.storage.local.get.mockResolvedValue({ userConfig: 'invalid json' });
		await initConfigWidget(testWidgetElement, mockBrowserInterface);
		expect(configDisplay.value).toBe('invalid json'); // Show the invalid JSON
		expect(messageArea.textContent).toContain('Error: Stored configuration is not valid JSON.');
	});


	it('should handle storage.local.set failure during save', async () => {
		mockBrowserInterface.storage.local.set.mockRejectedValue(new Error('Save failed'));
		await initConfigWidget(testWidgetElement, mockBrowserInterface);
		configDisplay.value = JSON.stringify({ a: 1 });

		saveButton.click();
		await new Promise(resolve => setTimeout(resolve, 0));

		expect(messageArea.textContent).toContain('Error saving configuration: Save failed');
	});
	*/

	// Test for close button (already implicitly tested by checking listener attachment)
	it('should call browserInterface.closeWindow when close button is clicked', async () => {
		await initConfigWidget(testWidgetElement, mockBrowserInterface);
		const actualCloseButton = testWidgetElement.querySelector('[role="close"]');
		actualCloseButton.click();
		expect(mockBrowserInterface.closeWindow).toHaveBeenCalled();
	});

	// TODO: Add tests for file input interactions (add button, file selection)
	// These might be more complex due to file input mocking.
});
