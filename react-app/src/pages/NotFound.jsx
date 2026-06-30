import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import './Legal.css';

function NotFound() {
	return (
		<>
			<SEO
				title="Page Not Found | Softhe.io"
				description="The requested Softhe.io page could not be found."
				canonicalUrl="https://softhe.io/404"
			/>
			<div className="not-found-page">
				<section className="page-header">
					<div className="container">
						<h1>Page Not Found</h1>
						<p>The page you are looking for does not exist or has moved.</p>
					</div>
				</section>
				<section className="not-found-content">
					<div className="container">
						<div className="not-found-card">
							<h2>Choose a current page</h2>
							<p>Use one of the links below to get back to the active site.</p>
							<div className="not-found-actions">
								<Link to="/" className="btn btn-secondary">Home</Link>
								<Link to="/store" className="btn btn-primary">Store</Link>
								<Link to="/contact" className="btn btn-secondary">Contact</Link>
							</div>
						</div>
					</div>
				</section>
			</div>
		</>
	);
}

export default NotFound;
