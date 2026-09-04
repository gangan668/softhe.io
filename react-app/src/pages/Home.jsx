import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { absoluteUrl, siteConfig } from '../config/site';
import './Home.css';

function Home() {
	return (
		<>
			<SEO
				title="Softhe.io - PC Optimization for Competitive Gaming"
				description="Custom Windows ISOs, BIOS tuning, and PC optimization support for competitive gaming setups. See benchmark screenshots, products, and compatibility details."
				keywords="pc optimization, gaming optimization, fps boost, custom windows iso, bios optimization, esports performance, competitive gaming, windows optimization, gaming pc tuning"
				ogTitle="Softhe.io - PC Optimization for Competitive Gaming"
				ogDescription="Lean Windows builds, BIOS tuning, and benchmark-led optimization services for gaming PCs."
				ogImage={absoluteUrl('/images/cs2-optimized-capframex.svg')}
				structuredData={{
					"@context": "https://schema.org",
					"@type": "Organization",
					name: siteConfig.name,
					url: siteConfig.url,
					logo: absoluteUrl('/images/terminal-solid.svg'),
					sameAs: [
						siteConfig.social.twitter,
						siteConfig.social.github,
						siteConfig.social.youtube,
					],
					contactPoint: {
						"@type": "ContactPoint",
						email: siteConfig.supportEmail,
						contactType: "Customer Support",
					},
				}}
			/>
			<div className="home">
				<header className="hero">
					<div className="hero-container">
						<div className="hero-content">
							<div className="hero-kicker">
								<span className="status-dot"></span>
								Windows and BIOS tuning for competitive PCs
							</div>
							<h1 className="hero-title">
								Tune the machine. <span className="gradient-text">Raise the ceiling.</span>
							</h1>
							<p className="hero-description">
								Softhe.io builds lean Windows installs and hardware-aware BIOS profiles for players
								who care about stable frame rates, lower overhead, and cleaner input response.
							</p>
							<div className="hero-buttons">
								<Link to="/store" className="btn btn-primary">
									View Products
									<i className="fas fa-arrow-right" aria-hidden="true"></i>
								</Link>
								<Link to="/performance" className="btn btn-secondary">
									See Benchmarks
								</Link>
							</div>
							<div className="hero-proof">
								<span>Custom Windows ISOs</span>
								<span>BIOS optimization</span>
								<span>Remote support</span>
							</div>
						</div>
						<div className="hero-visual" aria-label="Performance comparison preview">
							<div className="benchmark-panel">
								<div className="panel-topline">
									<div>
										<span className="panel-eyebrow">Measured result</span>
										<strong>CS2 · Dust 2 benchmark</strong>
									</div>
									<span className="live-pill">2-run median</span>
								</div>
								<div className="result-stage">
									<div className="result-column result-before">
										<span className="result-label">Before</span>
										<span className="result-profile">Default Windows</span>
										<div className="result-number">658</div>
										<span className="result-unit">average FPS</span>
									</div>
									<div className="result-gain" aria-label="25 percent higher average FPS">
										<i className="fas fa-arrow-right" aria-hidden="true"></i>
										<strong>+25%</strong>
										<span>avg FPS</span>
									</div>
									<div className="result-column result-after">
										<span className="result-label">After</span>
										<span className="result-profile">SoftheOS + BIOS</span>
										<div className="result-number">826</div>
										<span className="result-unit">average FPS</span>
									</div>
								</div>
								<div className="result-details">
									<div>
										<span>1% low</span>
										<strong><span>225</span><i className="fas fa-arrow-right" aria-hidden="true"></i>285 FPS</strong>
									</div>
									<div>
										<span>Average frame time</span>
										<strong><span>1.52</span><i className="fas fa-arrow-right" aria-hidden="true"></i>1.21 ms</strong>
									</div>
									<div>
										<span>Capture</span>
										<strong>2 × 109 sec</strong>
									</div>
								</div>
								<p className="result-note">Same hardware and in-game settings. Whole-configuration comparison; individual results vary.</p>
							</div>
						</div>
					</div>
				</header>

				<section className="proof-strip" aria-label="Optimization results">
					<div className="container proof-grid">
						<div>
							<strong>+25%</strong>
							<span>Average FPS in tested CS2 run</span>
						</div>
						<div>
							<strong>-20%</strong>
							<span>Frame time reduction</span>
						</div>
						<div>
							<strong>31</strong>
							<span>Idle process target shown in benchmark</span>
						</div>
						<div>
							<strong>14 days</strong>
							<span>Refund window listed in FAQ</span>
						</div>
					</div>
				</section>

				<section className="performance-preview">
					<div className="container preview-grid">
						<div className="preview-copy">
							<span className="section-kicker">Evidence first</span>
							<h2>Show the difference before asking people to buy.</h2>
							<p>
								The benchmark page documents the measured comparison so visitors can see what
								changed, how the result was produced, and which limitations apply.
							</p>
							<Link to="/performance" className="text-link">
								Review full performance data
								<i className="fas fa-arrow-right" aria-hidden="true"></i>
							</Link>
						</div>
						<div className="comparison-card">
							<div className="comparison-row">
								<span>Stock Windows</span>
								<strong className="negative">658 FPS</strong>
							</div>
							<div className="comparison-row featured">
								<span>Softhe.io Optimized</span>
								<strong>826 FPS</strong>
							</div>
							<div className="comparison-footnote">
								Results from the documented test configuration; individual systems will vary.
							</div>
						</div>
					</div>
				</section>

				<section className="trust-preview" aria-labelledby="trust-preview-title">
					<div className="container">
						<div className="section-heading">
							<span className="section-kicker">Buyer confidence</span>
							<h2 id="trust-preview-title" className="section-title">Clear expectations before checkout</h2>
						</div>
						<div className="trust-preview-grid">
							<div className="trust-preview-item">
								<i className="fas fa-lock" aria-hidden="true"></i>
								<h3>Secure Stripe checkout</h3>
								<p>Prices and bundle discounts are validated on the server before Stripe handles card and wallet payment.</p>
							</div>
							<div className="trust-preview-item">
								<i className="fas fa-rotate-left" aria-hidden="true"></i>
								<h3>14-day refund window</h3>
								<p>The refund policy is documented in the FAQ so buyers can review terms before ordering.</p>
							</div>
							<div className="trust-preview-item">
								<i className="fas fa-headset" aria-hidden="true"></i>
								<h3>Pre-purchase support</h3>
								<p>Compatibility questions can go through email or Discord before committing to an ISO or BIOS service.</p>
							</div>
						</div>
					</div>
				</section>

				<section className="features">
					<div className="container">
						<div className="section-heading">
							<span className="section-kicker">What gets tuned</span>
							<h2 className="section-title">A cleaner path to stable performance</h2>
						</div>
						<div className="features-grid">
							<div className="feature-card">
								<div className="feature-icon">
									<i className="fas fa-layer-group"></i>
								</div>
								<h3>Lean Windows Builds</h3>
								<p>Reduced bloat, lower idle overhead, and gaming-focused defaults without hiding the Windows license requirement.</p>
							</div>
							<div className="feature-card">
								<div className="feature-icon">
									<i className="fas fa-microchip"></i>
								</div>
								<h3>Hardware-Aware BIOS</h3>
								<p>Memory, CPU, boot, and power settings adjusted around the hardware you actually run.</p>
							</div>
							<div className="feature-card">
								<div className="feature-icon">
									<i className="fas fa-chart-line"></i>
								</div>
								<h3>Benchmark-Led Proof</h3>
								<p>Before and after screenshots give the sales flow something concrete to point at.</p>
							</div>
							<div className="feature-card">
								<div className="feature-icon">
									<i className="fas fa-headset"></i>
								</div>
								<h3>Direct Setup Support</h3>
								<p>Email and Discord support help users choose the right product and complete setup with fewer dead ends.</p>
							</div>
						</div>
					</div>
				</section>

				<section className="cta">
					<div className="container">
						<div className="cta-content">
							<span className="section-kicker">Ready for the next step?</span>
							<h2>Choose the optimization path that fits your setup.</h2>
							<p>Start with a Windows ISO, add BIOS tuning when your hardware needs deeper work, or contact support for compatibility questions.</p>
							<div className="cta-actions">
								<Link to="/store" className="btn btn-primary">Open Store</Link>
								<Link to="/contact" className="btn btn-secondary">Ask Before Buying</Link>
							</div>
						</div>
					</div>
				</section>
			</div>
		</>
	);
}

export default Home;
