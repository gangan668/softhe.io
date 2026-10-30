import BenchmarkEvidenceLink from '../components/BenchmarkEvidenceLink';
import FrameTimeChart from '../components/FrameTimeChart';
import { framesPerRun, percentileRows } from '../data/benchmarkFrametimes';
import { benchmarkEvidenceComplete, benchmarkMethodology, benchmarkPublication, benchmarkResults, formatPercentChange, idleOverhead } from '../data/benchmark';
import "./Performance.css";

const { averageFps, onePercentLowFps, frameTimeMs } = benchmarkResults;
const { processes, memoryGb } = idleOverhead;
const { runCount, captureSeconds } = benchmarkMethodology;
const frameTimeGap = (share) => {
	const { stock, optimized } = percentileRows.find((row) => row.share === share).values;
	// Subtract the rounded values so the figure matches the table beneath the chart.
	return `${(Number(stock.toFixed(2)) - Number(optimized.toFixed(2))).toFixed(2)} ms`;
};

function Performance() {
	return (
		<>
			<div className="performance-page">
				<section className="performance-hero page-header">
					<div className="container">
						<span className="section-kicker">Benchmarks</span>
						<h1>Measured results from the current test PC</h1>
						<div className="performance-stats">
							<div>
								<strong>{formatPercentChange(averageFps.change)}</strong>
								<span>Average FPS in CS2: {averageFps.stock} to {averageFps.optimized}</span>
							</div>
							<div>
								<strong>{formatPercentChange(onePercentLowFps.change)}</strong>
								<span>P1 FPS in CS2: {onePercentLowFps.stock} to {onePercentLowFps.optimized}</span>
							</div>
							<div>
								<strong>{formatPercentChange(processes.change)}</strong>
								<span>Idle processes: {processes.stock} to {processes.optimized}</span>
							</div>
						</div>
						<p className="methodology-warning" role="note">
							This preliminary comparison uses one PC. Windows edition, memory settings, and
							GPU driver changed, so the result cannot isolate the effect of a Softhe.io product.
							Captured {benchmarkMethodology.captureDate} on SoftheOS version 74, {runCount} runs per configuration.{' '}
							<a href="#benchmark-methodology">Full test setup</a>. <BenchmarkEvidenceLink />
						</p>
					</div>
				</section>

				<section className="fps-comparison">
					<div className="container">
						<div className="performance-section-heading">
							<span className="section-kicker">Preliminary in-game sample</span>
							<h2 className="section-title">Counter-Strike 2 FPS comparison</h2>
							<p>The CPU, GPU, and motherboard are the same. This is a whole-system comparison of the two configurations below.</p>
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

				<section className="fps-comparison frametime-section" aria-labelledby="frametime-title">
					<div className="container">
						<div className="performance-section-heading">
							<span className="section-kicker">Frame-time distribution</span>
							<h2 id="frametime-title" className="section-title">The gap widens in the slowest frames</h2>
							<p>
								In this sample, the difference grows from {frameTimeGap(0.5)} at the median frame to {frameTimeGap(0.001)} at the 99.9th percentile.
								Each line is one {captureSeconds}-second run of {Math.min(...framesPerRun).toLocaleString('en-US')} to {Math.max(...framesPerRun).toLocaleString('en-US')} frames,
								drawn from the published raw captures. Read across to see how long the slowest 1 in 10, 100, or 1,000 frames took.
								Averages hide this tail, and it is where stutter shows up.
							</p>
						</div>
						<div className="native-benchmark-card frametime-card">
							<FrameTimeChart />
						</div>
					</div>
				</section>

				<section className="fps-comparison">
					<div className="container">
						<div className="performance-section-heading">
							<span className="section-kicker">System overhead</span>
							<h2 className="section-title">Idle process and memory use</h2>
							<p>Idle Windows overhead from the two documented configurations.</p>
						</div>

						<div className="overhead-showcase">
							<div className="overhead-heading" aria-hidden="true">
								<div><span>Default Windows</span></div>
								<div><span>SoftheOS</span></div>
							</div>
							{/* Each value names its profile because the column headings disappear once the metrics stack on mobile. */}
							<div className="overhead-metric">
								<div><small className="overhead-profile">Default Windows</small><span>Background processes</span><strong>{processes.stock}</strong></div>
								<div className="overhead-change"><b>{formatPercentChange(processes.change)}</b><i className="fas fa-arrow-right" aria-hidden="true"></i></div>
								<div><small className="overhead-profile">SoftheOS</small><strong>{processes.optimized}</strong></div>
							</div>
							<div className="overhead-metric">
								<div><small className="overhead-profile">Default Windows</small><span>Idle memory</span><strong>{memoryGb.stock} GB</strong></div>
								<div className="overhead-change"><b>{formatPercentChange(memoryGb.change)}</b><i className="fas fa-arrow-right" aria-hidden="true"></i></div>
								<div><small className="overhead-profile">SoftheOS</small><strong>{memoryGb.optimized} GB</strong></div>
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
						<section id="benchmark-methodology" className="benchmark-methodology" aria-labelledby="benchmark-methodology-title">
							<div className="methodology-heading">
								<span className="section-kicker">Evidence</span>
								<h2 id="benchmark-methodology-title">Benchmark methodology</h2>
								<p>
									These results describe the documented test configuration only. They are not a
									guarantee of results on other hardware or workloads. Results and stability depend on
									hardware, BIOS, drivers, Windows version, game settings, and workload.
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
							<p className="methodology-archive">
								The archive contains {benchmarkPublication.captureCountText} original JSON captures, with
								median average FPS and P1 FPS from at least two repeated stock and optimized runs.{' '}
								<BenchmarkEvidenceLink />
							</p>
						</section>

					</div>
				</section>
			</div>
		</>
	);
}

export default Performance;
