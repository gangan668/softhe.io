import { PRODUCT_BY_ID } from '../data/products';

export const MAX_CART_QUANTITY = 10;

export const normalizeCartQuantity = (quantity) => {
	const parsed = Number(quantity);
	return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, MAX_CART_QUANTITY) : null;
};

export const hydrateCart = (storedCart) => {
	if (!Array.isArray(storedCart)) return [];
	const quantities = new Map();

	for (const item of storedCart) {
		const product = PRODUCT_BY_ID.get(item?.id);
		const quantity = normalizeCartQuantity(item?.quantity);
		if (!product || !quantity) continue;
		quantities.set(product.id, Math.min(
			(quantities.get(product.id) || 0) + quantity,
			MAX_CART_QUANTITY,
		));
	}

	return [...quantities].map(([id, quantity]) => ({ ...PRODUCT_BY_ID.get(id), quantity }));
};

// Mirrors api/create-checkout-session.js: the rate depends on the number of distinct
// products, and Stripe receives a rounded discounted unit amount for each line.
export const getBundleDiscountRate = (productCount) => (productCount >= 3 ? 0.1 : productCount >= 2 ? 0.05 : 0);

export const getCartPricing = (cart) => {
	const discountRate = getBundleDiscountRate(cart.length);
	let subtotalCents = 0;
	let totalCents = 0;
	for (const item of cart) {
		const unitCents = Math.round(item.price * 100);
		subtotalCents += unitCents * item.quantity;
		totalCents += Math.round(unitCents * (1 - discountRate)) * item.quantity;
	}
	return {
		discountRate,
		subtotal: subtotalCents / 100,
		discount: (subtotalCents - totalCents) / 100,
		total: totalCents / 100,
	};
};
