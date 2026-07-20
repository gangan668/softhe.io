import SEO from '../components/SEO';
import { absoluteUrl, siteConfig } from '../config/site';
import './Legal.css';

const {
	name: legalName,
	address: legalAddress,
	vatId,
	vatStatus,
	registrationId,
	jurisdiction,
	responsiblePerson,
	disputeAuthority,
	disputeAuthorityUrl,
} = siteConfig.legal;

function LegalNotice() {
	return (
		<>
			<SEO title="Legal Notice | Softhe.io" description="Operator and contact information for the Softhe.io website and services." canonicalUrl={absoluteUrl('/legal-notice')} />
			<div className="legal-page">
				<section className="page-header"><div className="container"><h1>Legal Notice</h1><p>Operator and contact information for Softhe.io.</p></div></section>
				<section className="legal-content"><div className="container"><div className="legal-card">
					<section><h2>Service operator</h2><p><strong>{legalName}</strong></p>{legalAddress ? <address>{legalAddress}</address> : <p className="legal-configuration-note">A complete postal business address must be configured before commercial production launch.</p>}{registrationId ? <p>Swedish organisation number: {registrationId}</p> : <p className="legal-configuration-note">A Swedish organisation number must be configured before commercial production launch.</p>}{vatId && <p>VAT identification number: {vatId}</p>}{vatStatus ? <p>VAT status: {vatStatus.replace('-', ' ')}</p> : <p className="legal-configuration-note">VAT status must be configured before commercial production launch.</p>}{jurisdiction && <p>Applicable jurisdiction: {jurisdiction}</p>}</section>
					<section><h2>Contact</h2><p>Email: <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a></p><p>Discord: <a href={siteConfig.social.discord} target="_blank" rel="noreferrer">@softhecs</a></p><p>Withdrawal requests can be submitted through the <a href="/withdrawal">online withdrawal function</a>.</p></section>
					<section><h2>Editorial responsibility</h2><p>{responsiblePerson} is responsible for the editorial content of this website. Product and performance information should be read with the limitations stated on the relevant page.</p></section>
					<section><h2>Dispute information</h2><p>Consumers may contact support first so a complaint can be reviewed directly.</p>{disputeAuthority ? <p>Competent dispute or supervisory body: {disputeAuthorityUrl ? <a href={disputeAuthorityUrl} target="_blank" rel="noreferrer">{disputeAuthority}</a> : disputeAuthority}.</p> : <p className="legal-configuration-note">Any legally required dispute-resolution or supervisory-body information must be configured for the operator's jurisdiction before commercial launch.</p>}</section>
				</div></div></section>
			</div>
		</>
	);
}

export default LegalNotice;
