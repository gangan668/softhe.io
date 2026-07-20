import SEO from '../components/SEO';
import { absoluteUrl, siteConfig } from '../config/site';
import './Legal.css';

const { vatStatus } = siteConfig.legal;
const { supportEmail } = siteConfig;

function Terms() {
	return (
		<>
			<SEO title="Terms of Service | Softhe.io" description="Terms for Softhe.io digital products, optimization services, payments, delivery, support, and refunds." canonicalUrl={absoluteUrl('/terms')} />
			<div className="legal-page">
				<section className="page-header"><div className="container"><h1>Terms of Service</h1><p>Terms for purchasing and using Softhe.io products and services.</p></div></section>
				<section className="legal-content"><div className="container"><div className="legal-card">
					<p className="legal-revision">Last updated: 20 July 2026</p>
					<section><h2>Scope and seller</h2><p>These terms apply to the Softhe.io website, downloadable or configured Windows digital content, BIOS optimization services, and related remote support sold to consumers in Sweden and the European Union. Product descriptions and compatibility information shown before checkout form part of the contract information. The seller's registered identity, address, and contact details appear in the <a href="/legal-notice">Legal Notice</a>.</p></section>
					<section><h2>Orders, prices, and payment</h2><p>Prices are displayed in euros. {vatStatus === 'registered' ? 'Displayed consumer prices include applicable VAT.' : vatStatus === 'not-registered' || vatStatus === 'exempt' ? 'No VAT is currently charged; the checkout and receipt identify the applicable tax treatment.' : 'The applicable VAT treatment must be configured before commercial launch.'} Stripe hosts checkout. Before placing an order, the customer sees the selected items, total price, delivery information, compatibility requirements, these terms, and withdrawal information. An order is accepted after payment is confirmed and the order confirmation is issued. Automated fraud, availability, or compatibility checks may delay acceptance.</p></section>
					<section><h2>Digital content and services</h2><p>Windows products are digital content supplied electronically. BIOS optimization and remote support are services arranged with the customer. The product page and order confirmation state the intended delivery or scheduling timing. Customers are responsible for accurate hardware and contact details, backups and recovery keys, and valid operating-system and software licences.</p><p>BIOS and operating-system changes can affect stability, security, warranties, and stored data. Follow the provided preparation and recovery guidance and do not proceed when required backups or recovery options are unavailable.</p></section>
					<section><h2>Performance claims</h2><p>Published benchmarks describe the tested configuration and are not a guarantee that every computer will achieve the same result. Hardware, firmware, drivers, cooling, game versions, settings, background applications, and starting system condition affect outcomes.</p></section>
					<section><h2>Withdrawal and cancellation</h2><p>Eligible consumers generally have a statutory 14-day withdrawal period for distance contracts. The calculation and any exception depend on whether the purchase is digital content or a service and whether delivery or performance has begun. Immediate digital delivery only begins after the customer expressly requests it and acknowledges that the withdrawal right may be lost once performance begins as permitted by law. Service customers may remain responsible for a proportionate amount for work already performed after an express early-start request.</p><p>The easy-to-find <a href="/withdrawal">online withdrawal function</a> can be used with an order reference and purchaser email. It sends a timestamped durable acknowledgement. Email or another unambiguous statement may also be used. This does not limit statutory remedies for faulty or misdescribed products or services.</p></section>
					<section><h2>Complaints and remedies</h2><p>Report a fault or delivery problem promptly with the order reference and relevant details. Softhe.io will assess repair, replacement, price reduction, termination, or refund rights under applicable mandatory consumer law. Consumers may also use the competent Swedish alternative dispute-resolution body identified in the Legal Notice.</p></section>
					<section><h2>Acceptable use and support</h2><p>Products and guidance may not be used to bypass licences, security controls, anti-cheat systems, or third-party terms. Support covers the product or service purchased and the documented system configuration; unrelated hardware repair or recovery may require separate work.</p></section>
					<section><h2>Liability</h2><p>To the extent permitted by applicable law, Softhe.io is not responsible for losses caused by inaccurate customer information, unsupported modifications, ignored recovery guidance, third-party outages, or changes made after delivery. Liability is not excluded where exclusion is prohibited by law.</p></section>
					<section><h2>Governing law and contact</h2><p>Swedish law applies without depriving an EU consumer of mandatory protection available in their country of residence. Questions and support requests can be sent to <a href={`mailto:${supportEmail}`}>{supportEmail}</a>. See the Legal Notice for operator and dispute information.</p></section>
				</div></div></section>
			</div>
		</>
	);
}

export default Terms;
