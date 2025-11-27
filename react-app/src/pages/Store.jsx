import { useState } from 'react';
import { useCart } from '../context/CartContext';
import SEO from '../components/SEO';
import './Store.css';

function Store() {
	const { addToCart } = useCart();
	const [addedToCart, setAddedToCart] = useState(null);

	const products = [
		{
			id: 'windows-10',
			name: 'Custom Windows 10 ISO',
			price: 65,
			description: 'Our custom Windows Enterprise ISO is built for ultimate speed and no bloat. Experience gaming as it should be.',
			features: [
				'Zero bloatware',
				'Gaming optimizations',
				'Minimal background tasks',
				'Updates until EOL 2027'
			],
			icon: 'fab fa-windows',
			badge: 'Best Seller',
			stripeUrl: 'https://buy.stripe.com/7sY5kwg8AdMfcxm5ST28800'
		},
		{
			id: 'windows-11',
			name: 'Custom Windows 11 ISO',
			price: 75,
			description: 'Latest Windows 11 for next-gen gaming performance and DirectX 12 Ultimate support.',
			features: [
				'DirectX 12 Ultimate',
				'Auto HDR support',
				'Optimizations for windowed fullscreen',
				'Regular updates'
			],
			icon: 'fab fa-windows',
			badge: null,
			stripeUrl: 'https://buy.stripe.com/cNiaEQ9KcdMf2WMbdd28803'
		},
		{
			id: 'bios-optimization',
			name: 'BIOS Optimization Service',
			price: 50,
			description: 'Professional BIOS tuning service to unlock your hardware\'s maximum potential with expert configurations.',
			features: [
				'CPU tuning',
				'GPU tuning',
				'Stability testing',
				'Custom profiles'
			],
			icon: 'fas fa-microchip',
			badge: 'Popular',
			stripeUrl: 'https://buy.stripe.com/bJe9AMe0sfUn8h62GH28804'
		}
	];

	const handleAddToCart = (product) => {
		addToCart(product);
		setAddedToCart(product.id);
		setTimeout(() => setAddedToCart(null), 2000);
	};

	const handleBuyNow = (product) => {
		window.open(product.stripeUrl, '_blank');
	};

	return (
		<>
			<SEO
				title="Store - Premium PC Optimization Products | Softhe.io"
				description="Shop custom Windows ISOs and BIOS optimization services. Professional gaming PC optimization products starting at €50. Zero bloatware, maximum performance."
				keywords="buy windows iso, custom windows, bios optimization service, gaming pc products, windows optimization, pc optimization store"
				ogTitle="Shop Premium PC Optimization Products"
				ogDescription="Custom Windows 10/11 ISOs and BIOS optimization services for competitive gaming. Professional optimization products with proven results."
			/>
			<div className="store-page">
				<section className="page-header">
					<div className="container">
						<h1>Store</h1>
						<p>Premium optimization products for competitive gaming</p>
					</div>
				</section>

				<section className="store">
					<div className="container">
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
										<h3>{product.name}</h3>
										<p>{product.description}</p>
										<ul className="product-features">
											{product.features.map((feature, index) => (
												<li key={index}>{feature}</li>
											))}
										</ul>
										<div className="product-price">
											<span className="price">€{product.price}</span>
										</div>
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
					</div>
				</section>
			</div>
		</>
	);
}

export default Store;
