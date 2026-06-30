import SEO from '../components/SEO';
import './Legal.css';

function PrivacyPolicy() {
	return (
		<>
			<SEO
				title="Privacy Policy | Softhe.io"
				description="Privacy information for Softhe.io, including contact forms, analytics consent, payment links, and data handling."
				canonicalUrl="https://softhe.io/privacy-policy"
			/>
			<div className="legal-page">
				<section className="page-header">
					<div className="container">
						<h1>Privacy Policy</h1>
						<p>How Softhe.io handles contact details, analytics consent, and payment links.</p>
					</div>
				</section>
				<section className="legal-content">
					<div className="container">
						<div className="legal-card">
							<section>
								<h2>Information We Collect</h2>
								<p>
									When you contact us, we collect the details you submit, such as your name,
									email address, subject, hardware information, and message content.
								</p>
								<p>
									When you use the store, payment is handled through Stripe payment links.
									Softhe.io does not store card numbers in this React application.
								</p>
							</section>
							<section>
								<h2>Analytics</h2>
								<p>
									Analytics only load after you grant consent in the cookie banner. You can
									change your choice by reopening cookie settings from the footer.
								</p>
							</section>
							<section>
								<h2>How We Use Information</h2>
								<ul>
									<li>Respond to support and sales questions.</li>
									<li>Help determine product compatibility with your hardware.</li>
									<li>Improve site usability when analytics consent is granted.</li>
								</ul>
							</section>
							<section>
								<h2>Contact</h2>
								<p>
									For privacy questions, email <a href="mailto:support@softhe.io">support@softhe.io</a>.
								</p>
							</section>
						</div>
					</div>
				</section>
			</div>
		</>
	);
}

export default PrivacyPolicy;
