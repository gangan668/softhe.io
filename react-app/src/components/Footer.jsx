import './Footer.css';

function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Softhe.io</h3>
            <p>Elite PC optimization for esports professionals and enthusiasts worldwide.</p>
            <div className="social-links">
              <a href="https://x.com/SoftheCS" target="_blank" rel="noreferrer">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="https://discord.com/users/softhecs" target="_blank" rel="noreferrer">
                <i className="fab fa-discord"></i>
              </a>
              <a href="https://github.com/Softhe" target="_blank" rel="noreferrer">
                <i className="fab fa-github"></i>
              </a>
              <a href="https://www.youtube.com/@softhe" target="_blank" rel="noreferrer">
                <i className="fab fa-youtube"></i>
              </a>
            </div>
          </div>
          <div className="footer-section">
            <h4>Services</h4>
            <ul>
              <li><a href="/services">Custom Windows ISO</a></li>
              <li><a href="/services">BIOS Optimization</a></li>
              <li><a href="/performance">Performance Tuning</a></li>
              <li><a href="/contact">Support</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <ul>
              <li>
                <i className="fas fa-envelope"></i>
                <a href="mailto:support@softhe.io">support@softhe.io</a>
              </li>
              <li>
                <i className="fab fa-discord"></i>
                <a href="https://discord.com/users/softhecs" target="_blank" rel="noreferrer">@softhecs</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 Softhe.io. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
