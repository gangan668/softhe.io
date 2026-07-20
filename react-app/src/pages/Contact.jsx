import { useState } from "react";
import useRateLimit from "../hooks/useRateLimit";
import SEO from '../components/SEO';
import { siteConfig } from '../config/site';
import { trackFormSubmission } from '../utils/analytics';
import { submitContactForm } from '../utils/contact';
import { contactFormEnabled } from '../utils/runtimeConfig';
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
	const [errors, setErrors] = useState({});
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
		const newErrors = {};

		const trimmedName = formData.name.trim();
		if (!trimmedName || trimmedName.length < 2) {
			newErrors.name = "Please enter a valid name";
		}

		if (!isValidEmail(formData.email)) {
			newErrors.email = "Please enter a valid email address";
		}

		if (!formData.subject) {
			newErrors.subject = "Please select a subject";
		}

		const trimmedMessage = formData.message.trim();
		if (!trimmedMessage || trimmedMessage.length < 10) {
			newErrors.message = "Please enter a message";
		} else if (formData.message.length > 2000) {
			newErrors.message = "Message is too long (maximum 2000 characters).";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleChange = (e) => {
		const { name, value } = e.target;

		// Apply sanitization but preserve spaces
		const sanitizedValue = sanitizeInput(value);

		setFormData({
			...formData,
			[name]: sanitizedValue,
		});

		// Clear error for this field when user starts typing
		if (errors[name]) {
			setErrors({
				...errors,
				[name]: undefined,
			});
		}

		// Clear success message when user starts typing
		if (submitStatus.type === "success") {
			setSubmitStatus({ type: "", message: "" });
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!contactFormEnabled) {
			setSubmitStatus({
				type: "error",
				message: `The web form is not active yet. Please email ${siteConfig.supportEmail} instead.`,
			});
			return;
		}

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

		// Set submitting state immediately to disable button and show loading
		setIsSubmitting(true);

		// Attempt submission with rate limiting
		try {
			const success = await rateLimit.attempt(async () => {
				await submitContactForm(formData, honeypot);

				setSubmitStatus({
					type: "success",
					message: "Thank you for your message",
				});
				trackFormSubmission("contact", formData.subject || "general");

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
				message: error.message || `An error occurred. Please contact ${siteConfig.supportEmail}`,
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<SEO
				title="Contact Us - Get Expert PC Optimization Support | Softhe.io"
				description="Contact Softhe.io for PC optimization support. Get help with custom Windows ISOs, BIOS tuning, compatibility questions, and setup guidance."
				keywords="contact pc optimization, gaming support, technical support, pc optimization help, custom windows support, bios tuning support, gaming pc help"
				ogTitle="Contact Softhe.io - Expert Gaming PC Optimization Support"
				ogDescription="Need help choosing or setting up a PC optimization product? Email and Discord support are available."
			/>
			<div className="contact-page">
				<section className="page-header">
					<div className="container">
						<h1>Get In Touch</h1>
						<p>
							Questions about compatibility, setup, or which product fits your
							PC? Send the details and we will help you choose the right path.
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
									to help with product questions, setup guidance,
									and compatibility checks. Choose your preferred
									contact method below.
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
											href={`mailto:${siteConfig.supportEmail}`}
												className="contact-link"
											>
											{siteConfig.supportEmail}
											</a>
											<span className="response-time">
												Response times vary with request volume
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
											href={siteConfig.social.discord}
												className="contact-link"
												target="_blank"
												rel="noreferrer"
											>
												@softhecs
											</a>
											<span className="response-time">
												Availability varies
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
											Form submissions are sent securely through
											EmailJS so our support team can reply.
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

									{contactFormEnabled ? (
									<form
										className="contact-form"
										onSubmit={handleSubmit}
										noValidate
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
												aria-invalid={errors.name ? "true" : "false"}
												aria-describedby={errors.name ? "name-error" : undefined}
											/>
											{errors.name && (
												<div
													id="name-error"
													role="alert"
													aria-label={errors.name}
													aria-live="assertive"
													className="form-status error"
													data-testid="form-status"
												>
													<i className="fas fa-exclamation-circle" aria-hidden="true"></i>
													{errors.name}
												</div>
											)}
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
												aria-invalid={errors.email ? "true" : "false"}
												aria-describedby={errors.email ? "email-error" : undefined}
											/>
											{errors.email && (
												<div
													id="email-error"
													role="alert"
													aria-label={errors.email}
													aria-live="assertive"
													className="form-status error"
													data-testid="form-status"
												>
													<i className="fas fa-exclamation-circle" aria-hidden="true"></i>
													{errors.email}
												</div>
											)}
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
												aria-invalid={errors.subject ? "true" : "false"}
												aria-describedby={errors.subject ? "subject-error" : undefined}
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
											{errors.subject && (
												<div
													id="subject-error"
													role="alert"
													aria-label={errors.subject}
													aria-live="assertive"
													className="form-status error"
													data-testid="form-status"
												>
													<i className="fas fa-exclamation-circle" aria-hidden="true"></i>
													{errors.subject}
												</div>
											)}
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
												aria-invalid={errors.message ? "true" : "false"}
												aria-describedby={errors.message ? "message-error" : undefined}
											></textarea>
											<div className="character-count">
												{formData.message.length} / 2000
												characters
											</div>
											{errors.message && (
												<div
													id="message-error"
													role="alert"
													aria-label={errors.message}
													aria-live="assertive"
													className="form-status error"
													data-testid="form-status"
												>
													<i className="fas fa-exclamation-circle" aria-hidden="true"></i>
													{errors.message}
												</div>
											)}
										</div>

										{/* Success Message */}
										{submitStatus.type === "success" && (
											<div
												className="form-status success"
												role="status"
												aria-live="polite"
												aria-atomic="true"
												data-testid="form-status"
												aria-label={submitStatus.message}
											>
												<i className="fas fa-check-circle" aria-hidden="true"></i>
												{submitStatus.message}
											</div>
										)}

										{/* General Error Message (for rate limiting, etc.) */}
										{submitStatus.type === "error" && (
											<div
												className="form-status error"
												role="alert"
												aria-live="assertive"
												aria-atomic="true"
												data-testid="form-status"
												aria-label={submitStatus.message}
											>
												<i className="fas fa-exclamation-circle" aria-hidden="true"></i>
												{submitStatus.message}
											</div>
										)}

										<button
											type="submit"
											className="btn btn-primary form-submit"
											disabled={isSubmitting || rateLimit.isBlocked}
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
											Your message is processed by EmailJS and
											delivered to our support inbox.
										</p>
									</form>
									) : (
										<div className="contact-offline-action">
											<p>The online form is unavailable until its delivery and privacy checks pass.</p>
											<a className="btn btn-primary" href={`mailto:${siteConfig.supportEmail}`}>
												<i className="fas fa-envelope" aria-hidden="true"></i>
												Email support
											</a>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</section>
			</div>
		</>
	);
}

export default Contact;
