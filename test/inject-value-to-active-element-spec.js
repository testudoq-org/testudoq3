/*global describe, it, expect, beforeEach, afterEach, jasmine, document */
import injectValueToActiveElement from '../src/lib/inject-value-to-active-element.mjs';

/**
 * Test suite for the injectValueToActiveElement function
 * Tests value injection into various HTML elements
 */
describe('injectValueToActiveElement', () => {
	/**
	 * Test DOM structure
	 * @type {string}
	 */
	const template_html = [
		'<input type="text" value="old text"/>',
		'<textarea>old text area</textarea>',
		'<div contenteditable>old div</div>',
		'<span contenteditable>old span</span>',
		'<iframe></iframe>'
	].join('');

	/**
	 * Test element references
	 */
	let testElements,
		input,
		textArea,
		contentEditable,
		iframe,
		span;

	/**
	 * Set up test DOM before each test
	 */
	beforeEach(() => {
		testElements = document.createElement('div');
		testElements.innerHTML = template_html;
		input = testElements.getElementsByTagName('input')[0];
		textArea = testElements.getElementsByTagName('textarea')[0];
		contentEditable = testElements.getElementsByTagName('div')[0];
		span = testElements.getElementsByTagName('span')[0];
		document.body.appendChild(testElements);
		iframe = testElements.getElementsByTagName('iframe')[0];
	});

	/**
	 * Clean up test DOM after each test
	 */
	afterEach(() => {
		document.body.removeChild(testElements);
	});

	describe('error handling', () => {
		it('handles message before element focus without throwing', () => {
			expect(() => injectValueToActiveElement({
				_type: 'literal',
				value: 'xxx'
			})).not.toThrow();
		});
	});

	describe('input element handling', () => {
		it('sets input value when focused', () => {
			input.focus();
			injectValueToActiveElement({ _type: 'literal', value: 'xyz' });
			expect(input.value).toBe('xyz');
		});

		it('dispatches change event', () => {
			const spy = jasmine.createSpy('change');
			input.focus();
			input.onchange = spy;
			injectValueToActiveElement({ _type: 'literal', value: 'xyz' });
			expect(spy).toHaveBeenCalled();
		});

		it('dispatches input event', () => {
			const spy = jasmine.createSpy('input');
			input.focus();
			input.onchange = spy;
			injectValueToActiveElement({ _type: 'literal', value: 'xyz' });
			expect(spy).toHaveBeenCalled();
		});
	});

	describe('textarea element handling', () => {
		it('sets textarea value when focused', () => {
			textArea.focus();
			injectValueToActiveElement({ _type: 'literal', value: 'xyz' });
			expect(textArea.value).toBe('xyz');
		});

		it('dispatches change event', () => {
			const spy = jasmine.createSpy('change');
			textArea.focus();
			textArea.onchange = spy;
			injectValueToActiveElement({ _type: 'literal', value: 'xyz' });
			expect(spy).toHaveBeenCalled();
		});

		it('dispatches input event', () => {
			const spy = jasmine.createSpy('input');
			textArea.focus();
			textArea.onchange = spy;
			injectValueToActiveElement({ _type: 'literal', value: 'xyz' });
			expect(spy).toHaveBeenCalled();
		});
	});

	describe('contenteditable element handling', () => {
		it('sets contenteditable div innerText when focused', () => {
			contentEditable.focus();
			injectValueToActiveElement({ _type: 'literal', value: 'xyz' });
			expect(contentEditable.innerText).toBe('xyz');
		});

		it('sets contenteditable span innerText when focused', () => {
			span.focus();
			injectValueToActiveElement({ _type: 'literal', value: 'xyz' });
			expect(span.innerText).toBe('xyz');
		});
	});

	describe('iframe element handling', () => {
		it('sets value of focused element inside iframe', () => {
			iframe.contentDocument.body.innerHTML = template_html;
			const insideInput = iframe.contentDocument.getElementsByTagName('input')[0];
			iframe.focus(); // make phantomjs think it's clicked
			insideInput.focus();

			expect(document.activeElement).toBe(iframe);

			injectValueToActiveElement({ _type: 'literal', value: 'xyz' });
			expect(insideInput.value).toBe('xyz');
		});
	});

	describe('size generator handling', () => {
		it('generates content of specified size using template', () => {
			input.focus();
			injectValueToActiveElement({
				_type: 'size',
				size: '20',
				template: '1234567'
			});
			expect(input.value).toBe('12345671234567123456');
		});
	});
});
