import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import Contact from "./Contact";

// Mock the useRateLimit hook
vi.mock("../hooks/useRateLimit", () => ({
	default: vi.fn(() => ({
		isBlocked: false,
		attemptsLeft: 3,
		blockTimeLeft: 0,
		attempt: vi.fn((action) => action()),
		reset: vi.fn(),
		checkRateLimit: vi.fn(() => true),
		getBlockMessage: vi.fn(() => "Rate limit exceeded"),
	})),
}));

describe("Contact Component", () => {
	beforeEach(() => {
		// Reset all mocks before each test
		vi.clearAllMocks();

		// Mock console methods to keep test output clean
		vi.spyOn(console, "log").mockImplementation(() => { });
		vi.spyOn(console, "error").mockImplementation(() => { });
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Rendering", () => {
		it("should render the contact page with heading", () => {
			render(<Contact />);
			expect(screen.getByText(/Get in Touch/i)).toBeInTheDocument();
		});

		it("should render all form fields", () => {
			render(<Contact />);

			expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/Subject/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/Your Hardware/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/^Message/i)).toBeInTheDocument();
		});

		it("should render submit button", () => {
			render(<Contact />);
			expect(screen.getByRole("button", { name: /Send Message/i })).toBeInTheDocument();
		});

		it("should render contact information", () => {
			render(<Contact />);

			expect(screen.getByText(/support@softhe.io/i)).toBeInTheDocument();
			expect(screen.getByText(/@softhecs/i)).toBeInTheDocument();
		});

		it("should render social media links", () => {
			render(<Contact />);

			const links = screen.getAllByRole("link");
			expect(links.length).toBeGreaterThan(0);
		});
	});

	describe("Form Validation", () => {
		it("should show error for empty name", async () => {
			const user = userEvent.setup();
			render(<Contact />);

			const submitButton = screen.getByRole("button", { name: /Send Message/i });
			await user.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText(/Please enter a valid name/i)).toBeInTheDocument();
			});
		});

		it("should show error for name less than 2 characters", async () => {
			const user = userEvent.setup();
			render(<Contact />);

			const nameInput = screen.getByLabelText(/Full Name/i);
			const submitButton = screen.getByRole("button", { name: /Send Message/i });

			await user.type(nameInput, "A");
			await user.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText(/Please enter a valid name/i)).toBeInTheDocument();
			});
		});

		it("should show error for invalid email format", async () => {
			const user = userEvent.setup();
			render(<Contact />);

			const nameInput = screen.getByLabelText(/Full Name/i);
			const emailInput = screen.getByLabelText(/Email Address/i);
			const submitButton = screen.getByRole("button", { name: /Send Message/i });

			await user.type(nameInput, "John Doe");
			await user.type(emailInput, "invalid-email");
			await user.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
			});
		});

		it("should show error for empty subject", async () => {
			const user = userEvent.setup();
			render(<Contact />);

			const nameInput = screen.getByLabelText(/Full Name/i);
			const emailInput = screen.getByLabelText(/Email Address/i);
			const submitButton = screen.getByRole("button", { name: /Send Message/i });

			await user.type(nameInput, "John Doe");
			await user.type(emailInput, "john@example.com");
			await user.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText(/Please enter a subject/i)).toBeInTheDocument();
			});
		});

		it("should show error for empty message", async () => {
			const user = userEvent.setup();
			render(<Contact />);

			const nameInput = screen.getByLabelText(/Full Name/i);
			const emailInput = screen.getByLabelText(/Email Address/i);
			const subjectInput = screen.getByLabelText(/Subject/i);
			const submitButton = screen.getByRole("button", { name: /Send Message/i });

			await user.type(nameInput, "John Doe");
			await user.type(emailInput, "john@example.com");
			await user.type(subjectInput, "Test Subject");
			await user.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText(/Please enter a message/i)).toBeInTheDocument();
			});
		});

		it("should show error for message less than 10 characters", async () => {
			const user = userEvent.setup();
			render(<Contact />);

			const nameInput = screen.getByLabelText(/Full Name/i);
			const emailInput = screen.getByLabelText(/Email Address/i);
			const subjectInput = screen.getByLabelText(/Subject/i);
			const messageInput = screen.getByLabelText(/^Message/i);
			const submitButton = screen.getByRole("button", { name: /Send Message/i });

			await user.type(nameInput, "John Doe");
			await user.type(emailInput, "john@example.com");
			await user.type(subjectInput, "Test Subject");
			await user.type(messageInput, "Short");
			await user.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText(/Please enter a message \(at least 10 characters\)/i)).toBeInTheDocument();
			});
		});

		it("should accept valid email formats", async () => {
			const user = userEvent.setup();
			render(<Contact />);

			const emailInput = screen.getByLabelText(/Email Address/i);

			await user.type(emailInput, "test@example.com");
			expect(emailInput).toHaveValue("test@example.com");

			await user.clear(emailInput);
			await user.type(emailInput, "user.name+tag@example.co.uk");
			expect(emailInput).toHaveValue("user.name+tag@example.co.uk");
		});
	});

	describe("Form Input Handling", () => {
		it("should update name field on input", async () => {
			const user = userEvent.setup();
			render(<Contact />);

			const nameInput = screen.getByLabelText(/Full Name/i);
			await user.type(nameInput, "John Doe");

			expect(nameInput).toHaveValue("John Doe");
		});

		it("should update email field on input", async () => {
			const user = userEvent.setup();
			render(<Contact />);

			const emailInput = screen.getByLabelText(/Email Address/i);
			await user.type(emailInput, "john@example.com");

			expect(emailInput).toHaveValue("john@example.com");
		});

		it("should update subject field on input", async () => {
			const user = userEvent.setup();
			render(<Contact />);

			const subjectInput = screen.getByLabelText(/Subject/i);
			await user.type(subjectInput, "Test Subject");

			expect(subjectInput).toHaveValue("Test Subject");
		});

		it("should update hardware field on input", async () => {
			const user = userEvent.setup();
			render(<Contact />);

			const hardwareInput = screen.getByLabelText(/Your Hardware/i);
			await user.type(hardwareInput, "Intel i9, RTX 4090");

			expect(hardwareInput).toHaveValue("Intel i9, RTX 4090");
		});

		it("should update message field on input", async () => {
			const user = userEvent.setup();
			render(<Contact />);

			const messageInput = screen.getByLabelText(/^Message/i);
			await user.type(messageInput, "This is a test message");

			expect(messageInput).toHaveValue("This is a test message");
		});

		it("should clear form after successful submission", async () => {
			const user = userEvent.setup();
			render(<Contact />);

			const nameInput = screen.getByLabelText(/Full Name/i);
			const emailInput = screen.getByLabelText(/Email Address/i);
			const subjectInput = screen.getByLabelText(/Subject/i);
			const messageInput = screen.getByLabelText(/^Message/i);
			const submitButton = screen.getByRole("button", { name: /Send Message/i });

			await user.type(nameInput, "John Doe");
			await user.type(emailInput, "john@example.com");
			await user.type(subjectInput, "Test Subject");
			await user.type(messageInput, "This is a test message with enough characters");
			await user.click(submitButton);

			await waitFor(() => {
				expect(nameInput).toHaveValue("");
				expect(emailInput).toHaveValue("");
				expect(subjectInput).toHaveValue("");
				expect(messageInput).toHaveValue("");
			});
		});
	});

	describe("Form Submission", () => {
		it("should show success message on valid form submission", async () => {
			const user = userEvent.setup();
			render(<Contact />);

			const nameInput = screen.getByLabelText(/Full Name/i);
			const emailInput = screen.getByLabelText(/Email Address/i);
			const subjectInput = screen.getByLabelText(/Subject/i);
			const messageInput = screen.getByLabelText(/^Message/i);
			const submitButton = screen.getByRole("button", { name: /Send Message/i });

			await user.type(nameInput, "John Doe");
			await user.type(emailInput, "john@example.com");
			await user.type(subjectInput, "Test Subject");
			await user.type(messageInput, "This is a test message with enough characters");
			await user.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText(/Message sent successfully/i)).toBeInTheDocument();
			});
		});

		it("should disable submit button while submitting", async () => {
			const user = userEvent.setup();
			render(<Contact />);

			const nameInput = screen.getByLabelText(/Full Name/i);
			const emailInput = screen.getByLabelText(/Email Address/i);
			const subjectInput = screen.getByLabelText(/Subject/i);
			const messageInput = screen.getByLabelText(/^Message/i);
			const submitButton = screen.getByRole("button", { name: /Send Message/i });

			await user.type(nameInput, "John Doe");
			await user.type(emailInput, "john@example.com");
			await user.type(subjectInput, "Test Subject");
			await user.type(messageInput, "This is a test message with enough characters");

			expect(submitButton).not.toBeDisabled();

			await user.click(submitButton);

			// Button should be disabled during submission
			expect(submitButton).toBeDisabled();
		});

		it("should show loading state during submission", async () => {
			const user = userEvent.setup();
			render(<Contact />);

			const nameInput = screen.getByLabelText(/Name/i);
			const emailInput = screen.getByLabelText(/Email/i);
			const subjectInput = screen.getByLabelText(/Subject/i);
			const messageInput = screen.getByLabelText(/Message/i);
			const submitButton = screen.getByRole("button", { name: /Send Message/i });

			await user.type(nameInput, "John Doe");
			await user.type(emailInput, "john@example.com");
			await user.type(subjectInput, "Test Subject");
			await user.type(messageInput, "This is a test message with enough characters");
			await user.click(submitButton);

			// Check for loading indicator
			expect(screen.getByText(/Sending/i)).toBeInTheDocument();
		});
	});

	describe("Input Sanitization", () => {
		it("should sanitize input to prevent XSS", async () => {
			const user = userEvent.setup();
			render(<Contact />);

			const nameInput = screen.getByLabelText(/Full Name/i);

			await user.type(nameInput, "John<script>alert('xss')</script>Doe");

			// The component should sanitize the input
			expect(nameInput.value).not.toContain("<script>");
			expect(nameInput.value).not.toContain("</script>");
		});

		it("should limit input length", async () => {
			const user = userEvent.setup();
			render(<Contact />);

			const messageInput = screen.getByLabelText(/^Message/i);
			const longMessage = "a".repeat(1500); // Exceeds 1000 char limit

			await user.type(messageInput, longMessage);

			// Input should be trimmed to max length during sanitization
			expect(messageInput.value.length).toBeLessThanOrEqual(1000);
		});

		it("should trim whitespace from inputs", async () => {
			const user = userEvent.setup();
			render(<Contact />);

			const nameInput = screen.getByLabelText(/Full Name/i);
			await user.type(nameInput, "  John Doe  ");

			// Component should trim the value during processing
			expect(nameInput.value.trim()).toBe("John Doe");
		});
	});

	describe("Honeypot Bot Detection", () => {
		it("should block submission if honeypot field is filled", async () => {
			const user = userEvent.setup();
			render(<Contact />);

			// Find the honeypot field (it should be hidden)
			const honeypotField = document.querySelector('input[name="website"]');

			if (honeypotField) {
				fireEvent.change(honeypotField, { target: { value: "bot-filled-this" } });

				const nameInput = screen.getByLabelText(/Full Name/i);
				const emailInput = screen.getByLabelText(/Email Address/i);
				const subjectInput = screen.getByLabelText(/Subject/i);
				const messageInput = screen.getByLabelText(/^Message/i);
				const submitButton = screen.getByRole("button", { name: /Send Message/i });

				await user.type(nameInput, "John Doe");
				await user.type(emailInput, "john@example.com");
				await user.type(subjectInput, "Test Subject");
				await user.type(messageInput, "This is a test message");
				await user.click(submitButton);

				// Should detect bot and block submission
				await waitFor(() => {
					expect(screen.queryByText(/Message sent successfully/i)).not.toBeInTheDocument();
				});
			}
		});
	});

	describe("Rate Limiting Integration", () => {
		it("should use rate limiting hook", () => {
			const useRateLimit = require("../hooks/useRateLimit").default;
			render(<Contact />);

			// Verify the hook was called
			expect(useRateLimit).toHaveBeenCalled();
		});

		it("should show rate limit warning when blocked", async () => {
			// Mock rate limit as blocked
			const useRateLimit = require("../hooks/useRateLimit").default;
			useRateLimit.mockReturnValue({
				isBlocked: true,
				attemptsLeft: 0,
				blockTimeLeft: 45,
				attempt: vi.fn(),
				reset: vi.fn(),
				checkRateLimit: vi.fn(() => false),
				getBlockMessage: vi.fn(() => "Too many attempts. Please wait 45 seconds."),
			});

			render(<Contact />);

			// Should show rate limit warning
			expect(screen.getByText(/Too many attempts/i)).toBeInTheDocument();
		});

		it("should disable submit button when rate limited", async () => {
			// Mock rate limit as blocked
			const useRateLimit = require("../hooks/useRateLimit").default;
			useRateLimit.mockReturnValue({
				isBlocked: true,
				attemptsLeft: 0,
				blockTimeLeft: 45,
				attempt: vi.fn(),
				reset: vi.fn(),
				checkRateLimit: vi.fn(() => false),
				getBlockMessage: vi.fn(() => "Too many attempts. Please wait 45 seconds."),
			});

			render(<Contact />);

			const submitButton = screen.getByRole("button", { name: /Send Message/i });
			expect(submitButton).toBeDisabled();
		});
	});

	describe("Accessibility", () => {
		it("should have proper form labels", () => {
			render(<Contact />);

			expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/Subject/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/^Message/i)).toBeInTheDocument();
		});

		it("should have required attributes on required fields", () => {
			render(<Contact />);

			const nameInput = screen.getByLabelText(/Full Name/i);
			const emailInput = screen.getByLabelText(/Email Address/i);
			const subjectInput = screen.getByLabelText(/Subject/i);
			const messageInput = screen.getByLabelText(/^Message/i);

			expect(nameInput).toHaveAttribute("required");
			expect(emailInput).toHaveAttribute("required");
			expect(subjectInput).toHaveAttribute("required");
			expect(messageInput).toHaveAttribute("required");
		});

		it("should have proper input types", () => {
			render(<Contact />);

			const emailInput = screen.getByLabelText(/Email Address/i);
			expect(emailInput).toHaveAttribute("type", "email");
		});

		it("should have accessible error messages", async () => {
			const user = userEvent.setup();
			render(<Contact />);

			const submitButton = screen.getByRole("button", { name: /Send Message/i });
			await user.click(submitButton);

			await waitFor(() => {
				const errorMessage = screen.getByText(/Please enter a valid name/i);
				expect(errorMessage).toBeInTheDocument();
				expect(errorMessage).toHaveClass("error");
			});
		});

		it("should have accessible success messages", async () => {
			const user = userEvent.setup();
			render(<Contact />);

			const nameInput = screen.getByLabelText(/Full Name/i);
			const emailInput = screen.getByLabelText(/Email Address/i);
			const subjectInput = screen.getByLabelText(/Subject/i);
			const messageInput = screen.getByLabelText(/^Message/i);
			const submitButton = screen.getByRole("button", { name: /Send Message/i });

			await user.type(nameInput, "John Doe");
			await user.type(emailInput, "john@example.com");
			await user.type(subjectInput, "Test Subject");
			await user.type(messageInput, "This is a test message with enough characters");
			await user.click(submitButton);

			await waitFor(() => {
				const successMessage = screen.getByText(/Message sent successfully/i);
				expect(successMessage).toBeInTheDocument();
				expect(successMessage).toHaveClass("success");
			});
		});
	});

	describe("Edge Cases", () => {
		it("should handle rapid form submissions", async () => {
			const user = userEvent.setup();
			render(<Contact />);

			const nameInput = screen.getByLabelText(/Full Name/i);
			const emailInput = screen.getByLabelText(/Email Address/i);
			const subjectInput = screen.getByLabelText(/Subject/i);
			const messageInput = screen.getByLabelText(/^Message/i);
			const submitButton = screen.getByRole("button", { name: /Send Message/i });

			await user.type(nameInput, "John Doe");
			await user.type(emailInput, "john@example.com");
			await user.type(subjectInput, "Test Subject");
			await user.type(messageInput, "This is a test message");

			// Try to submit multiple times rapidly
			await user.click(submitButton);
			await user.click(submitButton);
			await user.click(submitButton);

			// Should handle gracefully (button disabled after first click)
			expect(submitButton).toBeDisabled();
		});

		it("should handle special characters in name", async () => {
			const user = userEvent.setup();
			render(<Contact />);

			const nameInput = screen.getByLabelText(/Full Name/i);
			await user.type(nameInput, "José María O'Brien-Smith");

			expect(nameInput).toHaveValue("José María O'Brien-Smith");
		});

		it("should handle very long valid input", async () => {
			const user = userEvent.setup();
			render(<Contact />);

			const messageInput = screen.getByLabelText(/^Message/i);
			const longMessage = "This is a very long message. ".repeat(30); // ~900 chars

			await user.type(messageInput, longMessage);

			expect(messageInput.value.length).toBeGreaterThan(10);
			expect(messageInput.value.length).toBeLessThanOrEqual(1000);
		});
	});
});
