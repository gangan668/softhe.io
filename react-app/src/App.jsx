import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CookieConsent from "./components/CookieConsent";
import "./App.css";

// Lazy load pages to improve initial load time
const Home = lazy(() => import("./pages/Home"));
const Services = lazy(() => import("./pages/Services"));
const Store = lazy(() => import("./pages/Store"));
const Performance = lazy(() => import("./pages/Performance"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQ = lazy(() => import("./pages/FAQ"));

// Loading component
const PageLoader = () => (
	<div style={{
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		minHeight: '60vh',
		color: '#6366f1'
	}}>
		<i className="fas fa-spinner fa-spin fa-2x"></i>
	</div>
);

function App() {
	return (
		<ErrorBoundary>
			<Router>
				<div className="App">
					<Navbar />
					<ErrorBoundary>
						<Suspense fallback={<PageLoader />}>
							<Routes>
								<Route path="/" element={<Home />} />
								<Route path="/services" element={<Services />} />
								<Route path="/store" element={<Store />} />
								<Route path="/performance" element={<Performance />} />
								<Route path="/contact" element={<Contact />} />
								<Route path="/faq" element={<FAQ />} />
							</Routes>
						</Suspense>
					</ErrorBoundary>
					<Footer />
				</div>
				<CookieConsent />
			</Router>
		</ErrorBoundary>
	);
}

export default App;
