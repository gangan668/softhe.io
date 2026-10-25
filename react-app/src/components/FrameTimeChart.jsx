import { useEffect, useRef, useState } from 'react';
import { exceedance, frameRange, percentileRows, profileFrameTime, profiles, runs } from '../data/benchmarkFrametimes';
import './FrameTimeChart.css';

const p1Index = exceedance.indexOf(0.01);
const logSpan = Math.log(exceedance[0]) - Math.log(exceedance.at(-1));
const xTicks = [0.5, 0.1, 0.01, 0.001];
const yMax = Math.ceil(frameRange[1]);
const yTicks = Array.from({ length: yMax + 1 }, (_, value) => value);

const formatMs = (value) => `${value.toFixed(2)} ms`;
const formatFps = (value) => `${Math.round(1000 / value)} FPS`;
const formatShare = (share) => `${Number((share * 100).toPrecision(3))}%`;
const oneIn = (share) => `1 in ${Math.round(1 / share).toLocaleString('en-US')}`;

// Renders at the container's pixel width so axis text keeps its size on phones.
function useWidth(fallback) {
	const ref = useRef(null);
	const [width, setWidth] = useState(fallback);
	useEffect(() => {
		const element = ref.current;
		if (!element || typeof ResizeObserver === 'undefined') return undefined;
		const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
		observer.observe(element);
		return () => observer.disconnect();
	}, []);
	return [ref, width];
}

