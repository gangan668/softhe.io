import SEO from '../components/SEO';
import './Legal.css';

function CookiePolicy() {
	return (
		<>
			<SEO
				title="Cookie Policy | Softhe.io"
				description="Cookie policy for Softhe.io, including essential storage and optional analytics cookies."
				canonicalUrl="https://softhe.io/cookie-policy"
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
								<h2>Payment Links</h2>
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
						</div>
					</div>
				</section>
			</div>
		</>
	);
}

export default CookiePolicy;
