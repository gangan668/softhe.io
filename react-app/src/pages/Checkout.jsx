import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/useCart';
import SEO from '../components/SEO';
import { trackEvent } from '../utils/analytics';
import { createCheckoutSession } from '../utils/checkout';
import { commerceEnabled } from '../utils/runtimeConfig';
import './Checkout.css';

function Checkout() {
	const { cart, removeFromCart, updateQuantity, getCartTotal } = useCart();
	const navigate = useNavigate();
	const location = useLocation();
	const [isStartingCheckout, setIsStartingCheckout] = useState(false);
	const [checkoutError, setCheckoutError] = useState('');
	const [termsAccepted, setTermsAccepted] = useState(false);
	const [earlyPerformanceAccepted, setEarlyPerformanceAccepted] = useState(false);

	useEffect(() => {
		// Redirect to store if cart is empty
		if (cart.length === 0) {
			navigate('/store');
		}
	}, [cart.length, navigate]);

	const handleCheckout = async () => {
		if (!commerceEnabled) {
			setCheckoutError('Online checkout is not active yet. Contact support before ordering.');
			return;
		}
		setIsStartingCheckout(true);
		setCheckoutError('');
		trackEvent('begin_checkout', {
			items: cart.map((item) => ({ item_id: item.id, quantity: item.quantity })),
			value: getCartTotal(),
			currency: 'EUR',
			source: 'checkout_page',
		});

		try {
			const { url } = await createCheckoutSession(cart, {
				termsAccepted,
				earlyPerformanceRequested: earlyPerformanceAccepted,
				withdrawalAcknowledged: earlyPerformanceAccepted,
			});
			window.location.assign(url);
		} catch (error) {
			setCheckoutError(error.message);
			setIsStartingCheckout(false);
		}
	};

	if (cart.length === 0) {
		return null; // Will redirect via useEffect
	}

	const subtotal = getCartTotal();
	const discount = cart.length >= 3 ? 0.10 : cart.length >= 2 ? 0.05 : 0;
	const discountAmount = subtotal * discount;
	const total = subtotal - discountAmount;
	const hasBundle = cart.length > 1;

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
						{!commerceEnabled && (
							<div className="checkout-error checkout-cancelled" role="status">
								<i className="fas fa-circle-info" aria-hidden="true"></i>
								<span>Secure checkout is being activated. Contact support before placing an order.</span>
							</div>
						)}
						{new URLSearchParams(location.search).get('checkout') === 'cancelled' && (
							<div className="checkout-error checkout-cancelled" role="status">
								<i className="fas fa-circle-info" aria-hidden="true"></i>
								<span>Payment was cancelled. Nothing was charged, and your cart has been kept.</span>
							</div>
						)}
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
								{hasBundle && (
									<div className="bundle-banner">
										<i className="fas fa-gift"></i>
										<div>
											<strong>Bundle discount applied</strong>
											<p>
												Your {discount * 100}% discount is validated on the server and applied
												at Stripe Checkout.
											</p>
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

									{hasBundle && (
										<div className="summary-row discount">
										<span>Bundle discount ({discount * 100}%)</span>
											<span>-€{discountAmount.toFixed(2)}</span>
										</div>
									)}

								<div className="summary-row total">
										<span>Total (EUR, VAT treatment shown on receipt)</span>
										<span>€{total.toFixed(2)}</span>
									</div>
								</div>

								<label className="checkout-consent">
									<input
										type="checkbox"
										checked={termsAccepted}
										onChange={(event) => setTermsAccepted(event.target.checked)}
										disabled={!commerceEnabled || isStartingCheckout}
									/>
									<span>
										I agree to the <Link to="/terms">Terms of Service</Link> and refund information,
										and understand that digital delivery or service preparation may begin after payment.
									</span>
								</label>

								<label className="checkout-consent">
									<input
										type="checkbox"
										checked={earlyPerformanceAccepted}
										onChange={(event) => setEarlyPerformanceAccepted(event.target.checked)}
										disabled={!commerceEnabled || isStartingCheckout}
									/>
									<span>
										I expressly request digital delivery or service preparation to begin before the
										14-day withdrawal period ends, and acknowledge that the right of withdrawal can
										be reduced or lost after delivery or full performance. I have reviewed the{' '}
										<Link to="/withdrawal">withdrawal information</Link>.
									</span>
								</label>

								<button
									className="btn btn-primary btn-checkout-full"
									onClick={handleCheckout}
									disabled={isStartingCheckout || !commerceEnabled || !termsAccepted || !earlyPerformanceAccepted}
								>
									<i className={isStartingCheckout ? 'fas fa-spinner fa-spin' : 'fas fa-lock'}></i>
									{!commerceEnabled ? 'Checkout not yet active' : isStartingCheckout ? 'Opening secure checkout...' : 'Pay Securely with Stripe'}
								</button>

								{checkoutError && (
									<div className="checkout-error" role="alert">
										<i className="fas fa-circle-exclamation" aria-hidden="true"></i>
										<span>{checkoutError}</span>
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
										<span>Withdrawal and refund information</span>
									</div>
								</div>

							<div className="accepted-payments">
								<p>Available payment methods are displayed by Stripe and can vary by country and device.</p>
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
									<p>Withdrawal, complaint, and refund information remains available after purchase</p>
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


