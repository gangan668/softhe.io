import SEO from '../components/SEO';
import './Legal.css';

function Terms() {
	return (
		<>
			<SEO title="Terms of Service | Softhe.io" description="Terms for Softhe.io digital products, optimization services, payments, delivery, support, and refunds." canonicalUrl="https://softhe.io/terms" />
			<div className="legal-page">
				<section className="page-header"><div className="container"><h1>Terms of Service</h1><p>Terms for purchasing and using Softhe.io products and services.</p></div></section>
				<section className="legal-content"><div className="container"><div className="legal-card">
					<p className="legal-revision">Last updated: 19 July 2026</p>
					<section><h2>Scope</h2><p>These terms apply to the Softhe.io website, downloadable or configured Windows products, BIOS optimization work, and related remote support. Product descriptions shown before checkout form part of the purchase information.</p></section>
					<section><h2>Orders and payment</h2><p>Prices are displayed in euros unless stated otherwise. Checkout is hosted by Stripe. An order is accepted after payment is confirmed and Softhe.io sends or records the corresponding fulfillment instruction. Automated fraud, availability, or compatibility checks may delay acceptance.</p></section>
					<section><h2>Delivery and customer responsibilities</h2><p>Digital delivery or service scheduling instructions are sent using the contact information provided at checkout. Customers are responsible for providing accurate hardware and contact details, maintaining backups and recovery keys, and holding valid operating-system and software licences.</p><p>BIOS and operating-system changes can affect stability, security, warranties, and stored data. Follow the provided preparation and recovery guidance and do not proceed when required backups or recovery options are unavailable.</p></section>
					<section><h2>Performance claims</h2><p>Published benchmarks describe the tested configuration and are not a guarantee that every computer will achieve the same result. Hardware, firmware, drivers, cooling, game versions, settings, background applications, and starting system condition affect outcomes.</p></section>
					<section><h2>Cancellation and refunds</h2><p>The site currently offers a 14-day refund request window, subject to applicable mandatory consumer law and the nature and delivery status of digital content or personalised services. Customers may be asked for order details and a description of the issue. Nothing in these terms limits non-waivable statutory rights.</p></section>
					<section><h2>Acceptable use and support</h2><p>Products and guidance may not be used to bypass licences, security controls, anti-cheat systems, or third-party terms. Support covers the product or service purchased and the documented system configuration; unrelated hardware repair or recovery may require separate work.</p></section>
					<section><h2>Liability</h2><p>To the extent permitted by applicable law, Softhe.io is not responsible for losses caused by inaccurate customer information, unsupported modifications, ignored recovery guidance, third-party outages, or changes made after delivery. Liability is not excluded where exclusion is prohibited by law.</p></section>
					<section><h2>Contact</h2><p>Questions, cancellation requests, and support requests can be sent to <a href="mailto:support@softhe.io">support@softhe.io</a>. See the Legal Notice for operator information.</p></section>
				</div></div></section>
			</div>
		</>
	);
}

export default Terms;
