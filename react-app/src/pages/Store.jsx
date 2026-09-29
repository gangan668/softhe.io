import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { absoluteUrl } from '../config/site';
import { useCart } from '../context/useCart';
import SEO from '../components/SEO';
import { trackEvent } from '../utils/analytics';
import { PRODUCTS as products } from '../data/products';
import { verifyCheckoutSession } from '../utils/checkout';
import { commerceEnabled } from '../utils/runtimeConfig';
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
	const checkoutDisplayStatus = checkoutStatus ?? (
		checkoutQuery === 'success'
			? checkoutSessionId
				? { type: 'pending', message: 'Verifying your payment with Stripe…' }
				: { type: 'error', message: 'We could not verify this checkout. Your cart has been kept.' }
			: null
	);

	useEffect(() => {
		let timer;
		const scrollToProduct = () => {
			let productId;
			try {
				productId = decodeURIComponent(window.location.hash.slice(1));
			} catch {
				return;
			}
			if (!products.some((product) => product.id === productId)) return;
			window.clearTimeout(timer);
			timer = window.setTimeout(() => {
				const card = document.getElementById(productId);
				if (card) window.scrollTo({ top: card.getBoundingClientRect().top + window.scrollY - 90, behavior: 'instant' });
			}, 0);
		};
		scrollToProduct();
		window.addEventListener('hashchange', scrollToProduct);
		return () => {
			window.clearTimeout(timer);
			window.removeEventListener('hashchange', scrollToProduct);
		};
	}, []);

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
		if (!sessionId) return undefined;

		let active = true;
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
		if (!commerceEnabled) return;
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
				title="Windows builds and BIOS tuning | Softhe.io store"
				description="Compare custom Windows builds and BIOS tuning for gaming PCs. Products start at €50 and include clear scope and compatibility guidance."
				keywords="buy windows iso, custom windows, bios optimization service, gaming pc products, windows optimization, pc optimization store"
				ogTitle="Windows builds and BIOS tuning | Softhe.io"
				ogDescription="Compare the price, scope, and hardware fit of each Softhe.io product."
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
							...(commerceEnabled ? { offers: {
								"@type": "Offer",
								price: product.price,
								priceCurrency: "EUR",
								availability: "https://schema.org/InStock",
								url: `${absoluteUrl('/store')}#${product.id}`,
							} } : {}),
						},
					})),
				}}
			/>
			<div className="store-page">
				{!commerceEnabled && (
					<div className="checkout-result checkout-result-pending" role="status">
						<div className="container">
							<strong>Online ordering is unavailable</strong>
							<span>You can review products and prices here. Contact us with your hardware details if you have questions.</span>
							<Link to="/contact" className="status-contact-link">Ask about an order</Link>
						</div>
					</div>
				)}
				{checkoutDisplayStatus && (
					<div className={`checkout-result checkout-result-${checkoutDisplayStatus.type}`} role={checkoutDisplayStatus.type === 'error' ? 'alert' : 'status'}>
						<div className="container">
							<strong>{checkoutDisplayStatus.type === 'success' ? 'Order confirmed' : checkoutDisplayStatus.type === 'error' ? 'Verification needed' : 'Checking your order'}</strong>
							<span>{checkoutDisplayStatus.message}</span>
						</div>
					</div>
				)}
				<section className="page-header">
					<div className="container">
						<h1>Store</h1>
						<p>Compare each product by price, included work, and hardware fit.{!commerceEnabled && ' Online ordering is currently unavailable.'}</p>
					</div>
				</section>

				<section className="store">
					<div className="container">
						<div className="store-intro">
							<div>
								<span className="section-kicker">Products</span>
								<h2>Choose Windows, BIOS tuning, or both.</h2>
								<p>
									Choose a Windows build for operating-system changes or BIOS tuning for firmware
								and memory settings. {commerceEnabled ? 'The server checks the order before Stripe opens.' : 'Online ordering is currently unavailable.'}
								</p>
							</div>
							<div className="store-trust">
								{commerceEnabled && <div>
									<strong>Stripe</strong>
									<span>Secure hosted checkout</span>
								</div>}
								<div>
									<strong>Withdrawal</strong>
									<span>Online request available</span>
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
								<h3>See the limits of the preliminary CS2 comparison.</h3>
								<p>
									One PC measured 658 and 826 average FPS across two configurations. Windows edition,
									memory settings, and GPU driver changed. Raw runs are not yet published.
								</p>
							</div>
							<a href="/performance" className="proof-link">
								Read the benchmark details
								<i className="fas fa-arrow-right" aria-hidden="true"></i>
							</a>
						</div>

						<div className="product-finder">
							<div>
								<span className="section-kicker">Quick fit</span>
							<h3>Find the closest match for your PC</h3>
							<p>Choose the statement that matches your requirement. Contact support if none of them fit.</p>
							</div>
							<div className="finder-controls" role="group" aria-label="Product recommendation options">
								<button
									type="button"
									className={quizChoice === 'windows-10' ? 'active' : ''}
									onClick={() => handleQuizChoice('windows-10', 'competitive_windows_baseline')}
								>
									I want a streamlined Windows 10 build
								</button>
								<button
									type="button"
									className={quizChoice === 'windows-11' ? 'active' : ''}
									onClick={() => handleQuizChoice('windows-11', 'newer_pc_windows_11')}
								>
									My PC requires Windows 11
								</button>
								<button
									type="button"
									className={quizChoice === 'bios-optimization' ? 'active' : ''}
									onClick={() => handleQuizChoice('bios-optimization', 'untuned_hardware')}
								>
									I need my BIOS and memory settings checked
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
								<div key={product.id} id={product.id} className="product-card">
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
											{commerceEnabled ? (
												<>
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
												</>
											) : (
												<span className="product-unavailable" role="status">Ordering temporarily unavailable</span>
											)}
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
									<span>{commerceEnabled ? 'Product prices and quantities are verified before Stripe opens.' : 'Checkout activates only after server and legal readiness checks pass.'}</span>
								</div>
							</div>
							<div className="assurance-item">
								<i className="fas fa-tags" aria-hidden="true"></i>
								<div>
									<strong>Bundle discounts</strong>
									<span>Two products save 5%; three products save 10% at checkout.</span>
								</div>
							</div>
							<div className="assurance-item">
								<i className="fas fa-circle-question" aria-hidden="true"></i>
								<div>
									<strong>Ask before ordering</strong>
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
