import './Performance.css';

function Performance() {
  return (
    <div className="performance-page">
      <section className="page-header">
        <div className="container">
          <h1>Performance Comparison</h1>
          <p>See the dramatic difference between stock Windows and Softhe.io optimization</p>
        </div>
      </section>

      <section className="screenshot-comparison">
        <div className="container">
          <div className="screenshot-grid">
            <div className="screenshot-item">
              <div className="screenshot-header">
                <h3>Task Manager - Stock Windows Iso</h3>
                <span className="screenshot-badge stock-badge">High Resource Usage</span>
              </div>
              <div className="screenshot-container">
                <img src="/images/optimized-task-manager.png" alt="Stock Windows Task Manager" className="screenshot-image" />
                <div className="screenshot-overlay">
                  <div className="overlay-stats">
                    <div className="overlay-stat">
                      <span className="stat-label">RAM Usage:</span>
                      <span className="stat-value poor">2.5GB</span>
                    </div>
                    <div className="overlay-stat">
                      <span className="stat-label">Processes:</span>
                      <span className="stat-value poor">111</span>
                    </div>
                    <div className="overlay-stat">
                      <span className="stat-label">CPU Usage:</span>
                      <span className="stat-value poor">1%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="screenshot-item">
              <div className="screenshot-header">
                <h3>Task Manager - Custom Iso</h3>
                <span className="screenshot-badge optimized-badge">Minimal Resource Usage</span>
              </div>
              <div className="screenshot-container">
                <img src="/images/stock-task-manager.png" alt="Optimized Windows Task Manager" className="screenshot-image" />
                <div className="screenshot-overlay">
                  <div className="overlay-stats">
                    <div className="overlay-stat">
                      <span className="stat-label">RAM Usage:</span>
                      <span className="stat-value excellent">0.8GB</span>
                    </div>
                    <div className="overlay-stat">
                      <span className="stat-label">Processes:</span>
                      <span className="stat-value excellent">31</span>
                    </div>
                    <div className="overlay-stat">
                      <span className="stat-label">CPU Usage:</span>
                      <span className="stat-value excellent">0%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="fps-comparison">
        <div className="container">
          <h2 className="section-title">In-Game Performance Screenshots</h2>
          
          <div className="fps-showcase">
            <div className="fps-comparison-item">
              <div className="fps-header">
                <h3>Counter-Strike 2 Performance</h3>
                <p>Same hardware, different optimization levels</p>
              </div>
              
              <div className="fps-images">
                <div className="fps-image-container">
                  <div className="fps-label">
                    <span className="fps-title">Stock Windows</span>
                    <span className="fps-value poor">670 FPS</span>
                  </div>
                  <img src="/images/cs2-stock-fps.png" alt="Counter-Strike 2 Stock" className="fps-screenshot" />
                  <div className="fps-details">
                    <span>1% Low: 355 FPS</span>
                    <span>Frame Time: 1.5ms</span>
                  </div>
                </div>
                
                <div className="fps-image-container">
                  <div className="fps-label">
                    <span className="fps-title">Softhe.io Optimized</span>
                    <span className="fps-value excellent">932 Average FPS</span>
                  </div>
                  <img src="/images/cs2-optimized-fps.png" alt="Counter-Strike 2 Optimized" className="fps-screenshot" />
                  <div className="fps-details">
                    <span>1% Low: 498 FPS</span>
                    <span>Frame Time: 1.1ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="detailed-comparison">
        <div className="container">
          <h2 className="section-title">Detailed Performance Analysis</h2>
          
          <div className="comparison-table">
            <div className="table-header">
              <div className="table-cell">Feature</div>
              <div className="table-cell">Stock Windows</div>
              <div className="table-cell">Softhe.io Optimized</div>
              <div className="table-cell">Improvement</div>
            </div>
            
            <div className="table-row">
              <div className="table-cell feature-name">
                <i className="fas fa-chart-line"></i>
                Frame Rate (CS2)
              </div>
              <div className="table-cell stock-value">670 avg FPS</div>
              <div className="table-cell optimized-value">932 avg FPS</div>
              <div className="table-cell improvement">+40% avg</div>
            </div>
            
            <div className="table-row">
              <div className="table-cell feature-name">
                <i className="fas fa-stopwatch"></i>
                Input Latency
              </div>
              <div className="table-cell stock-value">1,5ms</div>
              <div className="table-cell optimized-value">1.1ms</div>
              <div className="table-cell improvement">-36% reduction</div>
            </div>
            
            <div className="table-row">
              <div className="table-cell feature-name">
                <i className="fas fa-microchip"></i>
                CPU Usage (Gaming)
              </div>
              <div className="table-cell stock-value">75-90%</div>
              <div className="table-cell optimized-value">45-65%</div>
              <div className="table-cell improvement">-30% usage</div>
            </div>
            
            <div className="table-row">
              <div className="table-cell feature-name">
                <i className="fas fa-hdd"></i>
                Boot Time
              </div>
              <div className="table-cell stock-value">~30 seconds</div>
              <div className="table-cell optimized-value">~15 seconds</div>
              <div className="table-cell improvement">~65% faster</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Performance;
