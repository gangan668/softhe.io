import { lazy, Suspense, useEffect, useState } from 'react';
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

const Home = lazy(() => import('./pages/Home'));
const Services = lazy(() => import('./pages/Services'));
const Store = lazy(() => import('./pages/Store'));
const Guides = lazy(() => import('./pages/Guides'));
const Performance = lazy(() => import('./pages/Performance'));
const Contact = lazy(() => import('./pages/Contact'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Checkout = lazy(() => import('./pages/Checkout'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'));
const NotFound = lazy(() => import('./pages/NotFound'));

function RouteTracker() {
	const location = useLocation();
	useEffect(() => trackPageView(location.pathname), [location.pathname]);
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
						<Navbar onCartClick={() => setIsCartOpen((open) => !open)} />
						<main id="main-content">
							<ErrorBoundary>
								<Suspense fallback={<PageLoader />}>
									<Routes>
									<Route path="/" element={<Home />} />
									<Route path="/services" element={<Services />} />
									<Route path="/store" element={<Store />} />
									<Route path="/performance" element={<Performance />} />
									<Route path="/guides" element={<Guides />} />
									<Route path="/contact" element={<Contact />} />
									<Route path="/faq" element={<FAQ />} />
									<Route path="/checkout" element={<Checkout />} />
									<Route path="/privacy-policy" element={<PrivacyPolicy />} />
									<Route path="/cookie-policy" element={<CookiePolicy />} />
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
