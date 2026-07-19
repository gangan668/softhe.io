import { Link } from 'react-router-dom';
import './Footer.css';

const BRAND_PATHS = {
	x: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
	discord: 'M20.317 4.369A19.8 19.8 0 0 0 15.885 3a13.8 13.8 0 0 0-.567 1.166 18.3 18.3 0 0 0-5.123 0A12.6 12.6 0 0 0 9.63 3a19.7 19.7 0 0 0-4.435 1.372C2.393 8.533 1.635 12.59 2.015 16.59a19.9 19.9 0 0 0 5.438 2.728 14.3 14.3 0 0 0 1.305-2.129 12.9 12.9 0 0 1-2.054-.986q.258-.188.504-.386a14.2 14.2 0 0 0 12.13 0q.247.2.504.386a13.2 13.2 0 0 1-2.058.987 14.2 14.2 0 0 0 1.304 2.129 19.8 19.8 0 0 0 5.438-2.728c.446-4.64-.762-8.66-3.21-12.22ZM8.02 14.11c-1.184 0-2.157-1.086-2.157-2.42 0-1.333.952-2.42 2.157-2.42s2.177 1.096 2.157 2.42c0 1.334-.952 2.42-2.157 2.42Zm7.975 0c-1.184 0-2.157-1.086-2.157-2.42 0-1.333.952-2.42 2.157-2.42s2.177 1.096 2.157 2.42c0 1.334-.952 2.42-2.157 2.42Z',
	github: 'M12 .297a12 12 0 0 0-3.79 23.39c.6.113.82-.26.82-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.605-2.665-.303-5.466-1.332-5.466-5.93 0-1.31.468-2.381 1.235-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23a11.52 11.52 0 0 1 6.008 0c2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.233 1.911 1.233 3.221 0 4.61-2.806 5.624-5.479 5.921.43.372.814 1.103.814 2.222v3.293c0 .32.216.694.825.576A12 12 0 0 0 12 .297',
};

function BrandIcon({ name }) {
	return (
		<svg className="brand-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
			<path d={BRAND_PATHS[name]} />
		</svg>
	);
}

function Footer() {
	const openCookieSettings = () => {
		window.dispatchEvent(new Event('softhe:open-cookie-settings'));
	};

	return (
		<footer className="footer" id="contact">
			<div className="container">
				<div className="footer-content">
					<div className="footer-section">
						<h3>Softhe.io</h3>
						<p>PC optimization products and support for competitive gaming setups.</p>
						<div className="social-links">
							<a href="https://x.com/SoftheCS" target="_blank" rel="noreferrer" aria-label="X (formerly Twitter)">
								<BrandIcon name="x" />
							</a>
							<a href="https://discord.com/users/softhecs" target="_blank" rel="noreferrer" aria-label="Discord">
								<BrandIcon name="discord" />
							</a>
							<a href="https://github.com/Softhe" target="_blank" rel="noreferrer" aria-label="GitHub">
								<BrandIcon name="github" />
							</a>
							<a href="https://www.youtube.com/@softhe" target="_blank" rel="noreferrer" aria-label="YouTube">
								<i className="fab fa-youtube"></i>
							</a>
						</div>
					</div>
					<div className="footer-section">
						<h4>Quick Links</h4>
						<ul>
							<li><Link to="/services">Services</Link></li>
							<li><Link to="/performance">Performance</Link></li>
							<li><Link to="/faq">FAQ</Link></li>
							<li><Link to="/contact">Contact</Link></li>
						</ul>
					</div>
					<div className="footer-section">
						<h4>Legal</h4>
						<ul>
							<li><Link to="/privacy-policy">Privacy Policy</Link></li>
							<li><Link to="/cookie-policy">Cookie Policy</Link></li>
							<li><Link to="/terms">Terms of Service</Link></li>
							<li><Link to="/legal-notice">Legal Notice</Link></li>
							<li>
								<button type="button" className="footer-link-button" onClick={openCookieSettings}>
									Cookie Settings
								</button>
							</li>
						</ul>
					</div>
					<div className="footer-section">
						<h4>Contact</h4>
						<ul>
							<li>
								<i className="fas fa-envelope"></i>
								<a href="mailto:support@softhe.io">support@softhe.io</a>
							</li>
							<li>
								<BrandIcon name="discord" />
								<a href="https://discord.com/users/softhecs" target="_blank" rel="noreferrer">@softhecs</a>
							</li>
						</ul>
					</div>
				</div>
				<div className="footer-bottom">
					<p>&copy; {new Date().getFullYear()} Softhe.io. All rights reserved.</p>
				</div>
			</div>
		</footer>
	);
}

export default Footer;
