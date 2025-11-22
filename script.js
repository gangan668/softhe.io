// ============================================================================
// MOBILE NAVIGATION
// ============================================================================

const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");
const body = document.body;

// Toggle mobile menu
function toggleMobileMenu(shouldOpen) {
	const isOpen = shouldOpen !== undefined ? shouldOpen : !navMenu.classList.contains("active");

	if (isOpen) {
		hamburger.classList.add("active");
		navMenu.classList.add("active");
		body.style.overflow = "hidden"; // Lock scroll
		hamburger.setAttribute("aria-expanded", "true");
	} else {
		hamburger.classList.remove("active");
		navMenu.classList.remove("active");
		body.style.overflow = ""; // Unlock scroll
		hamburger.setAttribute("aria-expanded", "false");
	}
}

// Hamburger click handler
if (hamburger) {
	hamburger.addEventListener("click", (e) => {
		e.stopPropagation();
		toggleMobileMenu();
	});
}

// Close menu when clicking on a link
document.querySelectorAll(".nav-link").forEach((link) => {
	link.addEventListener("click", () => {
		toggleMobileMenu(false);
	});
});

// Close menu when clicking outside
document.addEventListener("click", (e) => {
	if (navMenu && navMenu.classList.contains("active")) {
		// Check if click is outside both menu and hamburger
		if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
			toggleMobileMenu(false);
		}
	}
});

// Prevent clicks inside menu from closing it
if (navMenu) {
	navMenu.addEventListener("click", (e) => {
		e.stopPropagation();
	});
}

// Close menu on escape key
document.addEventListener("keydown", (e) => {
	if (e.key === "Escape" && navMenu && navMenu.classList.contains("active")) {
		toggleMobileMenu(false);
		hamburger.focus(); // Return focus to hamburger
	}
});

// Handle window resize - close menu if resizing to desktop
let resizeTimer;
window.addEventListener("resize", () => {
	clearTimeout(resizeTimer);
	resizeTimer = setTimeout(() => {
		if (window.innerWidth > 768 && navMenu && navMenu.classList.contains("active")) {
			toggleMobileMenu(false);
		}
	}, 250);
});

// ============================================================================
// NAVIGATION ACTIVE STATE
// ============================================================================

// Highlight current page in navigation
function setActiveNavLink() {
	const currentPath = window.location.pathname;
	const navLinks = document.querySelectorAll(".nav-link");

	navLinks.forEach((link) => {
		const linkPath = link.getAttribute("href");

		// Remove active class from all
		link.classList.remove("active");

		// Add active class to current page
		if (currentPath === linkPath ||
			(currentPath.includes(linkPath) && linkPath !== "/" && linkPath !== "#")) {
			link.classList.add("active");
		}

		// Special case for homepage
		if (currentPath === "/" && linkPath === "#") {
			link.classList.add("active");
		}
	});
}

// Set active link on page load
document.addEventListener("DOMContentLoaded", setActiveNavLink);

// ============================================================================
// PRODUCT DATA & STORE FUNCTIONALITY
// ============================================================================

const products = {
	"Custom Windows 10 Enterprise ISO": 50,
	"Windows 11 Pro Gaming Edition": 65,
	"BIOS Optimization Service": 75,
	"Premium Support Package": 25,
	"Ultimate Gaming Bundle": 120,
	"Pro Esports Package": 165,
};

// Store filter functionality
const filterButtons = document.querySelectorAll(".filter-btn");
const productCards = document.querySelectorAll(".product-card");

