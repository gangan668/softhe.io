import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/useCart';
import SEO from '../components/SEO';
import './Checkout.css';

function Checkout() {
	const { cart, removeFromCart, updateQuantity, getCartTotal } = useCart();
	const navigate = useNavigate();

	useEffect(() => {
		// Redirect to store if cart is empty
		if (cart.length === 0) {
			navigate('/store');
		}
	}, [cart.length, navigate]);

	const handleCheckout = () => {
		// Calculate bundle discount (5% off for 2 items, 10% off for 3+ items)
		const discount = cart.length >= 3 ? 0.10 : cart.length >= 2 ? 0.05 : 0;
		const subtotal = getCartTotal();
		const discountAmount = subtotal * discount;
		const total = subtotal - discountAmount;

		// In a production environment, this would create a Stripe Checkout Session
		// with all the products and apply the bundle discount

		// For now, we'll show an alert with the order details
		alert(
			`Order Summary:\n\n` +
			cart.map(item => `${item.name} x${item.quantity} - €${item.price * item.quantity}`).join('\n') +
			`\n\nSubtotal: €${subtotal}\n` +
			(discount > 0 ? `Bundle Discount (${discount * 100}%): -€${discountAmount.toFixed(2)}\n` : '') +
			`Total: €${total.toFixed(2)}\n\n` +
			`This would redirect to Stripe Checkout in production.`
		);

		// In production, redirect to Stripe or process payment
		// For now, just clear the cart and redirect to home
		// clearCart();
		// navigate('/');
	};

	if (cart.length === 0) {
		return null; // Will redirect via useEffect
	}

	const subtotal = getCartTotal();
	const discount = cart.length >= 3 ? 0.10 : cart.length >= 2 ? 0.05 : 0;
	const discountAmount = subtotal * discount;
	const total = subtotal - discountAmount;

	return (
		<>
			<SEO
				title="Checkout - Complete Your Order | Softhe.io"
				description="Complete your purchase of premium PC optimization products. Secure checkout with bundle discounts available."
				keywords="checkout, buy pc optimization, secure payment, bundle discount"
			/>
			<div className="checkout-page">
				<section className="page-header">
					<div className="container">
						<h1>Checkout</h1>
						<p>Review your order and complete your purchase</p>
					</div>
				</section>

				<section className="checkout-content">
					<div className="container">
						<div className="checkout-grid">
							{/* Order Summary */}
							<div className="order-summary">
								<h2>
									<i className="fas fa-shopping-bag"></i>
									Order Summary
								</h2>

								<div className="order-items">
									{cart.map((item) => (
										<div key={item.id} className="order-item">
											<div className="item-icon">
												<i className={item.icon}></i>
											</div>
											<div className="item-details">
												<h3>{item.name}</h3>
												<p className="item-price">€{item.price} each</p>
											</div>
											<div className="item-quantity">
												<button
													onClick={() => updateQuantity(item.id, item.quantity - 1)}
													aria-label="Decrease quantity"
													className="qty-btn"
												>
													<i className="fas fa-minus"></i>
												</button>
												<span>{item.quantity}</span>
												<button
													onClick={() => updateQuantity(item.id, item.quantity + 1)}
													aria-label="Increase quantity"
													className="qty-btn"
												>
													<i className="fas fa-plus"></i>
												</button>
											</div>
											<div className="item-total">
												€{item.price * item.quantity}
											</div>
											<button
												className="remove-btn"
												onClick={() => removeFromCart(item.id)}
												aria-label={`Remove ${item.name}`}
											>
												<i className="fas fa-trash"></i>
											</button>
										</div>
									))}
								</div>

								{/* Bundle Discount Banner */}
								{discount > 0 && (
									<div className="bundle-banner">
										<i className="fas fa-gift"></i>
										<div>
											<strong>Bundle Discount Applied!</strong>
											<p>You're saving {discount * 100}% on your order</p>
										</div>
									</div>
								)}

								{cart.length === 1 && (
									<div className="bundle-info">
										<i className="fas fa-info-circle"></i>
										<p>Add one more product to get 5% off your entire order!</p>
									</div>
								)}
							</div>

							{/* Payment Summary */}
							<div className="payment-summary">
								<h2>
									<i className="fas fa-credit-card"></i>
									Payment Summary
								</h2>

								<div className="summary-details">
									<div className="summary-row">
										<span>Subtotal</span>
										<span>€{subtotal.toFixed(2)}</span>
									</div>

									{discount > 0 && (
										<div className="summary-row discount">
											<span>Bundle Discount ({discount * 100}%)</span>
											<span>-€{discountAmount.toFixed(2)}</span>
										</div>
									)}

									<div className="summary-row total">
										<span>Total</span>
										<span>€{total.toFixed(2)}</span>
									</div>
								</div>

								<button
									className="btn btn-primary btn-checkout-full"
									onClick={handleCheckout}
								>
									<i className="fas fa-lock"></i>
									Proceed to Payment
								</button>

								<div className="payment-features">
									<div className="feature">
										<i className="fas fa-shield-alt"></i>
										<span>Secure Checkout</span>
									</div>
									<div className="feature">
										<i className="fab fa-stripe"></i>
										<span>Powered by Stripe</span>
									</div>
									<div className="feature">
										<i className="fas fa-undo"></i>
										<span>30-Day Guarantee</span>
									</div>
								</div>

								<div className="accepted-payments">
									<p>We accept:</p>
									<div className="payment-icons">
										<i className="fab fa-cc-visa"></i>
										<i className="fab fa-cc-mastercard"></i>
										<i className="fab fa-cc-amex"></i>
										<i className="fab fa-cc-paypal"></i>
									</div>
								</div>

								<Link to="/store" className="continue-shopping">
									<i className="fas fa-arrow-left"></i>
									Continue Shopping
								</Link>
							</div>
						</div>

						{/* Trust Badges */}
						<div className="trust-section">
							<h3>Why Shop With Softhe.io?</h3>
							<div className="trust-badges">
								<div className="trust-badge">
									<i className="fas fa-certificate"></i>
									<h4>Professional Quality</h4>
									<p>Premium optimization products used by esports professionals</p>
								</div>
								<div className="trust-badge">
									<i className="fas fa-headset"></i>
									<h4>Expert Support</h4>
									<p>24/7 support from PC optimization specialists</p>
								</div>
								<div className="trust-badge">
									<i className="fas fa-lock"></i>
									<h4>Secure Payment</h4>
									<p>Industry-standard encryption and secure checkout</p>
								</div>
								<div className="trust-badge">
									<i className="fas fa-check-circle"></i>
									<h4>Guaranteed Results</h4>
									<p>30-day money-back guarantee if not satisfied</p>
								</div>
							</div>
						</div>
					</div>
				</section>
			</div>
		</>
	);
}

export default Checkout;
