import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import './Services.css';

const services = [
	{
		icon: 'fab fa-windows',
		title: 'Custom Windows Enterprise ISO',
		summary:
			'A lean Windows build for players who want fewer background tasks, gaming-focused defaults, and a cleaner install baseline.',
		bestFor: 'Fresh installs, competitive FPS setups, and PCs currently carrying unnecessary Windows overhead.',
		price: 'Starting at €65',
		features: [
			'Zero bloatware installation',
			'Gaming-focused registry and service tuning',
			'Privacy-conscious defaults',
			'Installation guidance and update notes',
		],
	},
	{
		icon: 'fas fa-microchip',
		title: 'Expert BIOS Optimization',
		summary:
			'Hardware-aware motherboard configuration focused on memory behavior, CPU settings, boot flow, and stable performance.',
		bestFor: 'High-refresh systems with inconsistent lows, untuned memory, or unclear BIOS defaults.',
		price: 'Starting at €75',
		features: [
			'Memory timing optimization',
			'CPU and power behavior tuning',
			'Unused feature cleanup',
			'Stability-oriented review',
		],
	},
	{
		icon: 'fas fa-tachometer-alt',
		title: 'Complete Performance Tuning',
		summary:
			'A combined service path for users who want Windows, BIOS, driver, and game-specific configuration handled together.',
		bestFor: 'Full rebuilds, new gaming PCs, or users who want one coordinated optimization pass.',
		price: 'Starting at €120',
		features: [
			'Custom Windows ISO installation',
			'BIOS optimization service',
			'Driver and software cleanup',
			'Game-specific configuration guidance',
		],
	},
	{
		icon: 'fas fa-headset',
		title: 'Premium Support & Maintenance',
		summary:
			'Direct support for troubleshooting, compatibility questions, follow-up configuration, and optimization maintenance.',
		bestFor: 'Customers who want help after setup or need a second pass when hardware or games change.',
		price: '€25/request',
		features: [
			'Priority support requests',
			'Performance checkups',
			'Optimization update guidance',
			'Remote troubleshooting when needed',
		],
	},
];

const processSteps = [
	{
		title: 'Profile',
		text: 'Review hardware, games, operating system, and the problem you are trying to solve.',
	},
	{
		title: 'Tune',
		text: 'Apply the Windows, BIOS, and software changes that fit the system instead of a generic preset.',
	},
	{
		title: 'Validate',
		text: 'Check stability, resource use, and benchmark signals before considering the setup complete.',
	},
	{
		title: 'Support',
		text: 'Provide follow-up help for installation, compatibility, or later configuration changes.',
	},
];

function Services() {
	return (
		<>
			<SEO
				title="Our Services - Professional PC Optimization | Softhe.io"
				description="PC optimization services for competitive gaming. Custom Windows ISOs, BIOS tuning, complete performance packages, and setup support."
				keywords="pc optimization services, windows iso, bios tuning, gaming pc optimization, custom windows, performance tuning, gaming services, esports optimization"
				ogTitle="Professional PC Optimization Services for Gaming PCs"
				ogDescription="Custom Windows ISOs, BIOS tuning, support, and complete performance packages for competitive gaming systems."
			/>
			<div className="services-page">
				<section className="page-header">
					<div className="container">
						<h1>Our Services</h1>
						<p>PC optimization services built around your hardware, games, and support needs.</p>
					</div>
				</section>

				<section className="services-detailed">
					<div className="container">
						<div className="services-intro">
							<div>
								<span className="section-kicker">Service menu</span>
								<h2>Pick the depth of optimization your setup needs.</h2>
							</div>
							<p>
								Some systems only need a clean Windows baseline. Others need BIOS, drivers,
								and game settings reviewed together. These packages make that decision clearer.
							</p>
						</div>

						<div className="services-grid">
							{services.map((service) => (
								<article className="service-card" key={service.title}>
									<div className="service-card-top">
										<div className="service-icon">
											<i className={service.icon}></i>
										</div>
										<div className="service-price">{service.price}</div>
									</div>
									<h3>{service.title}</h3>
									<p>{service.summary}</p>
									<div className="service-fit">
										<span>Best for</span>
										<strong>{service.bestFor}</strong>
									</div>
									<ul className="service-features">
										{service.features.map((feature) => (
											<li key={feature}>
												<i className="fas fa-check"></i>
												{feature}
											</li>
										))}
									</ul>
								</article>
							))}
						</div>
					</div>
				</section>

				<section className="process">
					<div className="container">
						<div className="process-header">
							<span className="section-kicker">Workflow</span>
							<h2 className="section-title">How the optimization work moves</h2>
						</div>
						<div className="process-steps">
							{processSteps.map((step, index) => (
								<div className="process-step" key={step.title}>
									<div className="step-number">{index + 1}</div>
									<h3>{step.title}</h3>
									<p>{step.text}</p>
								</div>
							))}
						</div>
						<div className="services-cta">
							<div>
								<h3>Need help choosing?</h3>
								<p>Send your CPU, GPU, RAM, motherboard, and main games before buying.</p>
							</div>
							<div className="services-cta-actions">
								<Link to="/contact" className="btn btn-secondary">Ask First</Link>
								<Link to="/store" className="btn btn-primary">View Products</Link>
							</div>
						</div>
					</div>
				</section>
			</div>
		</>
	);
}

export default Services;
