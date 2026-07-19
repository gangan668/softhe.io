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
