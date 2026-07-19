import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useCart } from "../context/useCart";
import "./Navbar.css";

function Navbar({ onCartClick }) {
	const [isOpen, setIsOpen] = useState(false);
	const menuButtonRef = useRef(null);
	const firstLinkRef = useRef(null);
	const { getCartCount } = useCart();
	const cartCount = getCartCount();

	const toggleMenu = () => {
		setIsOpen(!isOpen);
	};

	const closeMenu = () => {
		setIsOpen(false);
	};

	useEffect(() => {
		if (!isOpen) return undefined;
		firstLinkRef.current?.focus();
		const handleEscape = (event) => {
			if (event.key === "Escape") {
				setIsOpen(false);
				menuButtonRef.current?.focus();
			}
		};
		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [isOpen]);

	return (
		<nav className="navbar">
			<div className="nav-container">
				<div className="nav-logo">
					<Link to="/">Softhe.io</Link>
				</div>
				<ul id="primary-navigation" className={"nav-menu " + (isOpen ? "active" : "")}>
					<li className="nav-item">
						<NavLink
							ref={firstLinkRef}
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
							to="/guides"
							className={({ isActive }) =>
								"nav-link" + (isActive ? " active" : "")
							}
							onClick={closeMenu}
						>
							Guides
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
				<button
					className="cart-icon-btn"
					onClick={onCartClick}
					aria-label={`Shopping cart with ${cartCount} items`}
				>
					<i className="fas fa-shopping-cart" aria-hidden="true"></i>
					{cartCount > 0 && (
						<span className="cart-badge">{cartCount}</span>
					)}
				</button>
				<button
					ref={menuButtonRef}
					type="button"
					className={"hamburger " + (isOpen ? "active" : "")}
					onClick={toggleMenu}
					aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
					aria-expanded={isOpen}
					aria-controls="primary-navigation"
				>
					<span className="bar" aria-hidden="true"></span>
					<span className="bar" aria-hidden="true"></span>
					<span className="bar" aria-hidden="true"></span>
				</button>
			</div>
		</nav>
	);
}

export default Navbar;
