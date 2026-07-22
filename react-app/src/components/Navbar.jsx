import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useCart } from "../context/useCart";
import { useAuth } from "../context/useAuth";
import "./Navbar.css";

function Navbar({ onCartClick }) {
	const [isOpen, setIsOpen] = useState(false);
	const menuButtonRef = useRef(null);
	const firstLinkRef = useRef(null);
	const { getCartCount } = useCart();
	const cartCount = getCartCount();
	const { user } = useAuth();

	const toggleMenu = () => {
		setIsOpen(!isOpen);
	};

	const closeMenu = () => {
		setIsOpen(false);
	};

	useEffect(() => {
		if (!isOpen) return undefined;
		firstLinkRef.current?.focus();
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		const handleKeyDown = (event) => {
			if (event.key === "Escape") {
				setIsOpen(false);
				menuButtonRef.current?.focus();
				return;
			}
			if (event.key !== "Tab") return;
			const links = [...document.querySelectorAll("#primary-navigation a")];
			if (!links.length) return;
			const first = links[0];
			const last = links[links.length - 1];
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.body.style.overflow = previousOverflow;
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen]);

	return (
		<nav className="navbar" aria-label="Primary navigation">
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
				<Link className="nav-account-link" to={user ? "/account" : "/login"} onClick={closeMenu}>{user ? "Account" : "Login"}</Link>
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
