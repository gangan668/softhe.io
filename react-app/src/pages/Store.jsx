import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/useCart';
import SEO from '../components/SEO';
import { trackEvent } from '../utils/analytics';
import { PRODUCTS as products } from '../data/products';
import { verifyCheckoutSession } from '../utils/checkout';
import './Store.css';

function Store() {
	const { addToCart, clearCart } = useCart();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const checkoutQuery = searchParams.get('checkout');
	const checkoutSessionId = searchParams.get('session_id');
	const [addedToCart, setAddedToCart] = useState(null);
	const [quizChoice, setQuizChoice] = useState('windows-10');
	const [checkoutStatus, setCheckoutStatus] = useState(null);

	useEffect(() => {
		trackEvent('view_item_list', {
			item_list_name: 'store_products',
			items: products.map((product) => ({
				item_id: product.id,
				item_name: product.name,
				price: product.price,
				currency: 'EUR',
			})),
		});
	}, []);

	useEffect(() => {
		if (checkoutQuery !== 'success') return undefined;
		const sessionId = checkoutSessionId;
		if (!sessionId) {
			setCheckoutStatus({ type: 'error', message: 'We could not verify this checkout. Your cart has been kept.' });
			return undefined;
		}

		let active = true;
		setCheckoutStatus({ type: 'pending', message: 'Verifying your payment with Stripe…' });
		verifyCheckoutSession(sessionId)
			.then((session) => {
				if (!active) return;
				if (session.paid && session.status === 'complete') {
					clearCart();
					setCheckoutStatus({
						type: 'success',
						message: 'Payment confirmed. Your order is being prepared and a confirmation will be sent to you.',
					});
					trackEvent('purchase', {
						transaction_id: session.id,
						value: typeof session.amountTotal === 'number' ? session.amountTotal / 100 : undefined,
						currency: session.currency?.toUpperCase() || 'EUR',
						items: session.items?.map((item) => ({ item_id: item.id, quantity: item.quantity })),
					});
				} else {
					setCheckoutStatus({
						type: 'pending',
						message: 'Your payment is still processing. Your cart has been kept; refresh this page to check again.',
					});
				}
			})
			.catch((error) => {
				if (active) setCheckoutStatus({ type: 'error', message: `${error.message} Your cart has been kept.` });
			});
		return () => { active = false; };
	}, [checkoutQuery, checkoutSessionId, clearCart]);

	const handleAddToCart = (product) => {
		addToCart(product);
		trackEvent('add_to_cart', {
			item_id: product.id,
			item_name: product.name,
			value: product.price,
			currency: 'EUR',
		});
		setAddedToCart(product.id);
		setTimeout(() => setAddedToCart(null), 2000);
	};

	const handleBuyNow = (product) => {
		addToCart(product);
		trackEvent('begin_checkout', {
			item_id: product.id,
			item_name: product.name,
			value: product.price,
			currency: 'EUR',
		});
		navigate('/checkout');
	};

	const handleQuizChoice = (productId, reason) => {
		setQuizChoice(productId);
		trackEvent('product_recommendation_select', {
			item_id: productId,
			reason,
		});
	};

	const recommendedProduct = products.find((product) => product.id === quizChoice) || products[0];

	return (
		<>
			<SEO
				title="Store - PC Optimization Products | Softhe.io"
				description="Shop custom Windows ISOs and BIOS optimization services for competitive gaming PCs. Products start at €50 with secure Stripe checkout."
				keywords="buy windows iso, custom windows, bios optimization service, gaming pc products, windows optimization, pc optimization store"
				ogTitle="Shop PC Optimization Products"
				ogDescription="Custom Windows 10/11 ISOs and BIOS optimization services for competitive gaming setups."
				structuredData={{
					"@context": "https://schema.org",
					"@type": "ItemList",
					name: "Softhe.io PC Optimization Products",
					itemListElement: products.map((product, index) => ({
						"@type": "ListItem",
						position: index + 1,
						item: {
							"@type": "Product",
							name: product.name,
							description: product.description,
							offers: {
								"@type": "Offer",
								price: product.price,
								priceCurrency: "EUR",
								availability: "https://schema.org/InStock",
								url: `https://softhe.io/store#${product.id}`,
							},
						},
					})),
				}}
			/>
			<div className="store-page">
				{checkoutStatus && (
					<div className={`checkout-result checkout-result-${checkoutStatus.type}`} role={checkoutStatus.type === 'error' ? 'alert' : 'status'}>
						<div className="container">
							<strong>{checkoutStatus.type === 'success' ? 'Order confirmed' : checkoutStatus.type === 'error' ? 'Verification needed' : 'Checking your order'}</strong>
							<span>{checkoutStatus.message}</span>
						</div>
					</div>
				)}
				<section className="page-header">
					<div className="container">
						<h1>Store</h1>
						<p>Choose the optimization path that fits your system and support needs.</p>
					</div>
				</section>

				<section className="store">
					<div className="container">
						<div className="store-intro">
							<div>
								<span className="section-kicker">Products</span>
								<h2>Simple packages, clear outcomes.</h2>
								<p>
									Start with a lean Windows install, add BIOS tuning for deeper hardware work,
									then complete one server-validated Stripe checkout when you are ready.
								</p>
							</div>
							<div className="store-trust">
								<div>
									<strong>Stripe</strong>
									<span>Secure hosted checkout</span>
								</div>
								<div>
									<strong>14 days</strong>
									<span>Refund window in FAQ</span>
								</div>
								<div>
									<strong>Support</strong>
									<span>Email and Discord</span>
								</div>
							</div>
						</div>

						<div className="store-proof" aria-label="Benchmark evidence">
							<div>
								<span className="section-kicker">Benchmark context</span>
								<h3>Current test sample: 670 to 932 average FPS in CS2.</h3>
								<p>
									The store points buyers back to measured before/after screenshots so product
									choice is grounded in the available evidence.
								</p>
							</div>
							<a href="/performance" className="proof-link">
								Review benchmarks
								<i className="fas fa-arrow-right" aria-hidden="true"></i>
							</a>
						</div>

						<div className="product-finder">
							<div>
								<span className="section-kicker">Quick fit</span>
								<h3>Which product should I start with?</h3>
								<p>Pick the situation closest to your setup and use the recommendation as a starting point.</p>
							</div>
							<div className="finder-controls" role="group" aria-label="Product recommendation options">
								<button
									type="button"
									className={quizChoice === 'windows-10' ? 'active' : ''}
									onClick={() => handleQuizChoice('windows-10', 'competitive_windows_baseline')}
								>
									I want a clean competitive Windows baseline
								</button>
								<button
									type="button"
									className={quizChoice === 'windows-11' ? 'active' : ''}
									onClick={() => handleQuizChoice('windows-11', 'newer_pc_windows_11')}
								>
									My newer PC should stay on Windows 11
								</button>
								<button
									type="button"
									className={quizChoice === 'bios-optimization' ? 'active' : ''}
									onClick={() => handleQuizChoice('bios-optimization', 'untuned_hardware')}
								>
									My hardware feels untuned or inconsistent
								</button>
							</div>
							<div className="finder-result">
								<span>Recommended</span>
								<strong>{recommendedProduct.name}</strong>
								<p>{recommendedProduct.bestFor}</p>
							</div>
						</div>

						<div className="products-grid">
							{products.map((product) => (
								<div key={product.id} className="product-card">
									{product.badge && (
										<div className="product-badge">{product.badge}</div>
									)}
									<div className="product-image">
										<i className={product.icon}></i>
									</div>
									<div className="product-info">
										<div className="product-heading">
											<h3>{product.name}</h3>
											<div className="product-price">
												<span className="price">€{product.price}</span>
											</div>
										</div>
										<p>{product.description}</p>
										<div className="best-for">
											<span>Best for</span>
											<strong>{product.bestFor}</strong>
										</div>
										<ul className="product-features">
											{product.features.map((feature, index) => (
												<li key={index}>{feature}</li>
											))}
										</ul>
										<div className="product-actions">
											<button
												onClick={() => handleAddToCart(product)}
												className={`btn ${addedToCart === product.id ? 'btn-success' : 'btn-secondary'}`}
											>
												{addedToCart === product.id ? (
													<>
														<i className="fas fa-check"></i>
														Added to Cart
													</>
												) : (
													<>
														<i className="fas fa-cart-plus"></i>
														Add to Cart
													</>
												)}
											</button>
											<button
												onClick={() => handleBuyNow(product)}
												className="btn btn-primary"
											>
												<i className="fas fa-bolt"></i>
												Buy Now
											</button>
										</div>
									</div>
								</div>
							))}
						</div>

						<div className="store-assurance" aria-label="Store purchase confidence">
							<div className="assurance-item">
								<i className="fas fa-lock" aria-hidden="true"></i>
								<div>
									<strong>Server-validated checkout</strong>
									<span>Product prices and quantities are verified before Stripe opens.</span>
								</div>
							</div>
							<div className="assurance-item">
								<i className="fas fa-tags" aria-hidden="true"></i>
								<div>
									<strong>Automatic bundle discounts</strong>
									<span>Two products save 5%; three products save 10% at checkout.</span>
								</div>
							</div>
							<div className="assurance-item">
								<i className="fas fa-circle-question" aria-hidden="true"></i>
								<div>
									<strong>Compatibility check</strong>
									<span>Ask support before buying if hardware fit is unclear.</span>
								</div>
							</div>
						</div>

						<div className="store-note">
							<div>
								<i className="fas fa-circle-info" aria-hidden="true"></i>
								<span>Not sure which option fits your hardware?</span>
							</div>
							<a href="/contact">Ask before buying</a>
						</div>
					</div>
				</section>
			</div>
		</>
	);
}

export default Store;
