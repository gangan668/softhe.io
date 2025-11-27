import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
	const [cart, setCart] = useState(() => {
		// Load cart from localStorage on initialization
		const savedCart = localStorage.getItem('softhe_cart');
		return savedCart ? JSON.parse(savedCart) : [];
	});

	// Save cart to localStorage whenever it changes
	useEffect(() => {
		localStorage.setItem('softhe_cart', JSON.stringify(cart));
	}, [cart]);

	const addToCart = (product) => {
		setCart((prevCart) => {
			// Check if product already exists in cart
			const existingItem = prevCart.find((item) => item.id === product.id);

			if (existingItem) {
				// Increase quantity if product exists
				return prevCart.map((item) =>
					item.id === product.id
						? { ...item, quantity: item.quantity + 1 }
						: item
				);
			} else {
				// Add new product with quantity 1
				return [...prevCart, { ...product, quantity: 1 }];
			}
		});
	};

	const removeFromCart = (productId) => {
		setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
	};

	const updateQuantity = (productId, quantity) => {
		if (quantity <= 0) {
			removeFromCart(productId);
			return;
		}

		setCart((prevCart) =>
			prevCart.map((item) =>
				item.id === productId ? { ...item, quantity } : item
			)
		);
	};

	const clearCart = () => {
		setCart([]);
	};

	const getCartTotal = () => {
		return cart.reduce((total, item) => total + item.price * item.quantity, 0);
	};

	const getCartCount = () => {
		return cart.reduce((count, item) => count + item.quantity, 0);
	};

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

export function useCart() {
	const context = useContext(CartContext);
	if (context === undefined) {
		throw new Error('useCart must be used within a CartProvider');
	}
	return context;
}

export default CartContext;
