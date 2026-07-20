import { describe, expect, it } from 'vitest';
import { hydrateCart, MAX_CART_QUANTITY, normalizeCartQuantity } from './cart';

describe('cart normalization', () => {
	it('rejects invalid quantities and caps oversized quantities', () => {
		expect(normalizeCartQuantity('not-a-number')).toBeNull();
		expect(normalizeCartQuantity(0)).toBeNull();
		expect(normalizeCartQuantity(MAX_CART_QUANTITY + 5)).toBe(MAX_CART_QUANTITY);
	});

	it('rejects non-array storage and ignores malformed or unknown items', () => {
		expect(hydrateCart(null)).toEqual([]);
		expect(hydrateCart([null, { id: 'unknown', quantity: 1 }])).toEqual([]);
	});

	it('merges duplicate stored products without exceeding the cart limit', () => {
		const [item] = hydrateCart([
			{ id: 'windows-10', quantity: 7 },
			{ id: 'windows-10', quantity: 7 },
		]);

		expect(item).toEqual(expect.objectContaining({
			id: 'windows-10',
			quantity: MAX_CART_QUANTITY,
		}));
	});
});
