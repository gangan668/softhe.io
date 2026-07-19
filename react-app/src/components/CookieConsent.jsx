import { useCallback, useEffect, useRef, useState } from 'react';
import { setAnalyticsConsent, hasConsentDecision, initGA } from '../utils/analytics';
import { useDialogFocus } from '../hooks/useDialogFocus';
import './CookieConsent.css';

const COOKIE_SETTINGS_EVENT = 'softhe:open-cookie-settings';

function CookieConsent() {
	const [showBanner, setShowBanner] = useState(false);
	const [showDetails, setShowDetails] = useState(false);
	const dialogRef = useRef(null);
	const declineButtonRef = useRef(null);
	const dismissBanner = useCallback(() => setShowBanner(false), []);
	useDialogFocus({
		dialogRef,
		isOpen: showBanner,
		onDismiss: dismissBanner,
		initialFocusRef: declineButtonRef,
		backgroundSelector: '.App',
	});

	useEffect(() => {
		const openSettings = () => {
			setShowDetails(true);
			setShowBanner(true);
		};

		window.addEventListener(COOKIE_SETTINGS_EVENT, openSettings);

		// Check if user has already made a consent decision
		if (!hasConsentDecision()) {
			// Show banner after a short delay for better UX
			const timer = setTimeout(() => {
				setShowBanner(true);
			}, 1000);

			return () => {
				clearTimeout(timer);
				window.removeEventListener(COOKIE_SETTINGS_EVENT, openSettings);
			};
		} else {
			// User has already consented, initialize analytics
			initGA();
		}

		return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, openSettings);
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
			<div
				className="cookie-consent"
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby="cookie-consent-title"
				aria-describedby="cookie-consent-description"
				tabIndex={-1}
			>
				<div className="cookie-consent-container">
					<div className="cookie-header">
						<i className="fas fa-cookie-bite" aria-hidden="true"></i>
						<h3 id="cookie-consent-title">We value your privacy</h3>
					</div>

					<div className="cookie-content">
						<p className="cookie-description" id="cookie-consent-description">
							Essential storage keeps the site working. Optional usage data helps us improve it.
						</p>

						{showDetails && (
							<div className="cookie-details" id="cookie-details">
								<div className="cookie-detail-section">
									<h4>
										<i className="fas fa-shield-alt" aria-hidden="true"></i>
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
										<i className="fas fa-chart-line" aria-hidden="true"></i>
										Performance Cookies
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
										<i className="fas fa-lock" aria-hidden="true"></i>
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
										<i className="fas fa-file-alt" aria-hidden="true"></i>
										Privacy Policy
									</a>
									<a href="/cookie-policy" target="_blank" rel="noopener noreferrer">
										<i className="fas fa-cookie" aria-hidden="true"></i>
										Cookie Policy
									</a>
								</div>
							</div>
						)}

						<button
							onClick={toggleDetails}
							className="toggle-details-btn"
							aria-expanded={showDetails}
							aria-controls="cookie-details"
							aria-label={showDetails ? "Hide cookie details" : "Show cookie details"}
						>
							{showDetails ? (
								<>
									<i className="fas fa-chevron-up" aria-hidden="true"></i>
									Show Less
								</>
							) : (
								<>
									<i className="fas fa-chevron-down" aria-hidden="true"></i>
									Learn More
								</>
							)}
						</button>
					</div>

					<div className="cookie-actions">
						<button
							ref={declineButtonRef}
							onClick={handleDecline}
							className="btn btn-decline"
							aria-label="Decline cookies"
						>
							<i className="fas fa-times" aria-hidden="true"></i>
							Decline
						</button>
						<button
							onClick={handleAccept}
							className="btn btn-accept"
							aria-label="Accept cookies"
						>
							<i className="fas fa-check" aria-hidden="true"></i>
							Accept All
						</button>
					</div>

					<p className="cookie-note">You can change this choice from Cookie Settings.</p>
				</div>
			</div>
		</div>
	);
}

export default CookieConsent;
