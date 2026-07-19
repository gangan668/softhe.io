import SEO from '../components/SEO';
import './Legal.css';

function PrivacyPolicy() {
	const legalName = import.meta.env.VITE_LEGAL_NAME || 'Softhe.io';
	const legalAddress = import.meta.env.VITE_LEGAL_ADDRESS || '';
	return (
		<>
			<SEO
				title="Privacy Policy | Softhe.io"
				description="Privacy information for Softhe.io, including contact forms, analytics consent, Stripe Checkout, and data handling."
				canonicalUrl="https://softhe.io/privacy-policy"
			/>
			<div className="legal-page">
				<section className="page-header">
					<div className="container">
						<h1>Privacy Policy</h1>
						<p>How Softhe.io handles contact details, analytics consent, and Stripe Checkout.</p>
					</div>
				</section>
				<section className="legal-content">
					<div className="container">
						<div className="legal-card">
							<p className="legal-revision">Last updated: 19 July 2026</p>
							<section>
								<h2>Controller</h2>
								<p>{legalName} is the controller for information processed through this website. Contact: <a href="mailto:support@softhe.io">support@softhe.io</a>.</p>
								{legalAddress ? <address>{legalAddress}</address> : <p className="legal-configuration-note">A complete controller address must be configured before commercial production launch.</p>}
							</section>
							<section>
								<h2>Information We Collect</h2>
								<p>
									When you contact us, we collect the details you submit, such as your name,
									email address, subject, hardware information, and message content.
								</p>
								<p>
									Contact submissions are processed by our server and delivered through EmailJS.
									To prevent abuse, the server uses a keyed, pseudonymous hash of the caller's IP
									address in Upstash Redis for short-lived rate limiting; the raw address is not
									stored in that rate-limit record.
								</p>
								<p>
									When you use the store, payment is handled through a Stripe-hosted Checkout Session.
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
								<h2>Purposes and legal bases</h2>
								<ul>
									<li>Respond to support and sales questions and assess compatibility before a contract, or based on legitimate interests in customer support.</li>
									<li>Process payment, delivery, refunds, and accounting obligations to perform a contract and comply with law.</li>
									<li>Prevent abuse and secure the service based on legitimate interests in availability and fraud prevention.</li>
									<li>Measure site usage only after consent to optional analytics.</li>
								</ul>
							</section>
							<section><h2>Recipients and international processing</h2><p>Service providers may include Stripe for payments, EmailJS for contact delivery, Upstash for short-lived rate limiting and webhook state, Vercel for hosting, and Google Analytics when consented. Some providers may process information outside the European Economic Area using an adequacy decision, standard contractual clauses, or another lawful transfer mechanism described in their privacy information.</p></section>
							<section><h2>Retention</h2><p>Contact messages are retained only as long as needed to respond and maintain an appropriate support record. Order, payment, refund, and accounting records are retained for applicable contractual, tax, and legal periods. Rate-limit entries are short lived; webhook idempotency records are retained only as needed to prevent duplicate fulfillment. Analytics retention follows the configured analytics property.</p></section>
							<section><h2>Your rights</h2><p>Depending on applicable law, you may request access, correction, deletion, restriction, portability, or objection, and may withdraw consent without affecting earlier lawful processing. You may also complain to the competent data-protection authority. Requests can be sent to the address below; identity verification may be required.</p></section>
							<section><h2>Required and optional information</h2><p>Contact and order fields identified as required are needed to answer a request or deliver a purchase. Optional analytics can be declined without losing access to the site or store.</p></section>
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
