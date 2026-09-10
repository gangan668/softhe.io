import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { PRODUCTS } from '../data/products';
import './Services.css';

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
								Compare each service separately, then use the Store when you are ready to order.
								Every option includes a clear use case, scope, and starting price.
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
