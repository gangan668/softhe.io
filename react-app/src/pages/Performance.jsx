import SEO from '../components/SEO';
import { benchmarkEvidenceComplete, benchmarkMethodology } from '../data/benchmark';
import "./Performance.css";

function Performance() {
	return (
		<>
			<SEO
				title="Performance Benchmarks - Real FPS Comparisons | Softhe.io"
				description="Review measured FPS, frame-time, and system-overhead comparisons for a documented SoftheOS and BIOS-tuned configuration."
				keywords="fps benchmarks, gaming performance, cs2 fps, counter-strike performance, windows optimization results, gaming benchmarks, fps comparison, frame time optimization"
				ogTitle="Performance Benchmarks - CS2 Configuration Comparison"
				ogDescription="Two-run CapFrameX medians measured 658 FPS default and 826 FPS SoftheOS in Counter-Strike 2 on the tested platform."
			/>
			<div className="performance-page">
				<section className="performance-hero page-header">
					<div className="container">
						<span className="section-kicker">Benchmarks</span>
						<h1>Performance proof, not just promises.</h1>
						<p>
							Native before-and-after metrics from the current test set, presented with
							the context users need to evaluate the difference.
						</p>
						<div className="performance-stats">
							<div>
								<strong>658 to 826</strong>
								<span>Average FPS in CS2 sample</span>
							</div>
							<div>
								<strong>225 to 285</strong>
								<span>1% low FPS in CS2 sample</span>
							</div>
							<div>
								<strong>Version 74</strong>
								<span>Iterative tuning release</span>
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

						<div className="native-benchmark-card">
							<div className="native-card-topline">
								<div><span>Measured result</span><strong>CS2 · Dust 2 benchmark</strong></div>
								<b>2-run median</b>
							</div>
							<div className="native-result-stage">
								<div className="native-result before">
									<span>Before · Default Windows</span>
									<strong>658</strong>
									<small>average FPS</small>
								</div>
								<div className="native-gain"><i className="fas fa-arrow-right" aria-hidden="true"></i><strong>+25%</strong><span>average FPS</span></div>
								<div className="native-result after">
									<span>After · SoftheOS + BIOS</span>
									<strong>826</strong>
									<small>average FPS</small>
								</div>
							</div>
							<div className="native-supporting-metrics">
								<div><span>1% low</span><strong>225 <i className="fas fa-arrow-right" aria-hidden="true"></i> 285 FPS</strong><b>+27%</b></div>
								<div><span>Average frame time</span><strong>1.52 <i className="fas fa-arrow-right" aria-hidden="true"></i> 1.21 ms</strong><b>-20%</b></div>
								<div><span>Recorded sample</span><strong>2 × 109 seconds</strong><b>Median</b></div>
							</div>
						</div>
					</div>
				</section>

				<section className="fps-comparison">
					<div className="container">
						<div className="performance-section-heading">
							<span className="section-kicker">System overhead</span>
							<h2 className="section-title">Less work before the game starts</h2>
							<p>Idle Windows overhead from the documented stock and optimized configurations.</p>
						</div>

						<div className="overhead-showcase">
							<div className="overhead-heading">
								<div><span>Default Windows</span><strong>More idle overhead</strong></div>
								<div><span>SoftheOS</span><strong>More room for the workload</strong></div>
							</div>
							<div className="overhead-metric">
								<div><span>Background processes</span><strong>111</strong></div>
								<div className="overhead-change"><b>-72%</b><i className="fas fa-arrow-right" aria-hidden="true"></i></div>
								<div><strong>31</strong><span>Target shown in sample</span></div>
							</div>
							<div className="overhead-metric">
								<div><span>Idle memory</span><strong>2.5 GB</strong></div>
								<div className="overhead-change"><b>-68%</b><i className="fas fa-arrow-right" aria-hidden="true"></i></div>
								<div><strong>0.8 GB</strong><span>Observed idle use</span></div>
							</div>
							<p>Idle readings are illustrative snapshots from the documented configurations, not guaranteed targets for every PC.</p>
						</div>
					</div>
				</section>

				<section className="version-evolution" aria-labelledby="version-evolution-title">
					<div className="container evolution-layout">
						<div className="evolution-copy">
							<span className="section-kicker">Built through iteration</span>
							<div className="version-mark"><span>SoftheOS</span><strong>v74</strong></div>
							<h2 id="version-evolution-title">The improvement is the process.</h2>
							<p>
								Version 74 represents repeated rounds of tuning, compatibility work, validation,
								and refinement—not a one-off preset. Each release carries lessons from the versions before it.
							</p>
						</div>
						<div className="evolution-steps">
							<div><span>01</span><strong>Measure</strong><p>Capture frame rate, frame time, idle overhead, and system behavior.</p></div>
							<div><span>02</span><strong>Refine</strong><p>Adjust the build and tuning based on observed results and compatibility needs.</p></div>
							<div><span>03</span><strong>Validate</strong><p>Recheck performance and stability before changes become part of the next release.</p></div>
						</div>
					</div>
				</section>

				<section className="detailed-comparison">
					<div className="container">
						<div className="performance-section-heading">
							<span className="section-kicker">Summary</span>
							<h2 className="section-title">Detailed performance analysis</h2>
							<p>Measured values from the current benchmark evidence and documented idle samples.</p>
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
									658 avg FPS
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
								<div className="table-cell stock-value">1.52ms</div>
								<div className="table-cell optimized-value">
									1.21ms
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
								median FPS and 1% lows from at least two repeated stock and optimized runs.
							</p>
						</div>
						<p className="version-stability-note">
							SoftheOS is currently at version 74. Its long development history supports a more mature,
							stability-focused baseline, while final stability still depends on the individual hardware,
							drivers, BIOS configuration, and workload.
						</p>
					</div>
				</section>
			</div>
		</>
	);
}

export default Performance;
