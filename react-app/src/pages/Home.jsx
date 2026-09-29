import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { absoluteUrl, siteConfig } from '../config/site';
import { commerceEnabled } from '../utils/runtimeConfig';
import './Home.css';

function Home() {
	return (
		<>
			<SEO
				title="Softhe.io | Windows and BIOS tuning for gaming PCs"
				description="Custom Windows builds and BIOS tuning for gaming PCs, with a documented whole-system CS2 sample, compatibility guidance, and setup support."
				keywords="pc optimization, gaming optimization, fps boost, custom windows iso, bios optimization, esports performance, competitive gaming, windows optimization, gaming pc tuning"
				ogTitle="Windows and BIOS tuning for gaming PCs | Softhe.io"
				ogDescription="Custom Windows builds and BIOS tuning, with a preliminary whole-system CS2 comparison and setup support."
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
								Windows and BIOS tuning for gaming PCs
							</div>
							<h1 className="hero-title">
								Cut Windows overhead. <span className="gradient-text">Tune the hardware.</span>
							</h1>
							<p className="hero-description">
								Softhe.io configures Windows and BIOS settings around your hardware and games.
								The goal is lower background use, steadier frame times, and a setup you can recover.
							</p>
							<div className="hero-buttons">
								<Link to="/store" className="btn btn-primary">
									Compare products
									<i className="fas fa-arrow-right" aria-hidden="true"></i>
								</Link>
								<Link to="/performance" className="btn btn-secondary">
									Check the results
								</Link>
							</div>
							<div className="hero-proof">
								<span>Custom Windows builds</span>
								<span>BIOS tuning</span>
								<span>Email and Discord support</span>
							</div>
						</div>
						<div className="hero-visual" aria-label="Performance comparison preview">
							<div className="benchmark-panel">
								<div className="panel-topline">
									<div>
									<span className="panel-eyebrow">Preliminary sample</span>
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
								<p className="result-note">One PC, with a different Windows edition, memory settings, and GPU driver. Raw runs are not yet published. This cannot isolate the effect of one product.</p>
							</div>
						</div>
					</div>
				</header>

				<section className="proof-strip" aria-label="Preliminary test summary">
					<div className="container proof-grid">
						<div>
							<strong>+25%</strong>
							<span>Average FPS in one whole-system CS2 comparison</span>
						</div>
						<div>
							<strong>-20%</strong>
							<span>Frame time change in the same comparison</span>
						</div>
						<div>
							<strong>31</strong>
							<span>Idle process target shown in benchmark</span>
						</div>
						<div>
							<strong>14 days</strong>
							<span>General statutory withdrawal period for eligible consumers; exceptions apply</span>
						</div>
					</div>
				</section>

				<section className="performance-preview">
					<div className="container preview-grid">
						<div className="preview-copy">
							<span className="section-kicker">Preliminary test data</span>
							<h2>Read the numbers and the test limits before you buy.</h2>
							<p>
								The sample compares two configurations of one PC. Windows edition, memory settings,
								and GPU driver changed. Raw run evidence is still unpublished, and the result cannot
								show what any one product contributed.
							</p>
							<Link to="/performance" className="text-link">
								Read the benchmark details
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
								Preliminary whole-system sample. Raw runs are not yet published.
							</div>
						</div>
					</div>
				</section>

				<section className="trust-preview" aria-labelledby="trust-preview-title">
					<div className="container">
						<div className="section-heading">
							<span className="section-kicker">Before you order</span>
							<h2 id="trust-preview-title" className="section-title">Know the price, terms, and compatibility first</h2>
						</div>
						<div className="trust-preview-grid">
							<div className="trust-preview-item">
								<i className="fas fa-lock" aria-hidden="true"></i>
								<h3>{commerceEnabled ? 'Secure Stripe checkout' : 'Online ordering is unavailable'}</h3>
								<p>{commerceEnabled ? 'The server checks product prices and bundle discounts before Stripe opens.' : 'Checkout will open after payment and legal readiness checks pass. You can compare products now.'}</p>
							</div>
							<div className="trust-preview-item">
								<i className="fas fa-rotate-left" aria-hidden="true"></i>
								<h3>Withdrawal rights</h3>
								<p>Eligible consumers generally have 14 days to withdraw. Digital delivery or work started at your request can affect that right. Read the terms before ordering.</p>
							</div>
							<div className="trust-preview-item">
								<i className="fas fa-headset" aria-hidden="true"></i>
								<h3>Pre-purchase support</h3>
								<p>Send your hardware list by email or Discord if you are unsure which option fits.</p>
							</div>
						</div>
					</div>
				</section>

				<section className="features">
					<div className="container">
						<div className="section-heading">
							<span className="section-kicker">What we change</span>
							<h2 className="section-title">Windows, firmware, and setup support</h2>
						</div>
						<div className="features-grid">
							<div className="feature-card">
								<div className="feature-icon">
									<i className="fas fa-layer-group"></i>
								</div>
								<h3>Lean Windows builds</h3>
								<p>Fewer preinstalled apps and gaming-focused defaults. You must supply a valid Windows licence.</p>
							</div>
							<div className="feature-card">
								<div className="feature-icon">
									<i className="fas fa-microchip"></i>
								</div>
								<h3>BIOS settings for your hardware</h3>
								<p>Memory, CPU, boot, and power settings matched to your motherboard and components.</p>
							</div>
							<div className="feature-card">
								<div className="feature-icon">
									<i className="fas fa-chart-line"></i>
								</div>
								<h3>Preliminary benchmark sample</h3>
								<p>The current CS2 comparison shows the measured change and identifies missing evidence.</p>
							</div>
							<div className="feature-card">
								<div className="feature-icon">
									<i className="fas fa-headset"></i>
								</div>
								<h3>Setup support</h3>
								<p>Use email or Discord for product selection, compatibility checks, and installation questions.</p>
							</div>
						</div>
					</div>
				</section>

				<section className="cta">
					<div className="container">
						<div className="cta-content">
							<span className="section-kicker">Choose a service</span>
							<h2>Start with the part of your PC that needs work.</h2>
							<p>Choose a Windows build, BIOS tuning, or send your hardware list if you need a compatibility check first.</p>
							<div className="cta-actions">
								<Link to="/store" className="btn btn-primary">Compare products</Link>
								<Link to="/contact" className="btn btn-secondary">Check compatibility</Link>
							</div>
						</div>
					</div>
				</section>
			</div>
		</>
	);
}

export default Home;
