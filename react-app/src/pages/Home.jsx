import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
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
				ogImage="https://softhe.io/images/cs2-optimized-fps.webp"
				structuredData={{
					"@context": "https://schema.org",
					"@type": "Organization",
					name: "Softhe.io",
					url: "https://softhe.io",
					logo: "https://softhe.io/images/terminal-solid.svg",
					sameAs: [
						"https://x.com/SoftheCS",
						"https://github.com/Softhe",
						"https://www.youtube.com/@softhe",
					],
					contactPoint: {
						"@type": "ContactPoint",
						email: "support@softhe.io",
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
									<span>CS2 benchmark sample</span>
									<span className="live-pill">Optimized</span>
								</div>
								<div className="fps-readout">
									<div>
										<span className="readout-label">Stock</span>
										<strong>670</strong>
										<span>avg FPS</span>
									</div>
									<div className="readout-divider"></div>
									<div>
										<span className="readout-label">Softhe.io</span>
										<strong>932</strong>
										<span>avg FPS</span>
									</div>
								</div>
								<div className="metric-bars">
									<div className="metric-bar">
										<span>Frame time</span>
										<div className="bar-track"><span style={{ width: '64%' }}></span></div>
										<strong>-36%</strong>
									</div>
									<div className="metric-bar">
										<span>Processes</span>
										<div className="bar-track"><span style={{ width: '28%' }}></span></div>
										<strong>-72%</strong>
									</div>
									<div className="metric-bar">
										<span>RAM idle use</span>
										<div className="bar-track"><span style={{ width: '32%' }}></span></div>
										<strong>0.8 GB</strong>
									</div>
								</div>
								<img
									src="/images/cs2-optimized-fps.webp"
									alt="Counter-Strike 2 optimized FPS benchmark"
									className="hero-screenshot"
									width="1024"
									height="576"
								/>
							</div>
							<div className="floating-metric">
								<span>Background processes</span>
								<strong>111 to 31</strong>
							</div>
						</div>
					</div>
				</header>

				<section className="proof-strip" aria-label="Optimization results">
					<div className="container proof-grid">
						<div>
							<strong>+40%</strong>
							<span>Average FPS in tested CS2 run</span>
						</div>
						<div>
							<strong>-36%</strong>
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
								The strongest page on the site is the benchmark page. Phase 1 brings that proof
								into the homepage so visitors immediately see what changed and where the numbers
								come from.
							</p>
							<Link to="/performance" className="text-link">
								Review full performance data
								<i className="fas fa-arrow-right" aria-hidden="true"></i>
							</Link>
						</div>
						<div className="comparison-card">
							<div className="comparison-row">
								<span>Stock Windows</span>
								<strong className="negative">670 FPS</strong>
							</div>
							<div className="comparison-row featured">
								<span>Softhe.io Optimized</span>
								<strong>932 FPS</strong>
							</div>
							<div className="comparison-footnote">
								Same hardware comparison from the current benchmark screenshots.
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
								<h3>Stripe payment links</h3>
								<p>Single products use direct Stripe checkout links with card and wallet support handled by Stripe.</p>
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
