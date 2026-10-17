import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { PRODUCTS } from '../data/products';
import { getBundleDiscountRate, getCartPricing, hydrateCart, MAX_CART_QUANTITY, normalizeCartQuantity } from './cart';

const require = createRequire(import.meta.url);
const { createStripeForm, getDiscountRate } = require('../../../api/create-checkout-session.js');

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

describe('cart pricing', () => {
	it('uses the same bundle rate as the server', () => {
		for (const count of [0, 1, 2, 3, 4]) expect(getBundleDiscountRate(count)).toBe(getDiscountRate(count));
	});

	it('matches the amount Stripe charges for every product combination', () => {
		const combinations = PRODUCTS.flatMap((_, index) => [PRODUCTS.slice(0, index + 1), PRODUCTS.slice(index)]);
		for (const products of combinations) {
			const cart = products.map((product, index) => ({ ...product, quantity: index + 1 }));
			const { form } = createStripeForm(cart.map(({ id, quantity }) => ({ id, quantity })), 'https://softhe.io');
			let stripeTotalCents = 0;
			cart.forEach((item, index) => {
				stripeTotalCents += Number(form.get(`line_items[${index}][price_data][unit_amount]`)) * item.quantity;
			});
			expect(Math.round(getCartPricing(cart).total * 100)).toBe(stripeTotalCents);
		}
	});

	it('rounds each discounted unit like the server for non-integer prices', () => {
		const pricing = getCartPricing([
			{ id: 'a', price: 49.99, quantity: 3 },
			{ id: 'b', price: 10, quantity: 1 },
		]);
		// 4999 * 0.95 = 4749.05 -> 4749 per unit; 1000 * 0.95 = 950.
		expect(pricing).toEqual({ discountRate: 0.05, subtotal: 159.97, discount: 8.0, total: 151.97 });
	});
});
