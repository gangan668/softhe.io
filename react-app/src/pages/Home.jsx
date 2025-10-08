import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home">
      <header className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Elite PC Optimization for <span className="gradient-text">Esports</span>
            </h1>
            <p className="hero-description">
              At Softhe.io, we cater to esports enthusiasts seeking peak PC performance. 
              Our custom Windows solutions and expert BIOS optimizations ensure you experience 
              maximum frame rates and minimal latency for a competitive edge.
            </p>
            <div className="hero-buttons">
              <Link to="/services" className="btn btn-primary">Our Services</Link>
              <Link to="/store" className="btn btn-secondary">Shop Now</Link>
            </div>
          </div>
          <div className="hero-image">
            <div className="performance-card">
              <div className="performance-metric">
                <span className="metric-value">+40%</span>
                <span className="metric-label">Avg FPS Boost</span>
              </div>
              <div className="performance-metric">
                <span className="metric-value">-36%</span>
                <span className="metric-label">Frame Time</span>
              </div>
              <div className="performance-metric">
                <span className="metric-value">-350%</span>
                <span className="metric-label">Background Processes</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="features">
        <div className="container">
          <h2 className="section-title">Why Choose Softhe.io?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-rocket"></i>
              </div>
              <h3>Maximum Performance</h3>
              <p>Custom-tuned Windows builds that eliminate bloatware and optimize every component for gaming excellence.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-microchip"></i>
              </div>
              <h3>BIOS Optimization</h3>
              <p>Expert BIOS configurations that unlock your hardware's full potential while maintaining system stability.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fa-solid fa-file-lines"></i>
              </div>
              <h3>Ease of use</h3>
              <p>Included for great quality of life 200+ scripts that automate tasks such as Windows Updates and per game optimizations.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-headset"></i>
              </div>
              <h3>Expert Support</h3>
              <p>Dedicated support from optimization specialists who understand the esports ecosystem.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Dominate the Competition?</h2>
            <p>Join thousands of esports professionals who trust Softhe.io for their competitive edge.</p>
            <Link to="/store" className="btn btn-primary">Get Started Today</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
