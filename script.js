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

// Store functionality
let cart = [];
let cartTotal = 0;

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

// Add to cart functionality
const addToCartButtons = document.querySelectorAll(".add-to-cart");
const cartSummary = document.getElementById("cart-summary");
const cartItems = document.getElementById("cart-items");
const cartTotalElement = document.getElementById("cart-total");

if (addToCartButtons.length > 0) {
  addToCartButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const productCard = e.target.closest(".product-card");
      const productName = productCard.querySelector("h3").textContent;
      const productPrice = products[productName];

      if (productPrice) {
        addToCart(productName, productPrice);
        updateCartDisplay();
        showCartSummary();

        // Visual feedback
        button.textContent = "Added!";
        button.style.background = "#10b981";
        setTimeout(() => {
          button.textContent = button.textContent.includes("Subscribe")
            ? "Subscribe"
            : "Add to Cart";
          button.style.background = "";
        }, 1000);
      }
    });
  });
}

function addToCart(name, price) {
  const existingItem = cart.find((item) => item.name === name);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ name, price, quantity: 1 });
  }
  cartTotal += price;
}

function updateCartDisplay() {
  if (!cartItems) return;

  cartItems.innerHTML = "";
  cart.forEach((item) => {
    const cartItem = document.createElement("div");
    cartItem.className = "cart-item";
    cartItem.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid var(--border-color);">
                <div>
                    <h4>${item.name}</h4>
                    <p>€${item.price} x ${item.quantity}</p>
                </div>
                <button onclick="removeFromCart('${item.name}')" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Remove</button>
            </div>
        `;
    cartItems.appendChild(cartItem);
  });

  if (cartTotalElement) {
    cartTotalElement.textContent = `€${cartTotal}`;
  }
}

function removeFromCart(name) {
  const itemIndex = cart.findIndex((item) => item.name === name);
  if (itemIndex > -1) {
    cartTotal -= cart[itemIndex].price * cart[itemIndex].quantity;
    cart.splice(itemIndex, 1);
    updateCartDisplay();
    if (cart.length === 0) {
      hideCartSummary();
    }
  }
}

function showCartSummary() {
  if (cartSummary) {
    cartSummary.style.display = "block";
  }
}

function hideCartSummary() {
  if (cartSummary) {
    cartSummary.style.display = "none";
  }
}

// Clear cart functionality
const clearCartButton = document.getElementById("clear-cart");
if (clearCartButton) {
  clearCartButton.addEventListener("click", () => {
    cart = [];
    cartTotal = 0;
    updateCartDisplay();
    hideCartSummary();
  });
}

// Checkout functionality
const checkoutButton = document.getElementById("checkout");
if (checkoutButton) {
  checkoutButton.addEventListener("click", () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    alert(
      `Thank you for your purchase! Total: €${cartTotal}\n\nYou will receive download links and instructions via email within 24 hours.`
    );
    cart = [];
    cartTotal = 0;
    updateCartDisplay();
    hideCartSummary();
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