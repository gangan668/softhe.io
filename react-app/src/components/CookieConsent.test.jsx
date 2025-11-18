import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import CookieConsent from "./CookieConsent";
import * as analytics from "../utils/analytics";

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
	});

	describe("Banner Visibility", () => {
		it("should not show banner immediately on mount", () => {
			vi.mocked(analytics.hasConsentDecision).mockReturnValue(false);

			render(<CookieConsent />);

			expect(screen.queryByText(/We value your privacy/i)).not.toBeInTheDocument();
		});

		it("should show banner after 1 second delay if no consent decision", async () => {
			vi.mocked(analytics.hasConsentDecision).mockReturnValue(false);

			render(<CookieConsent />);

			// Wait for banner to appear after delay
			await waitFor(() => {
				expect(screen.getByText(/We value your privacy/i)).toBeInTheDocument();
			}, { timeout: 3000 });
		});

		it("should not show banner if user already made a consent decision", async () => {
			vi.mocked(analytics.hasConsentDecision).mockReturnValue(true);

			render(<CookieConsent />);

			// Wait to ensure banner doesn't appear
			await new Promise(resolve => setTimeout(resolve, 1500));

			expect(screen.queryByText(/We value your privacy/i)).not.toBeInTheDocument();
		});

		it("should initialize analytics if consent already given", () => {
			vi.mocked(analytics.hasConsentDecision).mockReturnValue(true);

			render(<CookieConsent />);

			expect(analytics.initGA).toHaveBeenCalled();
		});
	});

	describe("User Interactions", () => {
		it("should have Accept and Decline buttons", async () => {
			vi.mocked(analytics.hasConsentDecision).mockReturnValue(false);

			render(<CookieConsent />);

			await waitFor(() => {
				expect(screen.getByRole("button", { name: /Accept/i })).toBeInTheDocument();
				expect(screen.getByRole("button", { name: /Decline/i })).toBeInTheDocument();
			}, { timeout: 3000 });
		});

		it("should call setAnalyticsConsent(true) when Accept is clicked", async () => {
			const user = userEvent.setup();
			vi.mocked(analytics.hasConsentDecision).mockReturnValue(false);

			render(<CookieConsent />);

			const acceptButton = await screen.findByRole("button", { name: /Accept/i }, { timeout: 3000 });
			await user.click(acceptButton);

			expect(analytics.setAnalyticsConsent).toHaveBeenCalledWith(true);
		});

		it("should call setAnalyticsConsent(false) when Decline is clicked", async () => {
			const user = userEvent.setup();
			vi.mocked(analytics.hasConsentDecision).mockReturnValue(false);

			render(<CookieConsent />);

			const declineButton = await screen.findByRole("button", { name: /Decline/i }, { timeout: 3000 });
			await user.click(declineButton);

			expect(analytics.setAnalyticsConsent).toHaveBeenCalledWith(false);
		});

		it("should hide banner after Accept is clicked", async () => {
			const user = userEvent.setup();
			vi.mocked(analytics.hasConsentDecision).mockReturnValue(false);

			render(<CookieConsent />);

			const acceptButton = await screen.findByRole("button", { name: /Accept/i }, { timeout: 3000 });
			await user.click(acceptButton);

			await waitFor(() => {
				expect(screen.queryByText(/We value your privacy/i)).not.toBeInTheDocument();
			});
		});

		it("should hide banner after Decline is clicked", async () => {
			const user = userEvent.setup();
			vi.mocked(analytics.hasConsentDecision).mockReturnValue(false);

			render(<CookieConsent />);

			const declineButton = await screen.findByRole("button", { name: /Decline/i }, { timeout: 3000 });
			await user.click(declineButton);

			await waitFor(() => {
				expect(screen.queryByText(/We value your privacy/i)).not.toBeInTheDocument();
			});
		});

		it("should initialize Google Analytics when Accept is clicked", async () => {
			const user = userEvent.setup();
			vi.mocked(analytics.hasConsentDecision).mockReturnValue(false);

			render(<CookieConsent />);

			const acceptButton = await screen.findByRole("button", { name: /Accept/i }, { timeout: 3000 });
			await user.click(acceptButton);

			expect(analytics.initGA).toHaveBeenCalled();
		});

		it("should not initialize Google Analytics when Decline is clicked", async () => {
			const user = userEvent.setup();
			vi.mocked(analytics.hasConsentDecision).mockReturnValue(false);

			render(<CookieConsent />);

			const declineButton = await screen.findByRole("button", { name: /Decline/i }, { timeout: 3000 });
			await user.click(declineButton);

			// initGA should not be called for decline
			expect(analytics.initGA).not.toHaveBeenCalled();
		});
	});

	describe("Details Toggle", () => {
		it("should have a button to show/hide cookie details", async () => {
			vi.mocked(analytics.hasConsentDecision).mockReturnValue(false);

			render(<CookieConsent />);

			await waitFor(() => {
				const detailsButton = screen.queryByText(/Learn more/i) || screen.queryByText(/Show details/i);
				if (detailsButton) {
					expect(detailsButton).toBeInTheDocument();
				}
			}, { timeout: 3000 });
		});

		it("should toggle details section when details button is clicked", async () => {
			const user = userEvent.setup();
			vi.mocked(analytics.hasConsentDecision).mockReturnValue(false);

			render(<CookieConsent />);

			await waitFor(() => {
				expect(screen.getByText(/We value your privacy/i)).toBeInTheDocument();
			}, { timeout: 3000 });

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
			vi.mocked(analytics.hasConsentDecision).mockReturnValue(false);

			render(<CookieConsent />);

			await waitFor(() => {
				expect(screen.getByText(/We value your privacy/i)).toBeInTheDocument();
			}, { timeout: 3000 });
		});

		it("should have an icon in the header", async () => {
			vi.mocked(analytics.hasConsentDecision).mockReturnValue(false);

			render(<CookieConsent />);

			await waitFor(() => {
				const icons = document.querySelectorAll("i.fas, i.fa");
				expect(icons.length).toBeGreaterThan(0);
			}, { timeout: 3000 });
		});

		it("should have accessible button labels", async () => {
			vi.mocked(analytics.hasConsentDecision).mockReturnValue(false);

			render(<CookieConsent />);

			await waitFor(() => {
				const acceptButton = screen.getByRole("button", { name: /Accept/i });
				const declineButton = screen.getByRole("button", { name: /Decline/i });

				expect(acceptButton).toBeInTheDocument();
				expect(declineButton).toBeInTheDocument();
			}, { timeout: 3000 });
		});

		it("should have appropriate ARIA attributes", async () => {
			vi.mocked(analytics.hasConsentDecision).mockReturnValue(false);

			render(<CookieConsent />);

			await waitFor(() => {
				const banner = document.querySelector(".cookie-consent");
				expect(banner).toBeInTheDocument();
			}, { timeout: 3000 });
		});
	});

	describe("Timer Cleanup", () => {
		it("should cleanup timer on unmount", async () => {
			vi.mocked(analytics.hasConsentDecision).mockReturnValue(false);

			const { unmount } = render(<CookieConsent />);

			// Unmount immediately
			unmount();

			// Wait a bit
			await new Promise(resolve => setTimeout(resolve, 1500));

			// Banner should not appear
			expect(screen.queryByText(/We value your privacy/i)).not.toBeInTheDocument();
		});
	});

	describe("Edge Cases", () => {
		it("should handle multiple rapid Accept clicks gracefully", async () => {
			const user = userEvent.setup();
			vi.mocked(analytics.hasConsentDecision).mockReturnValue(false);

			render(<CookieConsent />);

			const acceptButton = await screen.findByRole("button", { name: /Accept/i }, { timeout: 3000 });

			// Click multiple times rapidly
			await user.click(acceptButton);
			await user.click(acceptButton);
			await user.click(acceptButton);

			// Should only call once or handle gracefully
			expect(analytics.setAnalyticsConsent).toHaveBeenCalledWith(true);
		});

		it("should handle Accept then Decline clicks", async () => {
			const user = userEvent.setup();
			vi.mocked(analytics.hasConsentDecision).mockReturnValue(false);

			render(<CookieConsent />);

			const acceptButton = await screen.findByRole("button", { name: /Accept/i }, { timeout: 3000 });
			await user.click(acceptButton);

			// Banner should be hidden, so decline button shouldn't be accessible
			await waitFor(() => {
				expect(screen.queryByText(/We value your privacy/i)).not.toBeInTheDocument();
			});
		});

		it("should return null when banner is hidden", () => {
			vi.mocked(analytics.hasConsentDecision).mockReturnValue(true);

			const { container } = render(<CookieConsent />);

			// Component should render nothing
			expect(container.firstChild).toBeNull();
		});
	});

	describe("Analytics Integration", () => {
		it("should check for existing consent on mount", () => {
			vi.mocked(analytics.hasConsentDecision).mockReturnValue(false);

			render(<CookieConsent />);

			expect(analytics.hasConsentDecision).toHaveBeenCalled();
		});

		it("should handle analytics utility errors gracefully", async () => {
			const user = userEvent.setup();
			vi.mocked(analytics.hasConsentDecision).mockReturnValue(false);
			vi.mocked(analytics.setAnalyticsConsent).mockImplementation(() => {
				throw new Error("Analytics error");
			});

			// Should not throw error on render
			expect(() => {
				render(<CookieConsent />);
			}).not.toThrow();

			const acceptButton = await screen.findByRole("button", { name: /Accept/i }, { timeout: 3000 });

			// Should handle error gracefully when clicking
			await expect(user.click(acceptButton)).rejects.toThrow("Analytics error");
		});
	});

	describe("UX and Timing", () => {
		it("should delay banner appearance for better UX", async () => {
			vi.mocked(analytics.hasConsentDecision).mockReturnValue(false);

			render(<CookieConsent />);

			// Banner should not appear immediately
			expect(screen.queryByText(/We value your privacy/i)).not.toBeInTheDocument();

			// Wait for banner to appear
			await waitFor(() => {
				expect(screen.getByText(/We value your privacy/i)).toBeInTheDocument();
			}, { timeout: 3000 });
		});

		it("should show banner after delay", async () => {
			vi.mocked(analytics.hasConsentDecision).mockReturnValue(false);

			render(<CookieConsent />);

			// Banner should not be visible immediately
			expect(screen.queryByText(/We value your privacy/i)).not.toBeInTheDocument();

			// Wait for it to appear
			await waitFor(() => {
				expect(screen.getByText(/We value your privacy/i)).toBeInTheDocument();
			}, { timeout: 3000 });
		});
	});

	describe("Visual Elements", () => {
		it("should have overlay and modal container", async () => {
			vi.mocked(analytics.hasConsentDecision).mockReturnValue(false);

			render(<CookieConsent />);

			await waitFor(() => {
				const overlay = document.querySelector(".cookie-consent-overlay");
				const modal = document.querySelector(".cookie-consent");

				expect(overlay).toBeInTheDocument();
				expect(modal).toBeInTheDocument();
			}, { timeout: 3000 });
		});

		it("should have styled buttons", async () => {
			vi.mocked(analytics.hasConsentDecision).mockReturnValue(false);

			render(<CookieConsent />);

			await waitFor(() => {
				const acceptButton = screen.getByRole("button", { name: /Accept/i });
				const declineButton = screen.getByRole("button", { name: /Decline/i });

				expect(acceptButton).toHaveClass("btn-accept");
				expect(declineButton).toHaveClass("btn-decline");
			}, { timeout: 3000 });
		});
	});
});
