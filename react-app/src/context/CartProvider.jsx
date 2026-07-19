import { useCallback, useEffect, useState } from 'react';
import { PRODUCT_BY_ID } from '../data/products';
import { hydrateCart, MAX_CART_QUANTITY, normalizeCartQuantity } from '../utils/cart';
import { CartContext } from './CartContext';

const CART_STORAGE_KEY = 'softhe_cart';

const readStoredCart = () => {
	try {
		const savedCart = localStorage.getItem(CART_STORAGE_KEY);
		return hydrateCart(savedCart ? JSON.parse(savedCart) : []);
	} catch {
		return [];
	}
};

export function CartProvider({ children }) {
	const [cart, setCart] = useState(readStoredCart);

	useEffect(() => {
		try {
			const persistedCart = cart.map(({ id, quantity }) => ({ id, quantity }));
			localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(persistedCart));
		} catch {
			// Cart persistence is optional; keep the in-memory cart usable.
		}
	}, [cart]);

	const addToCart = (candidate) => {
		const product = PRODUCT_BY_ID.get(candidate?.id);
		if (!product) return;
		setCart((current) => {
			const existingItem = current.find((item) => item.id === product.id);
			if (!existingItem) return [...current, { ...product, quantity: 1 }];
			return current.map((item) => item.id === product.id
				? { ...item, quantity: Math.min(item.quantity + 1, MAX_CART_QUANTITY) }
				: item);
		});
	};

	const removeFromCart = (productId) => {
		setCart((current) => current.filter((item) => item.id !== productId));
	};

	const updateQuantity = (productId, quantity) => {
		if (Number(quantity) <= 0) {
			removeFromCart(productId);
			return;
		}
		const normalized = normalizeCartQuantity(quantity);
		if (!normalized) return;
		setCart((current) => current.map((item) => item.id === productId
			? { ...item, quantity: normalized }
			: item));
	};

	const clearCart = useCallback(() => setCart([]), []);
	const getCartTotal = () => cart.reduce((total, item) => total + item.price * item.quantity, 0);
	const getCartCount = () => cart.reduce((count, item) => count + item.quantity, 0);

	const value = {
		cart,
		addToCart,
		removeFromCart,
		updateQuantity,
		clearCart,
		getCartTotal,
		getCartCount,
	};

	return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
