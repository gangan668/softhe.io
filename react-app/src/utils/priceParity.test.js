import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { PRODUCTS as clientProducts } from '../data/products';

const require = createRequire(import.meta.url);
const { PRODUCTS: serverProducts } = require('../../../api/create-checkout-session.js');

// The storefront shows euro prices from src/data/products.js while Stripe is charged
// from the server table in cents. Any drift means customers see one price and pay another.
describe('client/server price parity', () => {
	it('lists exactly the same product ids on both sides', () => {
		const clientIds = clientProducts.map(({ id }) => id).sort();
		expect(new Set(clientIds).size).toBe(clientIds.length);
		expect(clientIds).toEqual(Object.keys(serverProducts).sort());
	});

	it.each(clientProducts.map((product) => [product.id, product]))('%s matches by name and price', (id, product) => {
		const server = serverProducts[id];
		expect(server, `server is missing ${id}`).toBeDefined();
		expect(product.name).toBe(server.name);
		expect(Number.isInteger(server.unitAmount)).toBe(true);
		expect(Math.round(product.price * 100)).toBe(server.unitAmount);
	});
});
