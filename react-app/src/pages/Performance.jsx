import BenchmarkEvidenceLink from '../components/BenchmarkEvidenceLink';
import SEO from '../components/SEO';
import { benchmarkEvidenceComplete, benchmarkMethodology, benchmarkPublication, benchmarkResults, formatPercentChange, idleOverhead } from '../data/benchmark';
import "./Performance.css";

const { averageFps, onePercentLowFps, frameTimeMs } = benchmarkResults;
const { processes, memoryGb } = idleOverhead;
const { runCount, captureSeconds } = benchmarkMethodology;

function Performance() {
	return (
		<>
			<SEO
				title="PC performance benchmark results | Softhe.io"
				description="Review a preliminary whole-system CS2 comparison, its changed variables, and the evidence still needed to reproduce it."
				keywords="fps benchmarks, gaming performance, cs2 fps, counter-strike performance, windows optimization results, gaming benchmarks, fps comparison, frame time optimization"
				ogTitle="CS2 benchmark comparison | Softhe.io"
				ogDescription={`One PC measured ${averageFps.stock} and ${averageFps.optimized} average FPS across two configurations. ${benchmarkPublication.captureCountText.charAt(0).toUpperCase()}${benchmarkPublication.captureCountText.slice(1)} raw captures are published and several variables changed.`}
			/>
			<div className="performance-page">
				<section className="performance-hero page-header">
					<div className="container">
						<span className="section-kicker">Benchmarks</span>
						<h1>Measured results from the current test PC</h1>
						<p>
							This preliminary comparison uses one PC. Windows edition, memory settings, and
							GPU driver changed. The result cannot isolate the effect of a Softhe.io product.
						</p>
						<p className="methodology-warning" role="note">
							Captured: {benchmarkMethodology.captureDate}. Hardware: {benchmarkMethodology.hardware}.
							 Runs per configuration: {runCount}. <BenchmarkEvidenceLink />
						</p>
						<div className="performance-stats">
							<div>
								<strong>{averageFps.stock} to {averageFps.optimized}</strong>
								<span>Average FPS in CS2 sample</span>
							</div>
							<div>
								<strong>{onePercentLowFps.stock} to {onePercentLowFps.optimized}</strong>
								<span>P1 FPS in CS2 sample</span>
							</div>
							<div>
								<strong>Version 74</strong>
								<span>Build used in the published sample</span>
							</div>
						</div>
					</div>
				</section>

				<section className="fps-comparison">
					<div className="container">
						<div className="performance-section-heading">
							<span className="section-kicker">Preliminary in-game sample</span>
							<h2 className="section-title">Counter-Strike 2 FPS comparison</h2>
							<p>The CPU, GPU, and motherboard are the same. Memory settings, Windows edition, and GPU driver changed. This whole-system comparison does not measure the effect of any single product.</p>
						</div>

						<div className="native-benchmark-card">
							<div className="native-card-topline">
								<div><span>Preliminary result</span><strong>CS2 · Dust 2 benchmark</strong></div>
								<b>{runCount}-run median</b>
							</div>
							<div className="native-result-stage">
								<div className="native-result before">
									<span>Before · Default Windows</span>
									<strong>{averageFps.stock}</strong>
									<small>average FPS</small>
								</div>
								<div className="native-gain"><i className="fas fa-arrow-right" aria-hidden="true"></i><strong>{formatPercentChange(averageFps.change)}</strong><span>average FPS</span></div>
								<div className="native-result after">
									<span>After · SoftheOS + BIOS</span>
									<strong>{averageFps.optimized}</strong>
									<small>average FPS</small>
								</div>
							</div>
							<div className="native-supporting-metrics">
								<div><span>P1 FPS</span><strong>{onePercentLowFps.stock}<span className="visually-hidden"> to </span> <i className="fas fa-arrow-right" aria-hidden="true"></i> {onePercentLowFps.optimized} FPS</strong><b>{formatPercentChange(onePercentLowFps.change)}</b></div>
								<div><span>Average frame time</span><strong>{frameTimeMs.stock}<span className="visually-hidden"> to </span> <i className="fas fa-arrow-right" aria-hidden="true"></i> {frameTimeMs.optimized} ms</strong><b>{formatPercentChange(frameTimeMs.change)}</b></div>
								<div><span>Recorded sample</span><strong>{runCount} × {captureSeconds} seconds</strong><b>Median</b></div>
							</div>
						</div>
					</div>
				</section>

				<section className="fps-comparison">
					<div className="container">
						<div className="performance-section-heading">
							<span className="section-kicker">System overhead</span>
							<h2 className="section-title">Idle process and memory use</h2>
							<p>Idle Windows overhead from the documented stock and optimized configurations.</p>
						</div>

						<div className="overhead-showcase">
							<div className="overhead-heading" aria-hidden="true">
								<div><span>Default Windows</span><strong>Stock sample</strong></div>
								<div><span>SoftheOS</span><strong>Optimized sample</strong></div>
							</div>
							{/* Each value names its profile because the column headings disappear once the metrics stack on mobile. */}
							<div className="overhead-metric">
								<div><small className="overhead-profile">Default Windows</small><span>Background processes</span><strong>{processes.stock}</strong></div>
								<div className="overhead-change"><b>{formatPercentChange(processes.change)}</b><i className="fas fa-arrow-right" aria-hidden="true"></i></div>
								<div><small className="overhead-profile">SoftheOS</small><strong>{processes.optimized}</strong><span>Observed in sample</span></div>
							</div>
							<div className="overhead-metric">
								<div><small className="overhead-profile">Default Windows</small><span>Idle memory</span><strong>{memoryGb.stock} GB</strong></div>
								<div className="overhead-change"><b>{formatPercentChange(memoryGb.change)}</b><i className="fas fa-arrow-right" aria-hidden="true"></i></div>
								<div><small className="overhead-profile">SoftheOS</small><strong>{memoryGb.optimized} GB</strong><span>Observed idle use</span></div>
							</div>
							<p>Idle readings are illustrative snapshots from the documented configurations, not guaranteed targets for every PC.</p>
						</div>
					</div>
				</section>

				<section className="version-evolution" aria-labelledby="version-evolution-title">
					<div className="container evolution-layout">
						<div className="evolution-copy">
							<span className="section-kicker">Release history</span>
							<div className="version-mark"><span>SoftheOS</span><strong>v74</strong></div>
							<h2 id="version-evolution-title">Version 74 follows repeated testing and revision</h2>
							<p>
								The build has been revised over many releases. Each revision checks performance,
								compatibility, and stability before settings move into the next version.
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
							<h2 className="section-title">Results at a glance</h2>
							<p>Values from the preliminary CS2 comparison and separate idle snapshots.</p>
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
									<i className="fas fa-chart-line" aria-hidden="true"></i>
									Frame Rate (CS2)
								</div>
								<div className="table-cell stock-value">
									{averageFps.stock} avg FPS
								</div>
								<div className="table-cell optimized-value">
									{averageFps.optimized} avg FPS
								</div>
								<div className="table-cell improvement">
									{formatPercentChange(averageFps.change)}
								</div>
							</div>

							<div className="table-row">
								<div className="table-cell feature-name">
									<i className="fas fa-chart-line" aria-hidden="true"></i>
									P1 FPS (CS2)
								</div>
								<div className="table-cell stock-value">
									{onePercentLowFps.stock} FPS
								</div>
								<div className="table-cell optimized-value">
									{onePercentLowFps.optimized} FPS
								</div>
								<div className="table-cell improvement">
									{formatPercentChange(onePercentLowFps.change)}
								</div>
							</div>

							<div className="table-row">
								<div className="table-cell feature-name">
									<i className="fas fa-stopwatch" aria-hidden="true"></i>
									Average Frame Time
								</div>
								<div className="table-cell stock-value">{frameTimeMs.stock}ms</div>
								<div className="table-cell optimized-value">
									{frameTimeMs.optimized}ms
								</div>
								<div className="table-cell improvement">
									{formatPercentChange(frameTimeMs.change)}
								</div>
							</div>

							<div className="table-row">
								<div className="table-cell feature-name">
									<i className="fas fa-list" aria-hidden="true"></i>
									Idle Processes
								</div>
								<div className="table-cell stock-value">{processes.stock}</div>
								<div className="table-cell optimized-value">
									{processes.optimized}
								</div>
								<div className="table-cell improvement">
									{formatPercentChange(processes.change)}
								</div>
							</div>

							<div className="table-row">
								<div className="table-cell feature-name">
									<i className="fas fa-memory" aria-hidden="true"></i>
									Idle Memory
								</div>
								<div className="table-cell stock-value">
									{memoryGb.stock} GB
								</div>
								<div className="table-cell optimized-value">
									{memoryGb.optimized} GB
								</div>
								<div className="table-cell improvement">
									{formatPercentChange(memoryGb.change)}
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
								<div><dt>Operating system</dt><dd>{benchmarkMethodology.operatingSystem}</dd></div>
								<div><dt>BIOS</dt><dd>{benchmarkMethodology.bios}</dd></div>
								<div><dt>Drivers</dt><dd>{benchmarkMethodology.drivers}</dd></div>
								<div><dt>Game version</dt><dd>{benchmarkMethodology.gameVersion}</dd></div>
								<div>
									<dt>Sample</dt>
									<dd>
										Captured {benchmarkMethodology.captureDate}.{' '}
										{runCount} runs of {captureSeconds} seconds per configuration, summarized by {benchmarkMethodology.summaryMethod}.
									</dd>
								</div>
								<div><dt>Scenario</dt><dd>{benchmarkMethodology.scenario}</dd></div>
								<div><dt>Graphics settings</dt><dd>{benchmarkMethodology.graphicsSettings}</dd></div>
							</dl>
							{!benchmarkEvidenceComplete && (
								<p className="methodology-warning" role="note">
									The exact CS2 build and chipset-driver versions were not recorded.
									These figures cannot establish the effect of a single product.
									P1 FPS is the 99th percentile frame time converted to FPS, not the average of the slowest 1% of frames.
								</p>
							)}
						</section>

						<div className="method-note">
							<i className="fas fa-circle-info" aria-hidden="true"></i>
							<p>
								Results depend on hardware, BIOS, drivers, Windows version, game settings, and
								workload. The archive contains {benchmarkPublication.captureCountText} original JSON captures, with
								median average FPS and P1 FPS from at least two repeated stock and optimized runs.{' '}
								<BenchmarkEvidenceLink />
							</p>
						</div>
						<p className="version-stability-note">
							SoftheOS version 74 was used for this sample. Stability still depends on the hardware,
							drivers, BIOS settings, and workload of each PC.
						</p>
					</div>
				</section>
			</div>
		</>
	);
}

export default Performance;
