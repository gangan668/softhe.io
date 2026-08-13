import SEO from '../components/SEO';
import { absoluteUrl } from '../config/site';
import { benchmarkEvidenceComplete, benchmarkMethodology } from '../data/benchmark';
import "./Performance.css";

function Performance() {
	return (
		<>
			<SEO
				title="Performance Benchmarks - Real FPS Comparisons | Softhe.io"
				description="Review benchmark screenshots and resource usage comparisons for a Softhe.io optimized setup, including CS2 FPS and Windows Task Manager examples."
				keywords="fps benchmarks, gaming performance, cs2 fps, counter-strike performance, windows optimization results, gaming benchmarks, fps comparison, frame time optimization"
				ogTitle="Performance Benchmarks - CS2 Configuration Comparison"
				ogDescription="Preliminary CapFrameX captures measured 662 FPS stock and 826 FPS optimized in Counter-Strike 2 on the tested platform."
				ogImage={absoluteUrl('/images/cs2-optimized-capframex.svg')}
			/>
			<div className="performance-page">
				<section className="performance-hero page-header">
					<div className="container">
						<span className="section-kicker">Benchmarks</span>
						<h1>Performance proof, not just promises.</h1>
						<p>
							Before and after screenshots from the current test set, presented with the
							context users need to evaluate the difference.
						</p>
						<div className="performance-stats">
							<div>
								<strong>662 to 826</strong>
								<span>Average FPS in CS2 sample</span>
							</div>
							<div>
								<strong>111 to 31</strong>
								<span>Idle background processes</span>
							</div>
							<div>
								<strong>2.5 to 0.8 GB</strong>
								<span>Idle memory usage shown</span>
							</div>
						</div>
					</div>
				</section>

				<section className="fps-comparison">
					<div className="container">
						<div className="performance-section-heading">
							<span className="section-kicker">In-game sample</span>
							<h2 className="section-title">Counter-Strike 2 FPS comparison</h2>
							<p>Same CPU, GPU, and motherboard; the optimized configuration also changes memory tuning, Windows edition, and GPU driver.</p>
						</div>

						<div className="fps-showcase">
							<div className="fps-comparison-item">
								<div className="fps-header">
									<h3>Counter-Strike 2 Performance</h3>
									<p>
										Observed whole-configuration comparison
									</p>
								</div>

								<div className="fps-images">
									<div className="fps-image-container">
										<div className="fps-label">
											<span className="fps-title">
												Stock Windows
											</span>
											<span className="fps-value poor">
												662 FPS
											</span>
										</div>
										<img
											src="/images/cs2-stock-capframex.svg"
											alt="Counter-Strike 2 Stock"
											className="fps-screenshot"
											width="1024"
											height="576"
											loading="lazy"
											decoding="async"
										/>
										<div className="fps-details">
											<span>1% Low: 228 FPS</span>
											<span>Frame Time: 1.5ms</span>
										</div>
									</div>

									<div className="fps-image-container">
										<div className="fps-label">
											<span className="fps-title">
												Softhe.io Optimized
											</span>
											<span className="fps-value excellent">
												826 Average FPS
											</span>
										</div>
										<img
											src="/images/cs2-optimized-capframex.svg"
											alt="Counter-Strike 2 Optimized"
											className="fps-screenshot"
											width="1024"
											height="576"
											loading="lazy"
											decoding="async"
										/>
										<div className="fps-details">
											<span>1% Low: 287 FPS</span>
											<span>Frame Time: 1.2ms</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section className="fps-comparison">
					<div className="container">
						<div className="performance-section-heading">
							<span className="section-kicker">System overhead</span>
							<h2 className="section-title">Windows Task Manager resource usage</h2>
							<p>Idle resource screenshots showing stock versus optimized Windows overhead.</p>
						</div>

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
											src="/images/stock-task-manager.webp"
											alt="Stock Windows Task Manager"
											className="fps-screenshot"
											width="1024"
											height="768"
											loading="lazy"
											decoding="async"
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
											src="/images/optimized-task-manager.webp"
											alt="Softhe.io Optimized Task Manager"
											className="fps-screenshot"
											width="1024"
											height="768"
											loading="lazy"
											decoding="async"
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
						<div className="performance-section-heading">
							<span className="section-kicker">Summary</span>
							<h2 className="section-title">Detailed performance analysis</h2>
							<p>Numbers surfaced from the current benchmark screenshots and service claims.</p>
						</div>

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
									662 avg FPS
								</div>
								<div className="table-cell optimized-value">
									826 avg FPS
								</div>
								<div className="table-cell improvement">
									+25% avg
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
									-20% reduction
								</div>
							</div>

							<div className="table-row">
								<div className="table-cell feature-name">
									<i className="fas fa-list"></i>
									Idle Processes
								</div>
								<div className="table-cell stock-value">111</div>
								<div className="table-cell optimized-value">
									31
								</div>
								<div className="table-cell improvement">
									-72%
								</div>
							</div>

							<div className="table-row">
								<div className="table-cell feature-name">
									<i className="fas fa-memory"></i>
									Idle Memory
								</div>
								<div className="table-cell stock-value">
									2.5 GB
								</div>
								<div className="table-cell optimized-value">
									0.8 GB
								</div>
								<div className="table-cell improvement">
									-68%
								</div>
							</div>
						</div>

						<section className="benchmark-methodology" aria-labelledby="benchmark-methodology-title">
							<div className="methodology-heading">
								<span className="section-kicker">Evidence</span>
								<h2 id="benchmark-methodology-title">Benchmark methodology</h2>
								<p>
									These results describe the documented test configuration only. They are not a
									guarantee of results on other hardware or workloads.
								</p>
							</div>
							<dl className="methodology-grid">
								<div><dt>Hardware</dt><dd>{benchmarkMethodology.hardware}</dd></div>
								<div><dt>Software</dt><dd>{benchmarkMethodology.software}</dd></div>
								<div><dt>Scenario</dt><dd>{benchmarkMethodology.scenario}</dd></div>
								<div><dt>Captured</dt><dd>{benchmarkMethodology.captureDate}</dd></div>
								<div><dt>Repeated runs</dt><dd>{benchmarkMethodology.runCount ?? 'Pending publication'}</dd></div>
								<div><dt>Summary</dt><dd>{benchmarkMethodology.summaryMethod}</dd></div>
							</dl>
							{!benchmarkEvidenceComplete && (
								<p className="methodology-warning" role="note">
									Full reproducibility details and raw run evidence have not yet been published.
									Treat these figures as preliminary product evidence.
								</p>
							)}
						</section>

						<div className="method-note">
							<i className="fas fa-circle-info" aria-hidden="true"></i>
							<p>
								Results depend on hardware, BIOS, drivers, Windows version, game settings, and
								workload. Raw screenshots should accompany each published run set, including
								median FPS and 1% lows from at least three repeated stock and optimized runs.
							</p>
						</div>
					</div>
				</section>
			</div>
		</>
	);
}

export default Performance;
