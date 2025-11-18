import "./Performance.css";

function Performance() {
	return (
		<div className="performance-page">
			<section className="fps-comparison">
				<div className="container">
					<h2 className="section-title">
						In-Game Performance Screenshots
					</h2>

					<div className="fps-showcase">
						<div className="fps-comparison-item">
							<div className="fps-header">
								<h3>Counter-Strike 2 Performance</h3>
								<p>
									Same hardware, different optimization levels
								</p>
							</div>

							<div className="fps-images">
								<div className="fps-image-container">
									<div className="fps-label">
										<span className="fps-title">
											Stock Windows
										</span>
										<span className="fps-value poor">
											670 FPS
										</span>
									</div>
									<img
										src="/images/cs2-stock-fps.png"
										alt="Counter-Strike 2 Stock"
										className="fps-screenshot"
									/>
									<div className="fps-details">
										<span>1% Low: 355 FPS</span>
										<span>Frame Time: 1.5ms</span>
									</div>
								</div>

								<div className="fps-image-container">
									<div className="fps-label">
										<span className="fps-title">
											Softhe.io Optimized
										</span>
										<span className="fps-value excellent">
											932 Average FPS
										</span>
									</div>
									<img
										src="/images/cs2-optimized-fps.png"
										alt="Counter-Strike 2 Optimized"
										className="fps-screenshot"
									/>
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

			<section className="fps-comparison">
				<div className="container">
					<h2 className="section-title">
						Windows Task Manager Resource Usage
					</h2>

					<div className="fps-showcase">
						<div className="fps-comparison-item">
							<div className="fps-header">
								<h3>Task Manager Comparison</h3>
								<p>
									Same hardware, stock vs optimized Windows
								</p>
							</div>

							<div className="fps-images">
								<div className="fps-image-container">
									<div className="fps-label">
										<span className="fps-title">
											Stock Windows
										</span>
										<span className="fps-value poor">
											High Usage
										</span>
									</div>
									<img
										src="/images/stock-task-manager.png"
										alt="Stock Windows Task Manager"
										className="fps-screenshot"
									/>
									<div className="fps-details">
										<span>RAM: 2.5 GB</span>
										<span>Processes: 111</span>
										<span>CPU: 1%</span>
									</div>
								</div>

								<div className="fps-image-container">
									<div className="fps-label">
										<span className="fps-title">
											Softhe.io Optimized
										</span>
										<span className="fps-value excellent">
											Minimal Usage
										</span>
									</div>
									<img
										src="/images/optimized-task-manager.png"
										alt="Softhe.io Optimized Task Manager"
										className="fps-screenshot"
									/>
									<div className="fps-details">
										<span>RAM: 0.8 GB</span>
										<span>Processes: 31</span>
										<span>CPU: 0%</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="detailed-comparison">
				<div className="container">
					<h2 className="section-title">
						Detailed Performance Analysis
					</h2>

					<div className="comparison-table">
						<div className="table-header">
							<div className="table-cell">Feature</div>
							<div className="table-cell">Stock Windows</div>
							<div className="table-cell">
								Softhe.io Optimized
							</div>
							<div className="table-cell">Improvement</div>
						</div>

						<div className="table-row">
							<div className="table-cell feature-name">
								<i className="fas fa-chart-line"></i>
								Frame Rate (CS2)
							</div>
							<div className="table-cell stock-value">
								670 avg FPS
							</div>
							<div className="table-cell optimized-value">
								932 avg FPS
							</div>
							<div className="table-cell improvement">
								+40% avg
							</div>
						</div>

						<div className="table-row">
							<div className="table-cell feature-name">
								<i className="fas fa-stopwatch"></i>
								Frame Time
							</div>
							<div className="table-cell stock-value">1,5ms</div>
							<div className="table-cell optimized-value">
								1.1ms
							</div>
							<div className="table-cell improvement">
								-36% reduction
							</div>
						</div>

						<div className="table-row">
							<div className="table-cell feature-name">
								<i className="fas fa-microchip"></i>
								CPU Usage (Gaming)
							</div>
							<div className="table-cell stock-value">75-90%</div>
							<div className="table-cell optimized-value">
								45-65%
							</div>
							<div className="table-cell improvement">
								-30% usage
							</div>
						</div>

						<div className="table-row">
							<div className="table-cell feature-name">
								<i className="fas fa-hdd"></i>
								Boot Time
							</div>
							<div className="table-cell stock-value">
								~30 seconds
							</div>
							<div className="table-cell optimized-value">
								~15 seconds
							</div>
							<div className="table-cell improvement">
								~65% faster
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}

export default Performance;
