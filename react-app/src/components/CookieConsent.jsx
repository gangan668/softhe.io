import { useState, useEffect } from 'react';
import { setAnalyticsConsent, hasConsentDecision, initGA } from '../utils/analytics';
import './CookieConsent.css';

function CookieConsent() {
	const [showBanner, setShowBanner] = useState(false);
	const [showDetails, setShowDetails] = useState(false);

	useEffect(() => {
		// Check if user has already made a consent decision
		if (!hasConsentDecision()) {
			// Show banner after a short delay for better UX
			const timer = setTimeout(() => {
				setShowBanner(true);
			}, 1000);

			return () => clearTimeout(timer);
		} else {
			// User has already consented, initialize analytics
			initGA();
		}
	}, []);

	const handleAccept = async () => {
		try {
			await setAnalyticsConsent(true);
			setShowBanner(false);
			initGA();
		} catch (error) {
			console.error('Error setting analytics consent:', error);
			// Still hide banner even if analytics fails
			setShowBanner(false);
		}
	};

	const handleDecline = async () => {
		try {
			await setAnalyticsConsent(false);
			setShowBanner(false);
		} catch (error) {
			console.error('Error setting analytics consent:', error);
			// Still hide banner even if analytics fails
			setShowBanner(false);
		}
	};

	const toggleDetails = () => {
		setShowDetails(!showDetails);
	};

	if (!showBanner) {
		return null;
	}

	return (
		<div className="cookie-consent-overlay">
			<div className="cookie-consent">
				<div className="cookie-consent-container">
					<div className="cookie-header">
						<i className="fas fa-cookie-bite"></i>
						<h3>We value your privacy</h3>
					</div>

					<div className="cookie-content">
						<p className="cookie-description">
							We use cookies and similar technologies to enhance your browsing experience,
							analyze site traffic, and understand where our visitors are coming from.
							This helps us improve our services for you.
						</p>

						{showDetails && (
							<div className="cookie-details">
								<div className="cookie-detail-section">
									<h4>
										<i className="fas fa-shield-alt"></i>
										Essential Cookies
									</h4>
									<p>
										These cookies are necessary for the website to function and cannot be
										disabled. They are usually set in response to actions you take, such
										as setting your privacy preferences or filling in forms.
									</p>
									<span className="cookie-status always-active">Always Active</span>
								</div>

								<div className="cookie-detail-section">
									<h4>
										<i className="fas fa-chart-line"></i>
										Analytics Cookies
									</h4>
									<p>
										These cookies help us understand how visitors interact with our website
										by collecting and reporting information anonymously. We use Google
										Analytics with IP anonymization enabled to protect your privacy.
									</p>
									<span className="cookie-status optional">Optional</span>
								</div>

								<div className="cookie-detail-section">
									<h4>
										<i className="fas fa-lock"></i>
										Your Privacy Rights
									</h4>
									<p>
										You can change your cookie preferences at any time by clicking the
										cookie settings link in the footer. For more information about how
										we process your data, please read our Privacy Policy.
									</p>
								</div>

								<div className="cookie-info-links">
									<a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
										<i className="fas fa-file-alt"></i>
										Privacy Policy
									</a>
									<a href="/cookie-policy" target="_blank" rel="noopener noreferrer">
										<i className="fas fa-cookie"></i>
										Cookie Policy
									</a>
								</div>
							</div>
						)}

						<button
							onClick={toggleDetails}
							className="toggle-details-btn"
							aria-expanded={showDetails}
						>
							{showDetails ? (
								<>
									<i className="fas fa-chevron-up"></i>
									Show Less
								</>
							) : (
								<>
									<i className="fas fa-chevron-down"></i>
									Learn More
								</>
							)}
						</button>
					</div>

					<div className="cookie-actions">
						<button
							onClick={handleDecline}
							className="btn btn-decline"
							aria-label="Decline cookies"
						>
							<i className="fas fa-times"></i>
							Decline
						</button>
						<button
							onClick={handleAccept}
							className="btn btn-accept"
							aria-label="Accept cookies"
						>
							<i className="fas fa-check"></i>
							Accept All
						</button>
					</div>

					<p className="cookie-note">
						<i className="fas fa-info-circle"></i>
						By clicking "Accept All", you agree to the storing of cookies on your device.
					</p>
				</div>
			</div>
		</div>
	);
}

export default CookieConsent;
