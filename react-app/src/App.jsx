import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Cart from './components/Cart';
import CookieConsent from './components/CookieConsent';
import ErrorBoundary from './components/ErrorBoundary';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import { CartProvider } from './context/CartProvider';
import { trackPageView } from './utils/analytics';
import { initMonitoring } from './utils/monitoring';
import './App.css';

import Home from './pages/Home';
const Services = lazy(() => import('./pages/Services'));
const Store = lazy(() => import('./pages/Store'));
const Guides = lazy(() => import('./pages/Guides'));
const GuideDetail = lazy(() => import('./pages/GuideDetail'));
const Performance = lazy(() => import('./pages/Performance'));
const Contact = lazy(() => import('./pages/Contact'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Checkout = lazy(() => import('./pages/Checkout'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'));
const Terms = lazy(() => import('./pages/Terms'));
const LegalNotice = lazy(() => import('./pages/LegalNotice'));
const Withdrawal = lazy(() => import('./pages/Withdrawal'));
const NotFound = lazy(() => import('./pages/NotFound'));

function RouteTracker() {
	const location = useLocation();
	const isInitialRoute = useRef(true);
	useEffect(() => {
		trackPageView(location.pathname);
		window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
		if (isInitialRoute.current) {
			isInitialRoute.current = false;
			return undefined;
		}
		const focusTimer = window.setTimeout(() => {
			document.getElementById('main-content')?.focus({ preventScroll: true });
		}, 0);
		return () => window.clearTimeout(focusTimer);
	}, [location.pathname]);
	return null;
}

function PageLoader() {
	return (
		<div className="page-loader" role="status" aria-label="Loading page">
			<i className="fas fa-spinner fa-spin" aria-hidden="true"></i>
		</div>
	);
}

function App() {
	const [isCartOpen, setIsCartOpen] = useState(false);
	useEffect(() => initMonitoring(), []);

	return (
		<ErrorBoundary>
			<Router>
				<CartProvider>
					<RouteTracker />
					<div className="App">
						<a className="skip-link" href="#main-content">Skip to main content</a>
						<Navbar onCartClick={() => setIsCartOpen((open) => !open)} />
						<main id="main-content" tabIndex="-1">
							<ErrorBoundary>
								<Suspense fallback={<PageLoader />}>
									<Routes>
									<Route path="/" element={<Home />} />
									<Route path="/services" element={<Services />} />
									<Route path="/store" element={<Store />} />
									<Route path="/performance" element={<Performance />} />
									<Route path="/guides" element={<Guides />} />
									<Route path="/guides/:slug" element={<GuideDetail />} />
									<Route path="/contact" element={<Contact />} />
									<Route path="/faq" element={<FAQ />} />
									<Route path="/checkout" element={<Checkout />} />
									<Route path="/privacy-policy" element={<PrivacyPolicy />} />
									<Route path="/cookie-policy" element={<CookiePolicy />} />
									<Route path="/terms" element={<Terms />} />
									<Route path="/legal-notice" element={<LegalNotice />} />
									<Route path="/withdrawal" element={<Withdrawal />} />
									<Route path="*" element={<NotFound />} />
									</Routes>
								</Suspense>
							</ErrorBoundary>
						</main>
						<Footer />
						<Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
					</div>
					<CookieConsent />
				</CartProvider>
			</Router>
		</ErrorBoundary>
	);
}

export default App;
