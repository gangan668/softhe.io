import { useState } from "react";
import useRateLimit from "../hooks/useRateLimit";
import "./Contact.css";

function Contact() {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		subject: "",
		hardware: "",
		message: "",
	});

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitStatus, setSubmitStatus] = useState({ type: "", message: "" });
	const [honeypot, setHoneypot] = useState(""); // Bot detection

	// Rate limiting: 3 attempts per minute
	const rateLimit = useRateLimit(3, 60000);

	/**
	 * Sanitize input to prevent XSS
	 */
	const sanitizeInput = (input) => {
		return input
			.replace(/[<>]/g, "") // Remove < and >
			.slice(0, 1000); // Limit length
	};

	/**
	 * Validate email format
	 */
	const isValidEmail = (email) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	/**
	 * Validate form data
	 */
	const validateForm = () => {
		const trimmedName = formData.name.trim();
		if (!trimmedName || trimmedName.length < 2) {
			setSubmitStatus({
				type: "error",
				message: "Please enter a valid name",
			});
			return false;
		}

		if (!isValidEmail(formData.email)) {
			setSubmitStatus({
				type: "error",
				message: "Please enter a valid email address",
			});
			return false;
		}

		if (!formData.subject) {
			setSubmitStatus({
				type: "error",
				message: "Please select a subject",
			});
			return false;
		}

		const trimmedMessage = formData.message.trim();
		if (!trimmedMessage || trimmedMessage.length < 10) {
			setSubmitStatus({
				type: "error",
				message: "Please enter a message",
			});
			return false;
		}

		if (formData.message.length > 2000) {
			setSubmitStatus({
				type: "error",
				message: "Message is too long (maximum 2000 characters).",
			});
			return false;
		}

		return true;
	};

	const handleChange = (e) => {
		const { name, value } = e.target;

		// Apply sanitization but preserve spaces
		const sanitizedValue = sanitizeInput(value);

		setFormData({
			...formData,
			[name]: sanitizedValue,
		});

		// Clear success message when user starts typing
		if (submitStatus.type === "success") {
			setSubmitStatus({ type: "", message: "" });
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Honeypot check - if filled, it's a bot
		if (honeypot) {
			console.warn("Bot detected via honeypot");
			return;
		}

		// Clear previous status
		setSubmitStatus({ type: "", message: "" });

		// Validate form
		if (!validateForm()) {
			return;
		}

		// Check rate limit
		if (rateLimit.isBlocked) {
			setSubmitStatus({
				type: "error",
				message: rateLimit.getBlockMessage(),
			});
			return;
		}

		// Attempt submission with rate limiting
		try {
			const success = await rateLimit.attempt(async () => {
				setIsSubmitting(true);

				// Simulate API call (replace with actual backend endpoint)
				await new Promise((resolve) => setTimeout(resolve, 1500));

				// In production, you would send to your backend:
				// const response = await fetch('/api/contact', {
				//   method: 'POST',
				//   headers: { 'Content-Type': 'application/json' },
				//   body: JSON.stringify({
				//     name: formData.name,
				//     email: formData.email,
				//     subject: formData.subject,
				//     hardware: formData.hardware,
				//     message: formData.message,
				//     timestamp: Date.now()
				//   })
				// });

				setSubmitStatus({
					type: "success",
					message: "Thank you for your message",
				});

				// Reset form on success
				setFormData({
					name: "",
					email: "",
					subject: "",
					hardware: "",
					message: "",
				});
			});

			if (!success) {
				setSubmitStatus({
					type: "error",
					message: rateLimit.getBlockMessage(),
				});
			}
		} catch (error) {
			console.error("Form submission error:", error);
			setSubmitStatus({
				type: "error",
				message:
					"An error occurred. Please try again or contact us directly at support@softhe.io",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="contact-page">
			<section className="page-header">
				<div className="container">
					<h1>Get In Touch</h1>
					<p>
						Ready to optimize your gaming experience? We're here to
						help you dominate the competition.
					</p>
				</div>
			</section>

			<section className="contact-hero">
				<div className="container">
					<div className="contact-grid">
						<div className="contact-info">
							<h2>Contact Information</h2>
							<p className="contact-description">
								Our team of PC optimization experts is available
								24/7 to help you achieve peak gaming
								performance. Choose your preferred method of
								communication below.
							</p>

							<div className="contact-methods">
								<div className="contact-method primary-contact">
									<div className="contact-icon">
										<i className="fas fa-envelope"></i>
									</div>
									<div className="contact-details">
										<h3>Email Support</h3>
										<p>
											Primary contact method for all
											inquiries
										</p>
										<a
											href="mailto:support@softhe.io"
											className="contact-link"
										>
											support@softhe.io
										</a>
										<span className="response-time">
											Response within 2-4 hours
										</span>
									</div>
								</div>

								<div className="contact-method">
									<div className="contact-icon">
										<i className="fab fa-discord"></i>
									</div>
									<div className="contact-details">
										<h3>Discord Support</h3>
										<p>
											Real-time chat and community support
										</p>
										<a
											href="https://discord.com/users/softhecs"
											className="contact-link"
											target="_blank"
											rel="noreferrer"
										>
											@softhecs
										</a>
										<span className="response-time">
											Usually online 12-20 GMT+2
										</span>
									</div>
								</div>
							</div>

							{/* Security & Privacy Notice */}
							<div className="security-notice">
								<i className="fas fa-shield-alt"></i>
								<div>
									<h4>Your Privacy Matters</h4>
									<p>
										All communications are encrypted and
										your data is never shared with third
										parties.
									</p>
								</div>
							</div>
						</div>

						<div className="contact-form-section">
							<div className="contact-form-container">
								<h2>Send Us a Message</h2>
								<p>
									Have a specific question? Fill out the form
									below and we'll get back to you quickly.
								</p>

								{/* Rate Limit Warning */}
								{rateLimit.isBlocked && (
									<div className="rate-limit-warning" role="alert" aria-live="polite">
										<i className="fas fa-exclamation-triangle"></i>
										<div>
											<p>{rateLimit.getBlockMessage()}</p>
										</div>
									</div>
								)}

								{/* Attempts Left Indicator */}
								{!rateLimit.isBlocked &&
									rateLimit.attemptsLeft < 3 &&
									rateLimit.attemptsLeft > 0 && (
										<div className="attempts-notice">
											<i className="fas fa-info-circle"></i>
											<span>
												{rateLimit.attemptsLeft}{" "}
												submission
												{rateLimit.attemptsLeft !== 1
													? "s"
													: ""}{" "}
												remaining in the next minute
											</span>
										</div>
									)}

								<form
									className="contact-form"
									onSubmit={handleSubmit}
								>
									{/* Honeypot field - hidden from users, bots will fill it */}
									<input
										type="text"
										name="website"
										value={honeypot}
										onChange={(e) =>
											setHoneypot(e.target.value)
										}
										style={{
											position: "absolute",
											left: "-9999px",
											width: "1px",
											height: "1px",
										}}
										tabIndex="-1"
										autoComplete="off"
										aria-hidden="true"
									/>

									<div className="form-group">
										<label htmlFor="name">
											Full Name{" "}
											<span className="required">*</span>
										</label>
										<input
											type="text"
											id="name"
											name="name"
											value={formData.name}
											onChange={handleChange}
											required
											maxLength="100"
											disabled={
												isSubmitting ||
												rateLimit.isBlocked
											}
											placeholder="John Doe"
										/>
									</div>

									<div className="form-group">
										<label htmlFor="email">
											Email Address{" "}
											<span className="required">*</span>
										</label>
										<input
											type="email"
											id="email"
											name="email"
											value={formData.email}
											onChange={handleChange}
											required
											maxLength="100"
											disabled={
												isSubmitting ||
												rateLimit.isBlocked
											}
											placeholder="john@example.com"
										/>
									</div>

									<div className="form-group">
										<label htmlFor="subject">
											Subject{" "}
											<span className="required">*</span>
										</label>
										<select
											id="subject"
											name="subject"
											value={formData.subject}
											onChange={handleChange}
											required
											disabled={
												isSubmitting ||
												rateLimit.isBlocked
											}
										>
											<option value="">
												Select a topic
											</option>
											<option value="general">
												General Inquiry
											</option>
											<option value="technical">
												Technical Support
											</option>
											<option value="sales">
												Sales Question
											</option>
											<option value="custom">
												Custom Optimization
											</option>
											<option value="billing">
												Billing Support
											</option>
										</select>
									</div>

									<div className="form-group">
										<label htmlFor="hardware">
											Your Hardware (Optional)
										</label>
										<input
											type="text"
											id="hardware"
											name="hardware"
											value={formData.hardware}
											onChange={handleChange}
											maxLength="200"
											disabled={
												isSubmitting ||
												rateLimit.isBlocked
											}
											placeholder="e.g., RTX 4080, i7-13700K, 32GB RAM"
										/>
									</div>

									<div className="form-group">
										<label htmlFor="message">
											Message{" "}
											<span className="required">*</span>
										</label>
										<textarea
											id="message"
											name="message"
											rows="6"
											value={formData.message}
											onChange={handleChange}
											required
											maxLength="2000"
											disabled={
												isSubmitting ||
												rateLimit.isBlocked
											}
											placeholder="Tell us about your gaming setup and what you're looking to optimize..."
										></textarea>
										<div className="character-count">
											{formData.message.length} / 2000
											characters
										</div>
									</div>

									{/* Status Messages */}
									{submitStatus.type && (
										<div
											className={`form-status ${submitStatus.type}`}
											role={
												submitStatus.type === "error"
													? "alert"
													: submitStatus.type === "success"
														? "status"
														: undefined
											}
											aria-live={submitStatus.type ? "polite" : undefined}
											aria-atomic="true"
											data-testid="form-status"
										>
											<i
												className={`fas ${submitStatus.type === "success"
														? "fa-check-circle"
														: "fa-exclamation-circle"
													}`}
												aria-hidden="true"
											></i>
											<span>{submitStatus.message}</span>
										</div>
									)}

									<button
										type="submit"
										className="btn btn-primary form-submit"
										disabled={
											isSubmitting || rateLimit.isBlocked
										}
									>
										{isSubmitting ? (
											<>
												<i className="fas fa-spinner fa-spin"></i>
												Sending...
											</>
										) : (
											<>
												<i className="fas fa-paper-plane"></i>
												Send Message
											</>
										)}
									</button>

									<p className="form-note">
										<i className="fas fa-lock"></i>
										Your information is protected and will
										never be shared.
									</p>
								</form>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}

export default Contact;
