import { Link } from 'react-router-dom';
import './Footer.css';

const BRAND_PATHS = {
	x: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
	discord: 'M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.037 19.7363 19.7363 0 0 0-4.8852 1.515.0699.0699 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 0 0-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 0 1-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 0 1 .0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 0 1 .0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.873.8914.0766.0766 0 0 0-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 0 0 .0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 0 0 .0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 0 0-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z',
	github: 'M12 .297a12 12 0 0 0-3.79 23.39c.6.113.82-.26.82-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.605-2.665-.303-5.466-1.332-5.466-5.93 0-1.31.468-2.381 1.235-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23a11.52 11.52 0 0 1 6.008 0c2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.233 1.911 1.233 3.221 0 4.61-2.806 5.624-5.479 5.921.43.372.814 1.103.814 2.222v3.293c0 .32.216.694.825.576A12 12 0 0 0 12 .297',
	youtube: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
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
								<BrandIcon name="youtube" />
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
