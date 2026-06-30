import { Link } from 'react-router-dom';
import './Footer.css';

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
								<i className="fab fa-twitter"></i>
							</a>
							<a href="https://discord.com/users/softhecs" target="_blank" rel="noreferrer" aria-label="Discord">
								<i className="fab fa-discord"></i>
							</a>
							<a href="https://github.com/Softhe" target="_blank" rel="noreferrer" aria-label="GitHub">
								<i className="fab fa-github"></i>
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
								<i className="fab fa-discord"></i>
								<a href="https://discord.com/users/softhecs" target="_blank" rel="noreferrer">@softhecs</a>
							</li>
						</ul>
					</div>
				</div>
				<div className="footer-bottom">
					<p>&copy; 2025 Softhe.io. All rights reserved.</p>
				</div>
			</div>
		</footer>
	);
}

export default Footer;
