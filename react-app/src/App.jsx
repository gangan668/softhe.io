import { Suspense, lazy, useEffect, useState } from 'react';

import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

import ErrorBoundary from "./components/ErrorBoundary";

import Navbar from "./components/Navbar";

import Footer from "./components/Footer";

import CookieConsent from "./components/CookieConsent";

import { CartProvider } from "./context/CartProvider";

import Cart from "./components/Cart";

import { trackPageView } from "./utils/analytics";
import { initMonitoring } from "./utils/monitoring";

import "./App.css";



// Lazy load pages to improve initial load time

const Home = lazy(() => import("./pages/Home"));

const Services = lazy(() => import("./pages/Services"));

const Store = lazy(() => import("./pages/Store"));
const Guides = lazy(() => import("./pages/Guides"));

const Performance = lazy(() => import("./pages/Performance"));

const Contact = lazy(() => import("./pages/Contact"));

const FAQ = lazy(() => import("./pages/FAQ"));

const Checkout = lazy(() => import("./pages/Checkout"));

const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));

const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));

const NotFound = lazy(() => import("./pages/NotFound"));





function RouteTracker() {

	const location = useLocation();



	useEffect(() => {

		trackPageView(location.pathname);

	}, [location.pathname]);



	return null;

}



// Loading component

const PageLoader = () => (

	<div

		role="status"

		aria-label="Loading"

		style={{

			display: 'flex',

			justifyContent: 'center',

			alignItems: 'center',

			minHeight: '60vh',

			color: '#6366f1'

		}}

	>

		<i className="fas fa-spinner fa-spin fa-2x" aria-hidden="true"></i>

	</div>

);



function App() {

	const [isCartOpen, setIsCartOpen] = useState(false);

	useEffect(() => {
		initMonitoring();
	}, []);



	const toggleCart = () => {

		setIsCartOpen(!isCartOpen);

	};



	const closeCart = () => {

		setIsCartOpen(false);

	};



	return (

		<ErrorBoundary>

			<Router>

				<CartProvider>

					<RouteTracker />

					<div className="App">

						<Navbar onCartClick={toggleCart} />

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

						<Footer />

						<Cart isOpen={isCartOpen} onClose={closeCart} />

					</div>

					<CookieConsent />

				</CartProvider>

			</Router>

		</ErrorBoundary>

	);

}



export default App;
