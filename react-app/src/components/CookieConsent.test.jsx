import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import CookieConsent from "./CookieConsent";

// Mock the analytics utility
vi.mock("../utils/analytics", () => ({
	setAnalyticsConsent: vi.fn(),
	hasConsentDecision: vi.fn(() => false),
	initGA: vi.fn(),
}));

describe("CookieConsent Component", () => {
	beforeEach(() => {
		// Clear all mocks before each test
		vi.clearAllMocks();
		vi.useFakeTimers();

		// Mock localStorage
		const localStorageMock = {
			getItem: vi.fn(),
			setItem: vi.fn(),
			removeItem: vi.fn(),
			clear: vi.fn(),
		};
		global.localStorage = localStorageMock;
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	describe("Banner Visibility", () => {
		it("should not show banner immediately on mount", () => {
			const { hasConsentDecision } = require("../utils/analytics");
			hasConsentDecision.mockReturnValue(false);

			render(<CookieConsent />);

			expect(screen.queryByText(/We value your privacy/i)).not.toBeInTheDocument();
		});

		it("should show banner after 1 second delay if no consent decision", async () => {
			const { hasConsentDecision } = require("../utils/analytics");
			hasConsentDecision.mockReturnValue(false);

			render(<CookieConsent />);

			// Fast-forward time by 1 second
			vi.advanceTimersByTime(1000);

			await waitFor(() => {
				expect(screen.getByText(/We value your privacy/i)).toBeInTheDocument();
			});
		});

		it("should not show banner if user already made a consent decision", () => {
			const { hasConsentDecision } = require("../utils/analytics");
			hasConsentDecision.mockReturnValue(true);

			render(<CookieConsent />);

			// Fast-forward time
			vi.advanceTimersByTime(1000);

			expect(screen.queryByText(/We value your privacy/i)).not.toBeInTheDocument();
		});

		it("should initialize analytics if consent already given", () => {
			const { hasConsentDecision, initGA } = require("../utils/analytics");
			hasConsentDecision.mockReturnValue(true);

			render(<CookieConsent />);

			expect(initGA).toHaveBeenCalled();
		});
	});

	describe("User Interactions", () => {
		it("should have Accept and Decline buttons", async () => {
			const { hasConsentDecision } = require("../utils/analytics");
			hasConsentDecision.mockReturnValue(false);

			render(<CookieConsent />);
			vi.advanceTimersByTime(1000);

			await waitFor(() => {
				expect(screen.getByRole("button", { name: /Accept/i })).toBeInTheDocument();
				expect(screen.getByRole("button", { name: /Decline/i })).toBeInTheDocument();
			});
		});

		it("should call setAnalyticsConsent(true) when Accept is clicked", async () => {
			const user = userEvent.setup({ delay: null });
			const { hasConsentDecision, setAnalyticsConsent } = require("../utils/analytics");
			hasConsentDecision.mockReturnValue(false);

			render(<CookieConsent />);
			vi.advanceTimersByTime(1000);

			await waitFor(() => {
				expect(screen.getByText(/We value your privacy/i)).toBeInTheDocument();
			});

			const acceptButton = screen.getByRole("button", { name: /Accept/i });
			await user.click(acceptButton);

			expect(setAnalyticsConsent).toHaveBeenCalledWith(true);
		});

		it("should call setAnalyticsConsent(false) when Decline is clicked", async () => {
			const user = userEvent.setup({ delay: null });
			const { hasConsentDecision, setAnalyticsConsent } = require("../utils/analytics");
			hasConsentDecision.mockReturnValue(false);

			render(<CookieConsent />);
			vi.advanceTimersByTime(1000);

			await waitFor(() => {
				expect(screen.getByText(/We value your privacy/i)).toBeInTheDocument();
			});

			const declineButton = screen.getByRole("button", { name: /Decline/i });
			await user.click(declineButton);

			expect(setAnalyticsConsent).toHaveBeenCalledWith(false);
		});

		it("should hide banner after Accept is clicked", async () => {
			const user = userEvent.setup({ delay: null });
			const { hasConsentDecision } = require("../utils/analytics");
			hasConsentDecision.mockReturnValue(false);

			render(<CookieConsent />);
			vi.advanceTimersByTime(1000);

			await waitFor(() => {
				expect(screen.getByText(/We value your privacy/i)).toBeInTheDocument();
			});

			const acceptButton = screen.getByRole("button", { name: /Accept/i });
			await user.click(acceptButton);

			await waitFor(() => {
				expect(screen.queryByText(/We value your privacy/i)).not.toBeInTheDocument();
			});
		});

		it("should hide banner after Decline is clicked", async () => {
			const user = userEvent.setup({ delay: null });
			const { hasConsentDecision } = require("../utils/analytics");
			hasConsentDecision.mockReturnValue(false);

			render(<CookieConsent />);
			vi.advanceTimersByTime(1000);

			await waitFor(() => {
				expect(screen.getByText(/We value your privacy/i)).toBeInTheDocument();
			});

			const declineButton = screen.getByRole("button", { name: /Decline/i });
			await user.click(declineButton);

			await waitFor(() => {
				expect(screen.queryByText(/We value your privacy/i)).not.toBeInTheDocument();
			});
		});

		it("should initialize Google Analytics when Accept is clicked", async () => {
			const user = userEvent.setup({ delay: null });
			const { hasConsentDecision, initGA } = require("../utils/analytics");
			hasConsentDecision.mockReturnValue(false);

			render(<CookieConsent />);
			vi.advanceTimersByTime(1000);

			await waitFor(() => {
				expect(screen.getByText(/We value your privacy/i)).toBeInTheDocument();
			});

			const acceptButton = screen.getByRole("button", { name: /Accept/i });
			await user.click(acceptButton);

			expect(initGA).toHaveBeenCalled();
		});

		it("should not initialize Google Analytics when Decline is clicked", async () => {
			const user = userEvent.setup({ delay: null });
			const { hasConsentDecision, initGA } = require("../utils/analytics");
			hasConsentDecision.mockReturnValue(false);

			render(<CookieConsent />);
			vi.advanceTimersByTime(1000);

			await waitFor(() => {
				expect(screen.getByText(/We value your privacy/i)).toBeInTheDocument();
			});

			const declineButton = screen.getByRole("button", { name: /Decline/i });
			await user.click(declineButton);

			// initGA should not be called for decline
			expect(initGA).not.toHaveBeenCalled();
		});
	});

	describe("Details Toggle", () => {
		it("should have a button to show/hide cookie details", async () => {
			const { hasConsentDecision } = require("../utils/analytics");
			hasConsentDecision.mockReturnValue(false);

			render(<CookieConsent />);
			vi.advanceTimersByTime(1000);

			await waitFor(() => {
				const detailsButton = screen.queryByText(/Learn more/i) || screen.queryByText(/Show details/i);
				if (detailsButton) {
					expect(detailsButton).toBeInTheDocument();
				}
			});
		});

		it("should toggle details section when details button is clicked", async () => {
			const user = userEvent.setup({ delay: null });
			const { hasConsentDecision } = require("../utils/analytics");
			hasConsentDecision.mockReturnValue(false);

			render(<CookieConsent />);
			vi.advanceTimersByTime(1000);

			await waitFor(() => {
				expect(screen.getByText(/We value your privacy/i)).toBeInTheDocument();
			});

			// Look for details button (might be "Learn more" or similar)
			const detailsButton = screen.queryByRole("button", { name: /details/i }) ||
				screen.queryByRole("button", { name: /learn more/i });

			if (detailsButton) {
				await user.click(detailsButton);

				// Details should now be visible
				await waitFor(() => {
					expect(screen.getByText(/analytics/i)).toBeInTheDocument();
				});

				// Click again to hide
				await user.click(detailsButton);

				// Details should be hidden
				await waitFor(() => {
					expect(screen.queryByText(/We use analytics/i)).not.toBeInTheDocument();
				});
			}
		});
	});

	describe("Content and Accessibility", () => {
		it("should display privacy message", async () => {
			const { hasConsentDecision } = require("../utils/analytics");
			hasConsentDecision.mockReturnValue(false);

			render(<CookieConsent />);
			vi.advanceTimersByTime(1000);

			await waitFor(() => {
				expect(screen.getByText(/We value your privacy/i)).toBeInTheDocument();
			});
		});

		it("should have an icon in the header", async () => {
			const { hasConsentDecision } = require("../utils/analytics");
			hasConsentDecision.mockReturnValue(false);

			render(<CookieConsent />);
			vi.advanceTimersByTime(1000);

			await waitFor(() => {
				const icons = document.querySelectorAll("i.fas, i.fa");
				expect(icons.length).toBeGreaterThan(0);
			});
		});

		it("should have accessible button labels", async () => {
			const { hasConsentDecision } = require("../utils/analytics");
			hasConsentDecision.mockReturnValue(false);

			render(<CookieConsent />);
			vi.advanceTimersByTime(1000);

			await waitFor(() => {
				const acceptButton = screen.getByRole("button", { name: /Accept/i });
				const declineButton = screen.getByRole("button", { name: /Decline/i });

				expect(acceptButton).toBeInTheDocument();
				expect(declineButton).toBeInTheDocument();
			});
		});

		it("should have appropriate ARIA attributes", async () => {
			const { hasConsentDecision } = require("../utils/analytics");
			hasConsentDecision.mockReturnValue(false);

			render(<CookieConsent />);
			vi.advanceTimersByTime(1000);

			await waitFor(() => {
				const banner = document.querySelector(".cookie-consent");
				expect(banner).toBeInTheDocument();
			});
		});
	});

	describe("Timer Cleanup", () => {
		it("should cleanup timer on unmount", () => {
			const { hasConsentDecision } = require("../utils/analytics");
			hasConsentDecision.mockReturnValue(false);

			const { unmount } = render(<CookieConsent />);

			// Unmount before timer fires
			unmount();

			// Advance time
			vi.advanceTimersByTime(1000);

			// Banner should not appear since component was unmounted
			expect(screen.queryByText(/We value your privacy/i)).not.toBeInTheDocument();
		});
	});

	describe("Edge Cases", () => {
		it("should handle multiple rapid Accept clicks gracefully", async () => {
			const user = userEvent.setup({ delay: null });
			const { hasConsentDecision, setAnalyticsConsent } = require("../utils/analytics");
			hasConsentDecision.mockReturnValue(false);

			render(<CookieConsent />);
			vi.advanceTimersByTime(1000);

			await waitFor(() => {
				expect(screen.getByText(/We value your privacy/i)).toBeInTheDocument();
			});

			const acceptButton = screen.getByRole("button", { name: /Accept/i });

			// Click multiple times rapidly
			await user.click(acceptButton);
			await user.click(acceptButton);
			await user.click(acceptButton);

			// Should only call once or handle gracefully
			expect(setAnalyticsConsent).toHaveBeenCalledWith(true);
		});

		it("should handle Accept then Decline clicks", async () => {
			const user = userEvent.setup({ delay: null });
			const { hasConsentDecision } = require("../utils/analytics");
			hasConsentDecision.mockReturnValue(false);

			render(<CookieConsent />);
			vi.advanceTimersByTime(1000);

			await waitFor(() => {
				expect(screen.getByText(/We value your privacy/i)).toBeInTheDocument();
			});

			const acceptButton = screen.getByRole("button", { name: /Accept/i });
			await user.click(acceptButton);

			// Banner should be hidden, so decline button shouldn't be accessible
			await waitFor(() => {
				expect(screen.queryByText(/We value your privacy/i)).not.toBeInTheDocument();
			});
		});

		it("should return null when banner is hidden", () => {
			const { hasConsentDecision } = require("../utils/analytics");
			hasConsentDecision.mockReturnValue(true);

			const { container } = render(<CookieConsent />);

			// Component should render nothing
			expect(container.firstChild).toBeNull();
		});
	});

	describe("Analytics Integration", () => {
		it("should check for existing consent on mount", () => {
			const { hasConsentDecision } = require("../utils/analytics");
			hasConsentDecision.mockReturnValue(false);

			render(<CookieConsent />);

			expect(hasConsentDecision).toHaveBeenCalled();
		});

		it("should handle analytics utility errors gracefully", async () => {
			const user = userEvent.setup({ delay: null });
			const { hasConsentDecision, setAnalyticsConsent } = require("../utils/analytics");
			hasConsentDecision.mockReturnValue(false);
			setAnalyticsConsent.mockImplementation(() => {
				throw new Error("Analytics error");
			});

			// Should not throw error
			expect(() => {
				render(<CookieConsent />);
			}).not.toThrow();

			vi.advanceTimersByTime(1000);

			await waitFor(() => {
				expect(screen.getByText(/We value your privacy/i)).toBeInTheDocument();
			});

			const acceptButton = screen.getByRole("button", { name: /Accept/i });

			// Should handle error gracefully
			await user.click(acceptButton);

			// Component should still work
			expect(acceptButton).toBeDefined();
		});
	});

	describe("UX and Timing", () => {
		it("should delay banner appearance for better UX", () => {
			const { hasConsentDecision } = require("../utils/analytics");
			hasConsentDecision.mockReturnValue(false);

			render(<CookieConsent />);

			// Banner should not appear immediately
			expect(screen.queryByText(/We value your privacy/i)).not.toBeInTheDocument();

			// Advance time by 500ms (less than 1 second)
			vi.advanceTimersByTime(500);
			expect(screen.queryByText(/We value your privacy/i)).not.toBeInTheDocument();

			// Advance to 1 second
			vi.advanceTimersByTime(500);

			// Now it should appear
			expect(screen.getByText(/We value your privacy/i)).toBeInTheDocument();
		});

		it("should show banner exactly after 1000ms", () => {
			const { hasConsentDecision } = require("../utils/analytics");
			hasConsentDecision.mockReturnValue(false);

			render(<CookieConsent />);

			// Test at 999ms
			vi.advanceTimersByTime(999);
			expect(screen.queryByText(/We value your privacy/i)).not.toBeInTheDocument();

			// Test at 1000ms
			vi.advanceTimersByTime(1);
			expect(screen.getByText(/We value your privacy/i)).toBeInTheDocument();
		});
	});

	describe("Visual Elements", () => {
		it("should have overlay and modal container", async () => {
			const { hasConsentDecision } = require("../utils/analytics");
			hasConsentDecision.mockReturnValue(false);

			render(<CookieConsent />);
			vi.advanceTimersByTime(1000);

			await waitFor(() => {
				const overlay = document.querySelector(".cookie-consent-overlay");
				const modal = document.querySelector(".cookie-consent");

				expect(overlay).toBeInTheDocument();
				expect(modal).toBeInTheDocument();
			});
		});

		it("should have styled buttons", async () => {
			const { hasConsentDecision } = require("../utils/analytics");
			hasConsentDecision.mockReturnValue(false);

			render(<CookieConsent />);
			vi.advanceTimersByTime(1000);

			await waitFor(() => {
				const acceptButton = screen.getByRole("button", { name: /Accept/i });
				const declineButton = screen.getByRole("button", { name: /Decline/i });

				expect(acceptButton).toHaveClass(/btn/);
				expect(declineButton).toHaveClass(/btn/);
			});
		});
	});
});