if (filterButtons.length > 0) {
	filterButtons.forEach((button) => {
		button.addEventListener("click", () => {
			// Remove active class from all buttons
			filterButtons.forEach((btn) => btn.classList.remove("active"));

			// Add active class to clicked button
			button.classList.add("active");

			const filter = button.getAttribute("data-filter");

			// Filter products with smooth animation
			productCards.forEach((card) => {
				if (filter === "all") {
					card.style.display = "block";
					setTimeout(() => {
						card.style.opacity = "1";
						card.style.transform = "translateY(0)";
					}, 10);
				} else {
					const category = card.getAttribute("data-category");
					if (category === filter) {
						card.style.display = "block";
						setTimeout(() => {
							card.style.opacity = "1";
							card.style.transform = "translateY(0)";
						}, 10);
					} else {
						card.style.opacity = "0";
						card.style.transform = "translateY(20px)";
						setTimeout(() => {
							card.style.display = "none";
						}, 300);
					}
				}
			});
		});
	});
}

// ============================================================================
// SMOOTH SCROLLING
// ============================================================================

// Debounce history updates to prevent rate limiting
let lastHistoryUpdate = 0;
const HISTORY_UPDATE_DELAY = 1000; // 1 second between updates

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
	anchor.addEventListener("click", function (e) {
		const href = this.getAttribute("href");

		// Skip if it's just "#" (homepage link)
		if (href === "#") return;

		e.preventDefault();
		const target = document.querySelector(href);

		if (target) {
			// Close mobile menu if open
			if (typeof toggleMobileMenu === 'function') {
				toggleMobileMenu(false);
			}

			// Scroll to target
			target.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});

			// Don't update history for anchor links - causes rate limiting errors
			// Users can still bookmark or share the page without fragment
		}
	});
});

// ============================================================================
// NAVBAR SCROLL EFFECT
// ============================================================================

let lastScrollY = window.scrollY;

window.addEventListener("scroll", () => {
	const navbar = document.querySelector(".navbar");

	if (navbar) {
		// Change navbar background on scroll
		if (window.scrollY > 100) {
			navbar.style.background = "rgba(15, 15, 35, 0.98)";
			navbar.style.backdropFilter = "blur(10px)";
		} else {
			navbar.style.background = "rgba(15, 15, 35, 0.95)";
			navbar.style.backdropFilter = "blur(5px)";
		}
	}

	lastScrollY = window.scrollY;
});

// ============================================================================
// SCROLL ANIMATIONS
// ============================================================================

const observerOptions = {
	threshold: 0.1,
	rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
	entries.forEach((entry) => {
		if (entry.isIntersecting) {
			entry.target.style.opacity = "1";
			entry.target.style.transform = "translateY(0)";
		}
	});
}, observerOptions);

// Observe elements for animation
document.querySelectorAll(".feature-card, .service-item, .product-card, .testimonial-card").forEach((el) => {
	el.style.opacity = "0";
	el.style.transform = "translateY(20px)";
	el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
	observer.observe(el);
});

// ============================================================================
// FORM HANDLING
// ============================================================================

// Enhanced form validation
function validateEmail(email) {
	const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return re.test(email);
}

function showFormError(input, message) {
	const formGroup = input.closest('.form-group');
	if (formGroup) {
		let errorElement = formGroup.querySelector('.form-error');
		if (!errorElement) {
			errorElement = document.createElement('span');
			errorElement.className = 'form-error';
			formGroup.appendChild(errorElement);
		}
		errorElement.textContent = message;
		input.classList.add('error');
	}
}

function clearFormError(input) {
	const formGroup = input.closest('.form-group');
	if (formGroup) {
		const errorElement = formGroup.querySelector('.form-error');
		if (errorElement) {
			errorElement.remove();
		}
		input.classList.remove('error');
	}
}