export default function FrameTimeChart() {
	const [wrapperRef, width] = useWidth(720);
	const [active, setActive] = useState(null);
	const compact = width < 520;
	const height = compact ? 260 : 320;
	const margin = { top: 28, right: compact ? 76 : 132, bottom: 52, left: 44 };
	const plotWidth = Math.max(width - margin.left - margin.right, 10);
	const plotHeight = height - margin.top - margin.bottom;
	const x = (share) => margin.left + ((Math.log(exceedance[0]) - Math.log(share)) / logSpan) * plotWidth;
	const y = (ms) => margin.top + (1 - ms / yMax) * plotHeight;
	const path = (values) => values.map((value, index) => `${index ? 'L' : 'M'}${x(exceedance[index]).toFixed(1)},${y(value).toFixed(1)}`).join('');

	const nearestIndex = (pointerX) => exceedance.reduce((best, share, index) => (Math.abs(x(share) - pointerX) < Math.abs(x(exceedance[best]) - pointerX) ? index : best), 0);
	const handlePointer = (event) => {
		const bounds = event.currentTarget.getBoundingClientRect();
		setActive(nearestIndex(event.clientX - bounds.left));
	};
	const handleKey = (event) => {
		const last = exceedance.length - 1;
		const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
		if (step) {
			event.preventDefault();
			setActive((index) => Math.min(last, Math.max(0, (index ?? p1Index) + step)));
		} else if (event.key === 'Home' || event.key === 'End') {
			event.preventDefault();
			setActive(event.key === 'Home' ? 0 : last);
		} else if (event.key === 'Escape') {
			setActive(null);
		}
	};

	const p1 = percentileRows.find((row) => row.share === 0.01).values;
	const summary = `Frame-time percentile curves, one line per recorded run. At the 99th percentile, used for P1 FPS, ${profiles.map(({ id, label }) => `${label} took ${formatMs(p1[id])}`).join(' and ')}. The table below lists the values.`;
	const endLabelY = profiles.map(({ id }) => y(profileFrameTime(id, exceedance.length - 1)));
	// Keep end labels apart when the two curves finish close together.
	if (Math.abs(endLabelY[0] - endLabelY[1]) < 16) {
		const middle = (endLabelY[0] + endLabelY[1]) / 2;
		const [upper, lower] = endLabelY[0] < endLabelY[1] ? [0, 1] : [1, 0];
		endLabelY[upper] = middle - 8;
		endLabelY[lower] = middle + 8;
	}
	const tooltipLeft = active === null ? 0 : x(exceedance[active]);
	// Narrow plots dock the readout under the chart; wide ones float it on the half the curves are not in.
	let tooltipPlacement = null;
	if (active !== null && !compact) {
		const curvesY = runs.reduce((sum, run) => sum + y(run.frameTimeMs[active]), 0) / runs.length;
		tooltipPlacement = curvesY < margin.top + plotHeight / 2
			? { left: tooltipLeft, bottom: height - margin.top - plotHeight + 8 }
			: { left: tooltipLeft, top: margin.top };
	}
	const tooltipClass = ['frametime-tooltip', compact ? 'frametime-tooltip--docked' : tooltipLeft > width / 2 && 'frametime-tooltip--left'].filter(Boolean).join(' ');

	return (
		<figure className="frametime-chart">
			<ul className="frametime-legend" aria-label="Legend">
				{profiles.map(({ id, label }) => (
					<li key={id}><span className={`frametime-key frametime-key--${id}`} aria-hidden="true"></span>{label}<span className="frametime-legend-note">{runs.filter((run) => run.profile === id).length} runs</span></li>
				))}
			</ul>
			<div
				ref={wrapperRef}
				className="frametime-plot"
				tabIndex={0}
				role="group"
				aria-label="Frame-time chart. Use the left and right arrow keys to read values at each percentile."
				onPointerDown={handlePointer}
				onPointerMove={handlePointer}
				onPointerLeave={() => setActive(null)}
				onFocus={() => setActive((index) => index ?? p1Index)}
				onBlur={() => setActive(null)}
				onKeyDown={handleKey}
			>
				<svg width={width} height={height} role="img" aria-label={summary}>
					<text className="frametime-axis-title" x={margin.left} y={14}>Frame time (ms), lower is faster</text>
					{yTicks.map((tick) => (
						<g key={tick}>
							<line className="frametime-grid" x1={margin.left} x2={margin.left + plotWidth} y1={y(tick)} y2={y(tick)} />
							<text className="frametime-tick" x={margin.left - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle">{tick}</text>
						</g>
					))}
					{xTicks.map((share) => (
						<text key={share} className="frametime-tick" x={x(share)} y={margin.top + plotHeight + 18} textAnchor="middle">{formatShare(share)}</text>
					))}
					<text className="frametime-axis-title" x={margin.left + plotWidth / 2} y={height - 8} textAnchor="middle">Share of frames slower than this (log scale)</text>
					<line className="frametime-reference" x1={x(0.01)} x2={x(0.01)} y1={margin.top} y2={margin.top + plotHeight} />
					<text className="frametime-reference-label" x={x(0.01) - 6} y={margin.top + 12} textAnchor="end">P1 FPS</text>
					{runs.map((run) => <path key={run.id} className={`frametime-line frametime-line--${run.profile}`} d={path(run.frameTimeMs)} />)}
					{profiles.map(({ id, label }, index) => (
						<text key={id} className="frametime-end-label" x={margin.left + plotWidth + 10} y={endLabelY[index]} dominantBaseline="middle">{compact ? label.split(' ')[0] : label}</text>
					))}
					{active !== null && (
						<g aria-hidden="true">
							<line className="frametime-crosshair" x1={tooltipLeft} x2={tooltipLeft} y1={margin.top} y2={margin.top + plotHeight} />
							{runs.map((run) => <circle key={run.id} className={`frametime-dot frametime-dot--${run.profile}`} cx={tooltipLeft} cy={y(run.frameTimeMs[active])} r="4" />)}
						</g>
					)}
				</svg>
				{/* The docked readout always renders so tapping the chart never shifts the table below. */}
				{(active !== null || compact) && (
					<div className={tooltipClass} style={tooltipPlacement ?? undefined} aria-hidden="true">
						<span className="frametime-tooltip-title">{active === null ? 'Tap or drag across the chart to read values' : `${oneIn(exceedance[active])} frames slower (${formatShare(exceedance[active])})`}</span>
						{/* The placeholder uses the same row structure, so the docked readout keeps one height. */}
						{profiles.map(({ id, label }) => {
							const value = active === null ? null : profileFrameTime(id, active);
							return (
								<span key={id} className="frametime-tooltip-row">
									<span className={`frametime-key frametime-key--${id}`} aria-hidden="true"></span>
									<strong>{value === null ? '–' : formatMs(value)}</strong>
									<span className="frametime-tooltip-fps">{value === null ? '' : formatFps(value)}</span>
									<span className="frametime-tooltip-label">{label}</span>
								</span>
							);
						})}
					</div>
				)}
			</div>
			<p className="visually-hidden" role="status">
				{active === null ? '' : `${oneIn(exceedance[active])} frames slower: ${profiles.map(({ id, label }) => `${label} ${formatMs(profileFrameTime(id, active))}`).join(', ')}.`}
			</p>
			<table className="frametime-table">
				<caption>Median of each profile&apos;s runs</caption>
				<thead>
					<tr>
						<th scope="col">Point in the distribution</th>
						{profiles.map(({ id, label }) => <th key={id} scope="col">{label}</th>)}
					</tr>
				</thead>
				<tbody>
					{percentileRows.map((row) => (
						<tr key={row.share}>
							<th scope="row">{row.label}<span>{row.detail}</span></th>
							{profiles.map(({ id }) => <td key={id}>{formatMs(row.values[id])}<span>{formatFps(row.values[id])}</span></td>)}
						</tr>
					))}
				</tbody>
			</table>
		</figure>
	);
}
