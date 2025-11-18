import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import Navbar from "./Navbar";

describe("Navbar Component", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	// Helper function to render Navbar with Router
	const renderNavbar = (initialRoute = "/") => {
		return render(
			<MemoryRouter initialEntries={[initialRoute]}>
				<Navbar />
			</MemoryRouter>
		);
	};

	describe("Rendering", () => {
		it("should render the navbar", () => {
			renderNavbar();
			expect(screen.getByRole("navigation")).toBeInTheDocument();
		});

		it("should render the logo with text 'Softhe.io'", () => {
			renderNavbar();
			expect(screen.getByText("Softhe.io")).toBeInTheDocument();
		});

		it("should render the logo as a link to home", () => {
			renderNavbar();
			const logo = screen.getByText("Softhe.io");
			expect(logo).toHaveAttribute("href", "/");
		});

		it("should render all navigation links", () => {
			renderNavbar();
			expect(screen.getByText("Home")).toBeInTheDocument();
			expect(screen.getByText("Services")).toBeInTheDocument();
			expect(screen.getByText("Store")).toBeInTheDocument();
			expect(screen.getByText("Performance")).toBeInTheDocument();
			expect(screen.getByText("Contact")).toBeInTheDocument();
		});

		it("should render the hamburger menu button", () => {
			renderNavbar();
			const hamburger = document.querySelector(".hamburger");
			expect(hamburger).toBeInTheDocument();
		});

		it("should render three bars in hamburger menu", () => {
			renderNavbar();
			const bars = document.querySelectorAll(".hamburger .bar");
			expect(bars).toHaveLength(3);
		});
	});

	describe("Navigation Links", () => {
		it("should have correct href for Home link", () => {
			renderNavbar();
			const homeLink = screen.getByText("Home");
			expect(homeLink).toHaveAttribute("href", "/");
		});

		it("should have correct href for Services link", () => {
			renderNavbar();
			const servicesLink = screen.getByText("Services");
			expect(servicesLink).toHaveAttribute("href", "/services");
		});

		it("should have correct href for Store link", () => {
			renderNavbar();
			const storeLink = screen.getByText("Store");
			expect(storeLink).toHaveAttribute("href", "/store");
		});

		it("should have correct href for Performance link", () => {
			renderNavbar();
			const performanceLink = screen.getByText("Performance");
			expect(performanceLink).toHaveAttribute("href", "/performance");
		});

		it("should have correct href for Contact link", () => {
			renderNavbar();
			const contactLink = screen.getByText("Contact");
			expect(contactLink).toHaveAttribute("href", "/contact");
		});
	});

	describe("Active Link Highlighting", () => {
		it("should highlight Home link when on home page", () => {
			renderNavbar("/");
			const homeLink = screen.getByText("Home");
			expect(homeLink).toHaveClass("active");
		});

		it("should highlight Services link when on services page", () => {
			renderNavbar("/services");
			const servicesLink = screen.getByText("Services");
			expect(servicesLink).toHaveClass("active");
		});

		it("should highlight Store link when on store page", () => {
			renderNavbar("/store");
			const storeLink = screen.getByText("Store");
			expect(storeLink).toHaveClass("active");
		});

		it("should highlight Performance link when on performance page", () => {
			renderNavbar("/performance");
			const performanceLink = screen.getByText("Performance");
			expect(performanceLink).toHaveClass("active");
		});

		it("should highlight Contact link when on contact page", () => {
			renderNavbar("/contact");
			const contactLink = screen.getByText("Contact");
			expect(contactLink).toHaveClass("active");
		});

		it("should only highlight the current page", () => {
			renderNavbar("/services");
			const homeLink = screen.getByText("Home");
			const servicesLink = screen.getByText("Services");
			const storeLink = screen.getByText("Store");

			expect(homeLink).not.toHaveClass("active");
			expect(servicesLink).toHaveClass("active");
			expect(storeLink).not.toHaveClass("active");
		});
	});

	describe("Mobile Menu Toggle", () => {
		it("should not have active class on menu initially", () => {
			renderNavbar();
			const menu = document.querySelector(".nav-menu");
			expect(menu).not.toHaveClass("active");
		});

		it("should add active class to menu when hamburger is clicked", async () => {
			const user = userEvent.setup();
			renderNavbar();

			const hamburger = document.querySelector(".hamburger");
			const menu = document.querySelector(".nav-menu");

			expect(menu).not.toHaveClass("active");

			await user.click(hamburger);

			expect(menu).toHaveClass("active");
		});

		it("should toggle active class on hamburger when clicked", async () => {
			const user = userEvent.setup();
			renderNavbar();

			const hamburger = document.querySelector(".hamburger");

			expect(hamburger).not.toHaveClass("active");

			await user.click(hamburger);

			expect(hamburger).toHaveClass("active");
		});

		it("should remove active class when hamburger is clicked again", async () => {
			const user = userEvent.setup();
			renderNavbar();

			const hamburger = document.querySelector(".hamburger");
			const menu = document.querySelector(".nav-menu");

			// First click - open
			await user.click(hamburger);
			expect(menu).toHaveClass("active");

			// Second click - close
			await user.click(hamburger);
			expect(menu).not.toHaveClass("active");
		});

		it("should close menu when a nav link is clicked", async () => {
			const user = userEvent.setup();
			renderNavbar();

			const hamburger = document.querySelector(".hamburger");
			const menu = document.querySelector(".nav-menu");
			const servicesLink = screen.getByText("Services");

			// Open menu
			await user.click(hamburger);
			expect(menu).toHaveClass("active");

			// Click a link
			await user.click(servicesLink);

			// Menu should close
			expect(menu).not.toHaveClass("active");
		});

		it("should close menu and hamburger when a nav link is clicked", async () => {
			const user = userEvent.setup();
			renderNavbar();

			const hamburger = document.querySelector(".hamburger");
			const menu = document.querySelector(".nav-menu");
			const storeLink = screen.getByText("Store");

			// Open menu
			await user.click(hamburger);
			expect(menu).toHaveClass("active");
			expect(hamburger).toHaveClass("active");

			// Click a link
			await user.click(storeLink);

			// Both should close
			expect(menu).not.toHaveClass("active");
			expect(hamburger).not.toHaveClass("active");
		});

		it("should handle multiple toggle clicks", async () => {
			const user = userEvent.setup();
			renderNavbar();

			const hamburger = document.querySelector(".hamburger");
			const menu = document.querySelector(".nav-menu");

			// Click 1 - open
			await user.click(hamburger);
			expect(menu).toHaveClass("active");

			// Click 2 - close
			await user.click(hamburger);
			expect(menu).not.toHaveClass("active");

			// Click 3 - open
			await user.click(hamburger);
			expect(menu).toHaveClass("active");

			// Click 4 - close
			await user.click(hamburger);
			expect(menu).not.toHaveClass("active");
		});
	});

	describe("CSS Classes", () => {
		it("should have navbar class on nav element", () => {
			renderNavbar();
			const nav = screen.getByRole("navigation");
			expect(nav).toHaveClass("navbar");
		});

		it("should have nav-container class on container div", () => {
			renderNavbar();
			const container = document.querySelector(".nav-container");
			expect(container).toBeInTheDocument();
		});

		it("should have nav-logo class on logo div", () => {
			renderNavbar();
			const logo = document.querySelector(".nav-logo");
			expect(logo).toBeInTheDocument();
		});

		it("should have nav-menu class on menu ul", () => {
			renderNavbar();
			const menu = document.querySelector(".nav-menu");
			expect(menu).toBeInTheDocument();
		});

		it("should have nav-item class on list items", () => {
			renderNavbar();
			const items = document.querySelectorAll(".nav-item");
			expect(items.length).toBeGreaterThanOrEqual(6);
		});

		it("should have nav-link class on navigation links", () => {
			renderNavbar();
			const links = document.querySelectorAll(".nav-link");
			expect(links.length).toBeGreaterThanOrEqual(6);
		});
	});

	describe("Accessibility", () => {
		it("should have navigation role", () => {
			renderNavbar();
			expect(screen.getByRole("navigation")).toBeInTheDocument();
		});

		it("should have list structure for navigation", () => {
			renderNavbar();
			const list = screen.getByRole("list");
			expect(list).toBeInTheDocument();
		});

		it("should have list items for each link", () => {
			renderNavbar();
			const listItems = screen.getAllByRole("listitem");
			expect(listItems.length).toBe(6);
		});

		it("should have accessible links", () => {
			renderNavbar();
			const links = screen.getAllByRole("link");
			// 6 nav links + 1 logo link = 7 total
			expect(links.length).toBe(7);
		});

		it("should have clickable hamburger button", async () => {
			const user = userEvent.setup();
			renderNavbar();

			const hamburger = document.querySelector(".hamburger");
			expect(hamburger).toBeInTheDocument();

			// Should be clickable
			await user.click(hamburger);
			expect(hamburger).toHaveClass("active");
		});
	});

	describe("Logo Functionality", () => {
		it("should navigate to home when logo is clicked", async () => {
			const user = userEvent.setup();
			renderNavbar("/services");

			const logo = screen.getByText("Softhe.io");
			await user.click(logo);

			// Logo should link to home
			expect(logo).toHaveAttribute("href", "/");
		});

		it("should be visible on all pages", () => {
			const routes = ["/", "/services", "/store", "/performance", "/contact"];

			routes.forEach((route) => {
				const { unmount } = renderNavbar(route);
				expect(screen.getByText("Softhe.io")).toBeInTheDocument();
				unmount();
			});
		});
	});

	describe("Edge Cases", () => {
		it("should handle rapid hamburger clicks", async () => {
			const user = userEvent.setup();
			renderNavbar();

			const hamburger = document.querySelector(".hamburger");
			const menu = document.querySelector(".nav-menu");

			// Rapid clicks
			await user.click(hamburger);
			await user.click(hamburger);
			await user.click(hamburger);
			await user.click(hamburger);

			// Should still be functional (closed after even number of clicks)
			expect(menu).not.toHaveClass("active");
		});

		it("should handle clicking menu items when menu is not open", async () => {
			const user = userEvent.setup();
			renderNavbar();

			const servicesLink = screen.getByText("Services");
			const menu = document.querySelector(".nav-menu");

			expect(menu).not.toHaveClass("active");

			// Click link when menu is already closed
			await user.click(servicesLink);

			// Should still work and menu should remain closed
			expect(menu).not.toHaveClass("active");
		});

		it("should maintain state across multiple interactions", async () => {
			const user = userEvent.setup();
			renderNavbar();

			const hamburger = document.querySelector(".hamburger");
			const menu = document.querySelector(".nav-menu");
			const homeLink = screen.getByText("Home");

			// Open menu
			await user.click(hamburger);
			expect(menu).toHaveClass("active");

			// Click link
			await user.click(homeLink);
			expect(menu).not.toHaveClass("active");

			// Open again
			await user.click(hamburger);
			expect(menu).toHaveClass("active");

			// Close with hamburger
			await user.click(hamburger);
			expect(menu).not.toHaveClass("active");
		});
	});

	describe("Responsive Behavior", () => {
		it("should have hamburger menu element for mobile", () => {
			renderNavbar();
			const hamburger = document.querySelector(".hamburger");
			expect(hamburger).toBeInTheDocument();
		});

		it("should have three bar elements in hamburger", () => {
			renderNavbar();
			const bars = document.querySelectorAll(".hamburger .bar");
			expect(bars).toHaveLength(3);
		});

		it("should toggle menu visibility with hamburger", async () => {
			const user = userEvent.setup();
			renderNavbar();

			const hamburger = document.querySelector(".hamburger");
			const menu = document.querySelector(".nav-menu");

			// Menu should start closed
			expect(menu).not.toHaveClass("active");

			// Open menu
			await user.click(hamburger);
			expect(menu).toHaveClass("active");

			// Close menu
			await user.click(hamburger);
			expect(menu).not.toHaveClass("active");
		});
	});

	describe("Navigation State Management", () => {
		it("should maintain isOpen state correctly", async () => {
			const user = userEvent.setup();
			renderNavbar();

			const hamburger = document.querySelector(".hamburger");
			const menu = document.querySelector(".nav-menu");

			// Initial state - closed
			expect(menu).not.toHaveClass("active");

			// Toggle open
			await user.click(hamburger);
			expect(menu).toHaveClass("active");

			// Toggle closed
			await user.click(hamburger);
			expect(menu).not.toHaveClass("active");
		});

		it("should reset menu state when link is clicked", async () => {
			const user = userEvent.setup();
			renderNavbar();

			const hamburger = document.querySelector(".hamburger");
			const menu = document.querySelector(".nav-menu");
			const contactLink = screen.getByText("Contact");

			// Open menu
			await user.click(hamburger);
			expect(menu).toHaveClass("active");

			// Click link should close menu
			await user.click(contactLink);
			expect(menu).not.toHaveClass("active");
		});

		it("should close menu for any navigation link click", async () => {
			const user = userEvent.setup();
			renderNavbar();

			const hamburger = document.querySelector(".hamburger");
			const menu = document.querySelector(".nav-menu");
			const links = ["Home", "Services", "Store", "Performance", "Contact"];

			for (const linkText of links) {
				// Open menu
				await user.click(hamburger);
				expect(menu).toHaveClass("active");

				// Click link
				const link = screen.getByText(linkText);
				await user.click(link);

				// Menu should be closed
				expect(menu).not.toHaveClass("active");
			}
		});
	});
});
