/*global describe, it, expect */
import getRequestValue from '../src/lib/get-request-value.mjs';

/**
 * Test suite for the getRequestValue function
 * Tests both literal and size-based value generation
 */
describe('getRequestValue', () => {
	/**
	 * Tests for literal value requests
	 */
	describe('literal type requests', () => {
		it('returns a literal value when _type=literal', () => {
			const request = {
				_type: 'literal',
				value: 'abc'
			};
			expect(getRequestValue(request)).toEqual('abc');
		});

		it('returns false for literal request without value', () => {
			const request = {
				_type: 'literal'
			};
			expect(getRequestValue(request)).toBeFalsy();
		});
	});

	/**
	 * Tests for size-based value requests
	 */
	describe('size type requests', () => {
		it('replicates template value up to specified size', () => {
			const testCases = [
				{
					request: { _type: 'size', size: '5', template: 'A' },
					expected: 'AAAAA'
				},
				{
					request: { _type: 'size', size: '20', template: '1234567' },
					expected: '12345671234567123456'
				}
			];

			testCases.forEach(({ request, expected }) => {
				expect(getRequestValue(request)).toEqual(expected);
			});
		});

		it('returns false for invalid size requests', () => {
			const invalidCases = [
				{ _type: 'size', size: '-1', template: 'A' },
				{ _type: 'size', size: 'invalid', template: 'A' },
				{ _type: 'size', size: '5' }  // missing template
			];

			invalidCases.forEach(request => {
				expect(getRequestValue(request)).toBeFalsy();
			});
		});
	});

	/**
	 * Tests for invalid requests
	 */
	describe('invalid requests', () => {
		it('returns false for falsy or invalid requests', () => {
			const invalidCases = [
				null,
				undefined,
				{},
				{ _type: 'unknown' }
			];

			invalidCases.forEach(request => {
				expect(getRequestValue(request)).toBeFalsy();
			});
		});
	});
});
