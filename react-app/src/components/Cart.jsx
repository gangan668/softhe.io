import { Link } from 'react-router-dom';
import { useCart } from '../context/useCart';
import { trackEvent } from '../utils/analytics';
import './Cart.css';

function Cart({ isOpen, onClose }) {
	const { cart, removeFromCart, updateQuantity, getCartTotal, getCartCount } = useCart();

	const handleCheckout = () => {
		if (cart.length === 0) return;

		trackEvent('cart_checkout_click', {
			items: cart.map((item) => item.id).join(','),
			value: getCartTotal(),
			currency: 'EUR',
		});

		window.location.href = '/checkout';
	};

	return (
		<>
			{/* Backdrop */}
			<div
				className={`cart-backdrop ${isOpen ? 'active' : ''}`}
				onClick={onClose}
				aria-hidden={!isOpen}
			/>

			{/* Cart Sidebar */}
			<div
				className={`cart-sidebar ${isOpen ? 'open' : ''}`}
				role="dialog"
				aria-modal="true"
				aria-label="Shopping cart"
				aria-hidden={!isOpen}
			>
				<div className="cart-header">
					<h2>
						<i className="fas fa-shopping-cart"></i>
						Shopping Cart
						{getCartCount() > 0 && (
							<span className="cart-count-badge">{getCartCount()}</span>
						)}
					</h2>
					<button
						className="cart-close-btn"
						onClick={onClose}
						aria-label="Close cart"
					>
						<i className="fas fa-times"></i>
					</button>
				</div>

				<div className="cart-content">
					{cart.length === 0 ? (
						<div className="cart-empty">
							<i className="fas fa-shopping-cart"></i>
							<p>Your cart is empty</p>
							<Link to="/store" className="btn btn-primary" onClick={onClose}>
								Browse Products
							</Link>
						</div>
					) : (
						<>
							<div className="cart-items">
								{cart.map((item) => (
									<div key={item.id} className="cart-item">
										<div className="cart-item-icon">
											<i className={item.icon}></i>
										</div>
										<div className="cart-item-details">
											<h3>{item.name}</h3>
											<p className="cart-item-price">€{item.price}</p>
											<div className="cart-item-quantity">
												<button
													onClick={() => updateQuantity(item.id, item.quantity - 1)}
													aria-label="Decrease quantity"
													className="quantity-btn"
												>
													<i className="fas fa-minus"></i>
												</button>
												<span className="quantity-display">{item.quantity}</span>
												<button
													onClick={() => updateQuantity(item.id, item.quantity + 1)}
													aria-label="Increase quantity"
													className="quantity-btn"
												>
													<i className="fas fa-plus"></i>
												</button>
											</div>
										</div>
										<button
											className="cart-item-remove"
											onClick={() => removeFromCart(item.id)}
											aria-label={`Remove ${item.name} from cart`}
										>
											<i className="fas fa-trash"></i>
										</button>
									</div>
								))}
							</div>

							<div className="cart-footer">
								<div className="cart-total">
									<span>Subtotal:</span>
									<span className="total-amount">€{getCartTotal()}</span>
								</div>

								{cart.length > 1 && (
									<div className="bundle-discount-notice">
										<i className="fas fa-tag"></i>
										<span>Multiple items selected!</span>
									</div>
								)}

								<button
									className="btn btn-primary btn-checkout"
									onClick={handleCheckout}
								>
									<i className="fas fa-lock"></i>
									Proceed to Checkout
								</button>

								<p className="secure-notice">
									<i className="fas fa-shield-alt"></i>
									Secure checkout powered by Stripe
								</p>
							</div>
						</>
					)}
				</div>
			</div>
		</>
	);
}

export default Cart;
