import SEO from '../components/SEO';
import './Legal.css';

const legalName = import.meta.env.VITE_LEGAL_NAME || 'Softhe.io';
const legalAddress = import.meta.env.VITE_LEGAL_ADDRESS || '';
const vatId = import.meta.env.VITE_VAT_ID || '';

function LegalNotice() {
	return (
		<>
			<SEO title="Legal Notice | Softhe.io" description="Operator and contact information for the Softhe.io website and services." canonicalUrl="https://softhe.io/legal-notice" />
			<div className="legal-page">
				<section className="page-header"><div className="container"><h1>Legal Notice</h1><p>Operator and contact information for Softhe.io.</p></div></section>
				<section className="legal-content"><div className="container"><div className="legal-card">
					<section><h2>Service operator</h2><p><strong>{legalName}</strong></p>{legalAddress ? <address>{legalAddress}</address> : <p className="legal-configuration-note">A complete postal business address must be configured before commercial production launch.</p>}{vatId && <p>VAT identification number: {vatId}</p>}</section>
					<section><h2>Contact</h2><p>Email: <a href="mailto:support@softhe.io">support@softhe.io</a></p><p>Discord: <a href="https://discord.com/users/softhecs" target="_blank" rel="noreferrer">@softhecs</a></p></section>
					<section><h2>Editorial responsibility</h2><p>{legalName} is responsible for the editorial content of this website. Product and performance information should be read with the limitations stated on the relevant page.</p></section>
					<section><h2>Dispute information</h2><p>Consumers may contact support first so a complaint can be reviewed directly. Any legally required dispute-resolution or supervisory-body information must be added for the operator's jurisdiction before launch.</p></section>
				</div></div></section>
			</div>
		</>
	);
}

export default LegalNotice;
