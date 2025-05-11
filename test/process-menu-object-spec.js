/*global jasmine, beforeEach, it, expect, describe */
import processMenuObject from '../src/lib/process-menu-object.mjs';

/**
 * Test suite for the processMenuObject function
 * Tests menu generation from various configuration objects
 */
describe('processMenuObject', () => {
	/**
	 * Test constants
	 * @type {Object}
	 */
	const test_data = {
		root_menu: 'rootM',
		sub_menu: 'subM',
		menu_items: {
			first: { name: 'First Item', value: 'VAT' },
			second: { name: 'Second Item', value: 'Corporate Tax' },
			another: { name: 'Another Item', value: 'Euro VAT' }
		},
		complex_item: {
			_type: 'taxtype',
			amount: '200'
		}
	};

	/**
	 * Test setup variables
	 */
	let rootMenu, menuBuilder, onClick;

	beforeEach(() => {
		rootMenu = test_data.root_menu;
		menuBuilder = jasmine.createSpyObj('menuBuilder', ['rootMenu', 'subMenu', 'menuItem']);
		onClick = jasmine.createSpy('onClick');
		menuBuilder.subMenu.and.returnValue(test_data.sub_menu);
	});

	describe('simple menu items', () => {
		it('creates menu items from string-value properties in order', () => {
			const config = {
				[test_data.menu_items.first.name]: test_data.menu_items.first.value,
				[test_data.menu_items.second.name]: test_data.menu_items.second.value,
				[test_data.menu_items.another.name]: test_data.menu_items.another.value
			};

			processMenuObject(config, menuBuilder, rootMenu, onClick);

			expect(menuBuilder.menuItem.calls.count()).toBe(3);
			expect(menuBuilder.menuItem.calls.argsFor(0)).toEqual([
				test_data.menu_items.first.name,
				rootMenu,
				onClick,
				test_data.menu_items.first.value
			]);
			expect(menuBuilder.menuItem.calls.argsFor(1)).toEqual([
				test_data.menu_items.second.name,
				rootMenu,
				onClick,
				test_data.menu_items.second.value
			]);
			expect(menuBuilder.menuItem.calls.argsFor(2)).toEqual([
				test_data.menu_items.another.name,
				rootMenu,
				onClick,
				test_data.menu_items.another.value
			]);
		});

		it('creates menu items from objects with _type property', () => {
			const config = {
				[test_data.menu_items.first.name]: test_data.complex_item
			};

			processMenuObject(config, menuBuilder, rootMenu, onClick);

			expect(menuBuilder.menuItem.calls.count()).toBe(1);
			expect(menuBuilder.menuItem.calls.argsFor(0)).toEqual([
				test_data.menu_items.first.name,
				rootMenu,
				onClick,
				test_data.complex_item
			]);
		});
	});

	describe('sub-menus', () => {
		it('creates sub-menus from string arrays using array indices', () => {
			const config = {
				'Taxes': [
					test_data.menu_items.first.value,
					test_data.menu_items.second.value,
					test_data.menu_items.another.value
				]
			};

			processMenuObject(config, menuBuilder, rootMenu, onClick);

			expect(menuBuilder.subMenu).toHaveBeenCalledWith('Taxes', rootMenu);
			expect(menuBuilder.menuItem.calls.count()).toBe(3);
			expect(menuBuilder.menuItem.calls.argsFor(0)).toEqual([
				test_data.menu_items.first.value,
				test_data.sub_menu,
				onClick,
				test_data.menu_items.first.value
			]);
			expect(menuBuilder.menuItem.calls.argsFor(1)).toEqual([
				test_data.menu_items.second.value,
				test_data.sub_menu,
				onClick,
				test_data.menu_items.second.value
			]);
			expect(menuBuilder.menuItem.calls.argsFor(2)).toEqual([
				test_data.menu_items.another.value,
				test_data.sub_menu,
				onClick,
				test_data.menu_items.another.value
			]);
		});

		it('creates sub-menus from nested objects', () => {
			const config = {
				'Taxes': {
					[test_data.menu_items.first.name]: test_data.menu_items.first.value,
					[test_data.menu_items.second.name]: test_data.menu_items.second.value,
					[test_data.menu_items.another.name]: test_data.menu_items.another.value
				}
			};

			processMenuObject(config, menuBuilder, rootMenu, onClick);

			expect(menuBuilder.subMenu).toHaveBeenCalledWith('Taxes', rootMenu);
			expect(menuBuilder.menuItem.calls.count()).toBe(3);
			expect(menuBuilder.menuItem.calls.argsFor(0)).toEqual([
				test_data.menu_items.first.name,
				test_data.sub_menu,
				onClick,
				test_data.menu_items.first.value
			]);
			expect(menuBuilder.menuItem.calls.argsFor(1)).toEqual([
				test_data.menu_items.second.name,
				test_data.sub_menu,
				onClick,
				test_data.menu_items.second.value
			]);
			expect(menuBuilder.menuItem.calls.argsFor(2)).toEqual([
				test_data.menu_items.another.name,
				test_data.sub_menu,
				onClick,
				test_data.menu_items.another.value
			]);
		});
	});

	describe('error handling', () => {
		it('handles falsy config objects gracefully', () => {
			expect(() => processMenuObject(null, menuBuilder, rootMenu, onClick)).not.toThrow();
			expect(() => processMenuObject(undefined, menuBuilder, rootMenu, onClick)).not.toThrow();
			expect(menuBuilder.menuItem).not.toHaveBeenCalled();
		});

		it('handles missing or invalid arguments gracefully', () => {
			expect(() => processMenuObject({}, null, rootMenu, onClick)).not.toThrow();
			expect(() => processMenuObject({}, menuBuilder, null, onClick)).not.toThrow();
			expect(menuBuilder.menuItem).not.toHaveBeenCalled();
		});
	});
});
