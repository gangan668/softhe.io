import { useEffect, useState } from 'react';

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
import Home from "./pages/Home";
import Services from "./pages/Services";
import Store from "./pages/Store";
import Guides from "./pages/Guides";
import Performance from "./pages/Performance";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Checkout from "./pages/Checkout";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import NotFound from "./pages/NotFound";





function RouteTracker() {

	const location = useLocation();



	useEffect(() => {

		trackPageView(location.pathname);

	}, [location.pathname]);



	return null;

}



function App() {

	const [isCartOpen, setIsCartOpen] = useState(false);

	useEffect(() => {
		return initMonitoring();
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
