import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
	const [isOpen, setIsOpen] = useState(false);

	const toggleMenu = () => {
		setIsOpen(!isOpen);
	};

	const closeMenu = () => {
		setIsOpen(false);
	};

	return (
		<nav className="navbar">
			<div className="nav-container">
				<div className="nav-logo">
					<Link to="/">Softhe.io</Link>
				</div>
				<ul className={"nav-menu " + (isOpen ? "active" : "")}>
					<li className="nav-item">
						<NavLink
							to="/"
							end
							className={({ isActive }) =>
								"nav-link" + (isActive ? " active" : "")
							}
							onClick={closeMenu}
						>
							Home
						</NavLink>
					</li>
					<li className="nav-item">
						<NavLink
							to="/services"
							className={({ isActive }) =>
								"nav-link" + (isActive ? " active" : "")
							}
							onClick={closeMenu}
						>
							Services
						</NavLink>
					</li>
					<li className="nav-item">
						<NavLink
							to="/store"
							className={({ isActive }) =>
								"nav-link" + (isActive ? " active" : "")
							}
							onClick={closeMenu}
						>
							Store
						</NavLink>
					</li>
					<li className="nav-item">
						<NavLink
							to="/performance"
							className={({ isActive }) =>
								"nav-link" + (isActive ? " active" : "")
							}
							onClick={closeMenu}
						>
							Performance
						</NavLink>
					</li>
					<li className="nav-item">
						<NavLink
							to="/contact"
							className={({ isActive }) =>
								"nav-link" + (isActive ? " active" : "")
							}
							onClick={closeMenu}
						>
							Contact
						</NavLink>
					</li>
					<li className="nav-item">
						<NavLink
							to="/faq"
							className={({ isActive }) =>
								"nav-link" + (isActive ? " active" : "")
							}
							onClick={closeMenu}
						>
							FAQ
						</NavLink>
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
