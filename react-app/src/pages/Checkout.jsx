import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/useCart';
import SEO from '../components/SEO';
import { trackEvent } from '../utils/analytics';
import { STRIPE_PRODUCT_URLS, openExternalUrl } from '../utils/products';
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

	const handleSingleProductCheckout = (item) => {
		trackEvent('begin_checkout', {
			item_id: item.id,
			item_name: item.name,
			value: item.price,
			currency: 'EUR',
			source: 'checkout_page',
		});
		openExternalUrl(STRIPE_PRODUCT_URLS[item.id]);
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
				description="Review your selected PC optimization products and continue to payment."
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

								{cart.length === 1 ? (
									<button
										className="btn btn-primary btn-checkout-full"
										onClick={() => handleSingleProductCheckout(cart[0])}
									>
										<i className="fas fa-lock"></i>
										Pay Securely with Stripe
									</button>
								) : (
									<div className="static-checkout-notice">
										<i className="fas fa-circle-info" aria-hidden="true"></i>
										<div>
											<strong>Bundle checkout needs manual confirmation</strong>
											<p>
												This static site cannot create a combined Stripe Checkout Session.
												Use the individual payment buttons below or contact support for a
												bundle invoice.
											</p>
										</div>
									</div>
								)}

								{cart.length > 1 && (
									<div className="individual-payment-links">
										{cart.map((item) => (
											<button
												key={item.id}
												type="button"
												className="btn btn-secondary"
												onClick={() => handleSingleProductCheckout(item)}
											>
												Pay for {item.name}
											</button>
										))}
										<Link to="/contact" className="btn btn-primary">
											Request Bundle Invoice
										</Link>
									</div>
								)}

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
										<span>14-Day Refund Window</span>
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
									<p>Focused optimization products for competitive gaming PCs</p>
								</div>
								<div className="trust-badge">
									<i className="fas fa-headset"></i>
									<h4>Expert Support</h4>
									<p>Email and Discord help for product and setup questions</p>
								</div>
								<div className="trust-badge">
									<i className="fas fa-lock"></i>
									<h4>Secure Payment</h4>
									<p>Industry-standard encryption and secure checkout</p>
								</div>
								<div className="trust-badge">
									<i className="fas fa-check-circle"></i>
									<h4>Clear Refund Window</h4>
									<p>14-day refund policy documented in the FAQ</p>
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
