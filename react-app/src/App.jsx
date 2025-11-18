import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CookieConsent from "./components/CookieConsent";
import Home from "./pages/Home";
import Services from "./pages/Services";
import Store from "./pages/Store";
import Performance from "./pages/Performance";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import "./App.css";

function App() {
	return (
		<ErrorBoundary>
			<Router>
				<div className="App">
					<Navbar />
					<ErrorBoundary>
						<Routes>
							<Route path="/" element={<Home />} />
							<Route path="/services" element={<Services />} />
							<Route path="/store" element={<Store />} />
							<Route
								path="/performance"
								element={<Performance />}
							/>
							<Route path="/contact" element={<Contact />} />
							<Route path="/faq" element={<FAQ />} />
						</Routes>
					</ErrorBoundary>
					<Footer />
				</div>
				<CookieConsent />
			</Router>
		</ErrorBoundary>
	);
}

export default App;
