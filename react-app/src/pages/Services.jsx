import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { PRODUCTS } from '../data/products';
import './Services.css';

const processSteps = [
	{
		title: 'Profile',
		text: 'Send your hardware, operating system, main games, and the problem you want to fix.',
	},
	{
		title: 'Tune',
		text: 'We apply Windows, BIOS, and software changes that match the system.',
	},
	{
		title: 'Validate',
		text: 'We check stability, resource use, and repeatable benchmark results.',
	},
	{
		title: 'Support',
		text: 'Get help with installation, compatibility, and later configuration questions.',
	},
];

function Services() {
	return (
		<>
			<SEO
				title="PC optimization services | Softhe.io"
				description="Compare custom Windows builds and BIOS tuning for gaming PCs. See the scope, price, compatibility guidance, and support included with each service."
				keywords="pc optimization services, windows iso, bios tuning, gaming pc optimization, custom windows, performance tuning, gaming services, esports optimization"
				ogTitle="PC optimization services for gaming PCs"
				ogDescription="Compare custom Windows builds, BIOS tuning, prices, and support for gaming PCs."
			/>
			<div className="services-page">
				<section className="page-header">
					<div className="container">
						<h1>PC optimization services</h1>
						<p>Compare Windows builds and BIOS tuning by scope, hardware fit, and price.</p>
					</div>
				</section>

				<section className="services-detailed">
					<div className="container">
						<div className="services-intro">
							<div>
								<span className="section-kicker">Services</span>
								<h2>Choose the work your PC needs.</h2>
							</div>
							<p>
								Each service lists its use case, included work, and price. Check compatibility
								before ordering if your hardware or software requirements are unusual.
							</p>
						</div>

						<div className="services-grid">
							{PRODUCTS.map((service) => (
								<article className="service-card" key={service.id}>
									{service.badge && <span className="service-badge">{service.badge}</span>}
									<div className="service-visual">
										<i className={service.icon} aria-hidden="true"></i>
									</div>
									<div className="service-body">
										<div className="service-heading">
											<h3>{service.name}</h3>
											<strong>€{service.price}</strong>
										</div>
										<p>{service.description}</p>
										<div className="service-fit">
											<span>Best for</span>
											<strong>{service.bestFor}</strong>
										</div>
										<ul className="service-features">
											{service.features.map((feature) => <li key={feature}>{feature}</li>)}
										</ul>
										<Link to={`/store#${service.id}`} className="btn btn-primary service-action">
											View in Store <i className="fas fa-arrow-right" aria-hidden="true"></i>
										</Link>
									</div>
								</article>
							))}
						</div>
					</div>
				</section>

				<section className="process">
					<div className="container">
						<div className="process-header">
							<span className="section-kicker">Workflow</span>
							<h2 className="section-title">How the service works</h2>
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
								<p>Send your CPU, GPU, memory, motherboard, and main games before buying.</p>
							</div>
							<div className="services-cta-actions">
								<Link to="/contact" className="btn btn-secondary">Check compatibility</Link>
								<Link to="/store" className="btn btn-primary">Compare products</Link>
							</div>
						</div>
					</div>
				</section>
			</div>
		</>
	);
}

export default Services;
