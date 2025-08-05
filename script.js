// Mobile Navigation Toggle
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");

hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("active");
  navMenu.classList.toggle("active");
});

// Close mobile menu when clicking on a link
document.querySelectorAll(".nav-link").forEach((n) =>
  n.addEventListener("click", () => {
    hamburger.classList.remove("active");
    navMenu.classList.remove("active");
  })
);

// Product data
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

      productCards.forEach((card) => {
        if (filter === "all") {
          card.style.display = "block";
        } else {
          const category = card.getAttribute("data-category");
          if (category === filter) {
            card.style.display = "block";
          } else {
            card.style.display = "none";
          }
        }
      });
    });
  });
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// Navbar scroll effect
window.addEventListener("scroll", () => {
  const navbar = document.querySelector(".navbar");
  if (window.scrollY > 100) {
    navbar.style.background = "rgba(15, 15, 35, 0.98)";
  } else {
    navbar.style.background = "rgba(15, 15, 35, 0.95)";
  }
});

// Animation on scroll
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
document.querySelectorAll(".feature-card, .service-item, .product-card").forEach((el) => {
  el.style.opacity = "0";
  el.style.transform = "translateY(20px)";
  el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
  observer.observe(el);
});

// Contact form functionality
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData);
    
    // Simple validation
    if (!data.name || !data.email || !data.subject || !data.message) {
      alert('Please fill in all required fields.');
      return;
    }
    
    // Simulate form submission
    const submitButton = contactForm.querySelector('.form-submit');
    const originalText = submitButton.innerHTML;
    
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitButton.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
      alert('Thank you for your message! We\'ll get back to you within 2-4 hours.');
      contactForm.reset();
      submitButton.innerHTML = originalText;
      submitButton.disabled = false;
    }, 2000);
  });
}
