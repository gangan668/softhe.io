import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
	const [isOpen, setIsOpen] = useState(false);
	const location = useLocation();

	const toggleMenu = () => {
		setIsOpen(!isOpen);
	};

	const closeMenu = () => {
		setIsOpen(false);
	};

	const isActive = (path) => {
		return location.pathname === path ? "active" : "";
	};

	return (
		<nav className="navbar">
			<div className="nav-container">
				<div className="nav-logo">
					<Link to="/">Softhe.io</Link>
				</div>
				<ul className={"nav-menu " + (isOpen ? "active" : "")}>
					<li className="nav-item">
						<Link
							to="/"
							className={"nav-link " + isActive("/")}
							onClick={closeMenu}
						>
							Home
						</Link>
					</li>
					<li className="nav-item">
						<Link
							to="/services"
							className={"nav-link " + isActive("/services")}
							onClick={closeMenu}
						>
							Services
						</Link>
					</li>
					<li className="nav-item">
						<Link
							to="/store"
							className={"nav-link " + isActive("/store")}
							onClick={closeMenu}
						>
							Store
						</Link>
					</li>
					<li className="nav-item">
						<Link
							to="/performance"
							className={"nav-link " + isActive("/performance")}
							onClick={closeMenu}
						>
							Performance
						</Link>
					</li>
					<li className="nav-item">
						<Link
							to="/contact"
							className={"nav-link " + isActive("/contact")}
							onClick={closeMenu}
						>
							Contact
						</Link>
					</li>
					<li className="nav-item">
						<Link
							to="/faq"
							className={"nav-link " + isActive("/faq")}
							onClick={closeMenu}
						>
							FAQ
						</Link>
					</li>
				</ul>
				<div
					className={"hamburger " + (isOpen ? "active" : "")}
					onClick={toggleMenu}
				>
					<span className="bar"></span>
					<span className="bar"></span>
					<span className="bar"></span>
				</div>
			</div>
		</nav>
	);
}

export default Navbar;
