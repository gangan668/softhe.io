import SEO from '../components/SEO';
import { absoluteUrl } from '../config/site';
import './Legal.css';

function CookiePolicy() {
	return (
		<>
			<SEO
				title="Cookie Policy | Softhe.io"
				description="Cookie policy for Softhe.io, including essential storage and optional analytics cookies."
				canonicalUrl={absoluteUrl('/cookie-policy')}
			/>
			<div className="legal-page">
				<section className="page-header">
					<div className="container">
						<h1>Cookie Policy</h1>
						<p>What local storage and cookies are used by this site.</p>
					</div>
				</section>
				<section className="legal-content">
					<div className="container">
						<div className="legal-card">
							<p className="legal-revision">Last updated: 19 July 2026</p>
							<section>
								<h2>Essential Storage</h2>
								<p>
									The site stores your cart and cookie-consent choice locally in your browser.
									These values are needed for the cart and consent banner to work predictably.
								</p>
							</section>
							<section>
								<h2>Optional Analytics</h2>
								<p>
									Google Analytics is only loaded if you accept analytics cookies. If you
									decline, analytics will not initialize.
								</p>
							</section>
							<section>
								<h2>Third-Party Checkout</h2>
								<p>
									Stripe Checkout may set its own cookies after you leave Softhe.io.
									Review Stripe's privacy and cookie information during checkout.
								</p>
							</section>
							<section>
								<h2>Changing Your Choice</h2>
								<p>
									Use the cookie settings link in the footer to reset your analytics preference.
								</p>
							</section>
							<section><h2>Storage summary</h2><div className="legal-table-wrap"><table><thead><tr><th>Storage</th><th>Purpose</th><th>Type</th><th>Duration</th></tr></thead><tbody><tr><td>softhe_cart</td><td>Remember cart contents</td><td>Essential local storage</td><td>Until cleared</td></tr><tr><td>softhe_cookie_consent</td><td>Remember analytics choice</td><td>Essential local storage</td><td>Until reset</td></tr><tr><td>Google Analytics identifiers</td><td>Audience measurement</td><td>Optional cookies</td><td>Per analytics configuration</td></tr></tbody></table></div></section>
							<section><h2>Legal basis</h2><p>Essential storage is used to provide requested cart and consent functionality. Optional analytics storage is used only after consent and can be withdrawn through Cookie Settings.</p></section>
						</div>
					</div>
				</section>
			</div>
		</>
	);
}

export default CookiePolicy;
