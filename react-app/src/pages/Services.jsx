import './Services.css';

function Services() {
  return (
    <div className="services-page">
      <section className="page-header">
        <div className="container">
          <h1>Our Services</h1>
          <p>Professional PC optimization services tailored for competitive gaming</p>
        </div>
      </section>

      <section className="services-detailed">
        <div className="container">
          <div className="service-item">
            <div className="service-content">
              <div className="service-icon">
                <i className="fab fa-windows"></i>
              </div>
              <div className="service-info">
                <h3>Custom Windows Enterprise ISO</h3>
                <p>Our flagship service provides a completely optimized Windows Enterprise build, stripped of bloatware and fine-tuned for maximum gaming performance. Each ISO is crafted with precision to deliver the ultimate competitive advantage.</p>
                <ul className="service-features">
                  <li><i className="fas fa-check"></i> Zero bloatware installation</li>
                  <li><i className="fas fa-check"></i> Gaming-optimized registry tweaks</li>
                  <li><i className="fas fa-check"></i> Enhanced security features</li>
                  <li><i className="fas fa-check"></i> Lifetime updates included</li>
                </ul>
                <div className="service-price">Starting at €65</div>
              </div>
            </div>
          </div>

          <div className="service-item">
            <div className="service-content">
              <div className="service-icon">
                <i className="fas fa-microchip"></i>
              </div>
              <div className="service-info">
                <h3>Expert BIOS Optimization</h3>
                <p>Unlock your hardware's true potential with our professional BIOS optimization service. Our experts configure every setting to maximize performance while maintaining system stability and longevity.</p>
                <ul className="service-features">
                  <li><i className="fas fa-check"></i> Memory timing optimization</li>
                  <li><i className="fas fa-check"></i> CPU performance tuning</li>
                  <li><i className="fas fa-check"></i> Power management optimization</li>
                  <li><i className="fas fa-check"></i> Stability testing included</li>
                </ul>
                <div className="service-price">Starting at €75</div>
              </div>
            </div>
          </div>

          <div className="service-item">
            <div className="service-content">
              <div className="service-icon">
                <i className="fas fa-tachometer-alt"></i>
              </div>
              <div className="service-info">
                <h3>Complete Performance Tuning</h3>
                <p>A comprehensive optimization package that combines our Windows ISO with BIOS tuning, driver optimization, and personalized gaming configurations for the ultimate competitive setup.</p>
                <ul className="service-features">
                  <li><i className="fas fa-check"></i> Custom Windows ISO installation</li>
                  <li><i className="fas fa-check"></i> BIOS optimization service</li>
                  <li><i className="fas fa-check"></i> Driver and software optimization</li>
                  <li><i className="fas fa-check"></i> Game-specific configurations</li>
                  <li><i className="fas fa-check"></i> 30-day performance guarantee</li>
                </ul>
                <div className="service-price">Starting at €120</div>
              </div>
            </div>
          </div>

          <div className="service-item">
            <div className="service-content">
              <div className="service-icon">
                <i className="fas fa-headset"></i>
              </div>
              <div className="service-info">
                <h3>Premium Support & Maintenance</h3>
                <p>Ongoing support and maintenance to keep your system running at peak performance. Includes priority support, regular optimization updates, and performance monitoring.</p>
                <ul className="service-features">
                  <li><i className="fas fa-check"></i> 24/7 priority support</li>
                  <li><i className="fas fa-check"></i> Monthly performance checkups</li>
                  <li><i className="fas fa-check"></i> Automatic optimization updates</li>
                  <li><i className="fas fa-check"></i> Remote troubleshooting</li>
                </ul>
                <div className="service-price">€25/request</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="process">
        <div className="container">
          <h2 className="section-title">Our Process</h2>
          <div className="process-steps">
            <div className="process-step">
              <div className="step-number">1</div>
              <h3>Consultation</h3>
              <p>We analyze your current setup and gaming requirements to create a personalized optimization plan.</p>
            </div>
            <div className="process-step">
              <div className="step-number">2</div>
              <h3>Optimization</h3>
              <p>Our experts implement custom optimizations tailored to your hardware and gaming preferences.</p>
            </div>
            <div className="process-step">
              <div className="step-number">3</div>
              <h3>Testing</h3>
              <p>Comprehensive testing ensures maximum performance gains while maintaining system stability.</p>
            </div>
            <div className="process-step">
              <div className="step-number">4</div>
              <h3>Delivery</h3>
              <p>Receive your optimized system with detailed documentation and ongoing support.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Services;
