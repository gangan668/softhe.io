import { useState } from 'react';
import { useCart } from '../context/useCart';
import SEO from '../components/SEO';
import { trackEvent } from '../utils/analytics';
import { STRIPE_PRODUCT_URLS, openExternalUrl } from '../utils/products';
import './Store.css';

function Store() {
	const { addToCart } = useCart();
	const [addedToCart, setAddedToCart] = useState(null);
	const [quizChoice, setQuizChoice] = useState('windows-10');

	const products = [
		{
			id: 'windows-10',
			name: 'Custom Windows 10 ISO',
			price: 65,
			description: 'Our custom Windows Enterprise ISO is built for ultimate speed and no bloat. Experience gaming as it should be.',
			bestFor: 'Competitive FPS players who want maximum compatibility and low overhead.',
			features: [
				'Zero bloatware',
				'Gaming optimizations',
				'Minimal background tasks',
				'Updates until EOL 2027'
			],
			icon: 'fab fa-windows',
			badge: 'Best Seller',
			stripeUrl: STRIPE_PRODUCT_URLS['windows-10']
		},
		{
			id: 'windows-11',
			name: 'Custom Windows 11 ISO',
			price: 75,
			description: 'Latest Windows 11 for next-gen gaming performance and DirectX 12 Ultimate support.',
			bestFor: 'Newer systems that need current Windows 11 gaming features.',
			features: [
				'DirectX 12 Ultimate',
				'Auto HDR support',
				'Optimizations for windowed fullscreen',
				'Regular updates'
			],
			icon: 'fab fa-windows',
			badge: null,
			stripeUrl: STRIPE_PRODUCT_URLS['windows-11']
		},
		{
			id: 'bios-optimization',
			name: 'BIOS Optimization Service',
			price: 50,
			description: 'Professional BIOS tuning service to unlock your hardware\'s maximum potential with expert configurations.',
			bestFor: 'Systems with strong hardware that still show stutter, inconsistent lows, or untuned memory.',
			features: [
				'CPU tuning',
				'GPU tuning',
				'Stability testing',
				'Custom profiles'
			],
			icon: 'fas fa-microchip',
			badge: 'Popular',
			stripeUrl: STRIPE_PRODUCT_URLS['bios-optimization']
		}
	];

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
		trackEvent('begin_checkout', {
			item_id: product.id,
			item_name: product.name,
			value: product.price,
			currency: 'EUR',
		});
		openExternalUrl(product.stripeUrl);
	};

	const recommendedProduct = products.find((product) => product.id === quizChoice) || products[0];

	return (
		<>
			<SEO
				title="Store - PC Optimization Products | Softhe.io"
				description="Shop custom Windows ISOs and BIOS optimization services for competitive gaming PCs. Products start at €50 with Stripe payment links."
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
								url: product.stripeUrl,
							},
						},
					})),
				}}
			/>
			<div className="store-page">
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
									or buy directly through Stripe when you already know what you need.
								</p>
							</div>
							<div className="store-trust">
								<div>
									<strong>Stripe</strong>
									<span>Secure payment links</span>
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
									onClick={() => setQuizChoice('windows-10')}
								>
									I want a clean competitive Windows baseline
								</button>
								<button
									type="button"
									className={quizChoice === 'windows-11' ? 'active' : ''}
									onClick={() => setQuizChoice('windows-11')}
								>
									My newer PC should stay on Windows 11
								</button>
								<button
									type="button"
									className={quizChoice === 'bios-optimization' ? 'active' : ''}
									onClick={() => setQuizChoice('bios-optimization')}
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
