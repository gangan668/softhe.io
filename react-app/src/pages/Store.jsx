import './Store.css';

function Store() {
  return (
    <div className="store-page">
      <section className="page-header">
        <div className="container">
          <h1>Store</h1>
          <p>Premium optimization products for competitive gaming</p>
        </div>
      </section>

      <section className="store">
        <div className="container">
          <div className="products-grid">
            <div className="product-card">
              <div className="product-badge">Best Seller</div>
              <div className="product-image">
                <i className="fab fa-windows"></i>
              </div>
              <div className="product-info">
                <h3>Custom Windows 10 Iso</h3>
                <p>Our custom Windows Enterprise ISO is built for ultimate speed and no bloat. Experience gaming as it should be.</p>
                <ul className="product-features">
                  <li>Zero bloatware</li>
                  <li>Gaming optimizations</li>
                  <li>Minimal background tasks</li>
                  <li>Updates until EOL 2027</li>
                </ul>
                <div className="product-price">
                  <span className="price">€65</span>
                </div>
                <a href="https://buy.stripe.com/7sY5kwg8AdMfcxm5ST28800" className="btn btn-primary" target="_blank" rel="noreferrer">
                  Buy Now
                </a>
              </div>
            </div>

            <div className="product-card">
              <div className="product-image">
                <i className="fab fa-windows"></i>
              </div>
              <div className="product-info">
                <h3>Custom Windows 11 Iso</h3>
                <p>Latest Windows 11 for next-gen gaming performance and DirectX 12 Ultimate support.</p>
                <ul className="product-features">
                  <li>DirectX 12 Ultimate</li>
                  <li>Auto HDR support</li>
                  <li>Optimizations for windowed fullscreen</li>
                  <li>Regular updates</li>
                </ul>
                <div className="product-price">
                  <span className="price">€75</span>
                </div>
                <a href="https://buy.stripe.com/cNiaEQ9KcdMf2WMbdd28803" className="btn btn-primary" target="_blank" rel="noreferrer">
                  Buy Now
                </a>
              </div>
            </div>

            <div className="product-card">
              <div className="product-badge">Popular</div>
              <div className="product-image">
                <i className="fas fa-microchip"></i>
              </div>
              <div className="product-info">
                <h3>BIOS Optimization Service</h3>
                <p>Professional BIOS tuning service to unlock your hardware's maximum potential with expert configurations.</p>
                <ul className="product-features">
                  <li>CPU tuning</li>
                  <li>GPU tuning</li>
                  <li>Stability testing</li>
                  <li>Custom profiles</li>
                </ul>
                <div className="product-price">
                  <span className="price">€50</span>
                </div>
                <a href="https://buy.stripe.com/bJe9AMe0sfUn8h62GH28804" className="btn btn-primary" target="_blank" rel="noreferrer">
                  Buy Now
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Store;