// Contact form functionality
const contactForm = document.getElementById('contactForm');
if (contactForm) {
	// Real-time validation
	const inputs = contactForm.querySelectorAll('input, textarea, select');
	inputs.forEach((input) => {
		input.addEventListener('blur', () => {
			if (input.value.trim() === '' && input.hasAttribute('required')) {
				showFormError(input, 'This field is required');
			} else if (input.type === 'email' && !validateEmail(input.value)) {
				showFormError(input, 'Please enter a valid email address');
			} else {
				clearFormError(input);
			}
		});

		input.addEventListener('input', () => {
			if (input.value.trim() !== '') {
				clearFormError(input);
			}
		});
	});

	// Form submission
	contactForm.addEventListener('submit', function (e) {
		e.preventDefault();

		// Clear previous errors
		inputs.forEach(clearFormError);

		// Get form data
		const formData = new FormData(contactForm);
		const data = Object.fromEntries(formData);

		// Validation
		let hasErrors = false;

		if (!data.name || data.name.trim() === '') {
			showFormError(contactForm.querySelector('[name="name"]'), 'Name is required');
			hasErrors = true;
		}

		if (!data.email || !validateEmail(data.email)) {
			showFormError(contactForm.querySelector('[name="email"]'), 'Valid email is required');
			hasErrors = true;
		}

		if (!data.subject || data.subject.trim() === '') {
			showFormError(contactForm.querySelector('[name="subject"]'), 'Subject is required');
			hasErrors = true;
		}

		if (!data.message || data.message.trim() === '') {
			showFormError(contactForm.querySelector('[name="message"]'), 'Message is required');
			hasErrors = true;
		}

		if (hasErrors) {
			return;
		}

		// Show loading state
		const submitButton = contactForm.querySelector('.form-submit');
		const originalText = submitButton.innerHTML;

		submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
		submitButton.disabled = true;

		// Simulate form submission
		// TODO: Replace with actual form submission service (Formspree, Web3Forms, etc.)
		setTimeout(() => {
			// Success state
			submitButton.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
			submitButton.classList.add('success');

			// Show success message
			const successMessage = document.createElement('div');
			successMessage.className = 'form-success-message';
			successMessage.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <strong>Thank you for your message!</strong>
        <p>We'll get back to you within 2-4 hours.</p>
      `;
			contactForm.insertAdjacentElement('beforebegin', successMessage);

			// Scroll to success message
			successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });

			// Reset form
			contactForm.reset();

			// Reset button after delay
			setTimeout(() => {
				successMessage.remove();
				submitButton.innerHTML = originalText;
				submitButton.disabled = false;
				submitButton.classList.remove('success');
			}, 5000);
		}, 2000);
	});
}

// ============================================================================
// NEWSLETTER FORM
// ============================================================================

const newsletterForms = document.querySelectorAll('.newsletter-form, #newsletterForm');
newsletterForms.forEach((form) => {
	form.addEventListener('submit', function (e) {
		e.preventDefault();

		const emailInput = form.querySelector('input[type="email"]');
		const submitButton = form.querySelector('button[type="submit"]');

		if (!emailInput || !validateEmail(emailInput.value)) {
			showFormError(emailInput, 'Please enter a valid email address');
			return;
		}

		clearFormError(emailInput);

		// Show loading state
		const originalText = submitButton.innerHTML;
		submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
		submitButton.disabled = true;

		// Simulate newsletter signup
		// TODO: Replace with actual newsletter service (Mailchimp, ConvertKit, etc.)
		setTimeout(() => {
			submitButton.innerHTML = '<i class="fas fa-check"></i>';
			emailInput.value = '';
			emailInput.placeholder = 'Subscribed! Check your email.';

			setTimeout(() => {
				submitButton.innerHTML = originalText;
				submitButton.disabled = false;
				emailInput.placeholder = 'your@email.com';
			}, 3000);
		}, 1500);
	});
});

// ============================================================================
// BACK TO TOP BUTTON
// ============================================================================

// Create back to top button
const backToTopButton = document.createElement('button');
backToTopButton.id = 'backToTop';
backToTopButton.className = 'back-to-top';
backToTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
backToTopButton.setAttribute('aria-label', 'Back to top');
document.body.appendChild(backToTopButton);

// Show/hide back to top button
window.addEventListener('scroll', () => {
	if (window.scrollY > 500) {
		backToTopButton.classList.add('visible');
	} else {
		backToTopButton.classList.remove('visible');
	}
});

// Back to top functionality
backToTopButton.addEventListener('click', () => {
	window.scrollTo({
		top: 0,
		behavior: 'smooth'
	});
});

// ============================================================================
// FAQ FUNCTIONALITY
// ============================================================================

// FAQ accordion
const faqQuestions = document.querySelectorAll('.faq-question');
faqQuestions.forEach((question) => {
	question.addEventListener('click', () => {
		const faqItem = question.parentElement;
		const isActive = faqItem.classList.contains('active');

		// Close all other FAQs
		document.querySelectorAll('.faq-item').forEach((item) => {
			if (item !== faqItem) {
				item.classList.remove('active');
			}
		});

		// Toggle current FAQ
		faqItem.classList.toggle('active');
	});
});

// FAQ search functionality
const faqSearch = document.getElementById('faqSearch');
if (faqSearch) {
	faqSearch.addEventListener('input', (e) => {
		const searchTerm = e.target.value.toLowerCase();
		const faqItems = document.querySelectorAll('.faq-item');

		faqItems.forEach((item) => {
			const question = item.querySelector('.faq-question span').textContent.toLowerCase();
			const answer = item.querySelector('.faq-answer').textContent.toLowerCase();

			if (question.includes(searchTerm) || answer.includes(searchTerm)) {
				item.style.display = 'block';
			} else {
				item.style.display = 'none';
			}
		});
	});
}

// FAQ category filter
const categoryButtons = document.querySelectorAll('.category-btn');
categoryButtons.forEach((button) => {
	button.addEventListener('click', () => {
		const category = button.getAttribute('data-category');

		// Update active button
		categoryButtons.forEach((btn) => btn.classList.remove('active'));
		button.classList.add('active');

		// Filter FAQs
		const faqCategories = document.querySelectorAll('.faq-category');
		faqCategories.forEach((cat) => {
			if (category === 'all' || cat.id === category) {
				cat.style.display = 'block';
			} else {
				cat.style.display = 'none';
			}
		});
	});
});

// ============================================================================
// PERFORMANCE OPTIMIZATIONS
// ============================================================================

// Lazy load images when they're about to enter viewport
if ('IntersectionObserver' in window) {
	const imageObserver = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				const img = entry.target;
				if (img.dataset.src) {
					img.src = img.dataset.src;
					img.removeAttribute('data-src');
					img.classList.add('loaded');
				}
				imageObserver.unobserve(img);
			}
		});
	}, {
		rootMargin: '50px'
	});

	document.querySelectorAll('img[data-src]').forEach((img) => {
		imageObserver.observe(img);
	});
}

// ============================================================================
// ACCESSIBILITY IMPROVEMENTS
// ============================================================================

// Trap focus within mobile menu when open
function trapFocus(element) {
	const focusableElements = element.querySelectorAll(
		'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
	);
	const firstFocusable = focusableElements[0];
	const lastFocusable = focusableElements[focusableElements.length - 1];

	element.addEventListener('keydown', (e) => {
		if (e.key !== 'Tab') return;

		if (e.shiftKey) {
			if (document.activeElement === firstFocusable) {
				e.preventDefault();
				lastFocusable.focus();
			}
		} else {
			if (document.activeElement === lastFocusable) {
				e.preventDefault();
				firstFocusable.focus();
			}
		}
	});
}

if (navMenu) {
	trapFocus(navMenu);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Debounce function for performance
function debounce(func, wait) {
	let timeout;
	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}

// Throttle function for scroll events
function throttle(func, limit) {
	let inThrottle;
	return function () {
		const args = arguments;
		const context = this;
		if (!inThrottle) {
			func.apply(context, args);
			inThrottle = true;
			setTimeout(() => inThrottle = false, limit);
		}
	};
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
	console.log('Softhe.io initialized ✓');

	// Set ARIA attributes
	if (hamburger) {
		hamburger.setAttribute('aria-expanded', 'false');
		hamburger.setAttribute('aria-controls', 'nav-menu');
	}

	if (navMenu) {
		navMenu.setAttribute('id', 'nav-menu');
	}
});
