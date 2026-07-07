import SEO from '../components/SEO';
import './Guides.css';

const guides = [
	{
		title: 'CS2 Optimization Checklist',
		slug: 'cs2-optimization-checklist',
		description: 'A practical checklist for reducing overhead, checking launch settings, keeping drivers clean, and validating FPS changes in Counter-Strike 2.',
		points: ['Validate baseline FPS first', 'Reduce startup and overlay noise', 'Compare frame pacing after each change'],
	},
	{
		title: 'Windows 10 vs Windows 11 for Gaming',
		slug: 'windows-10-vs-11-gaming',
		description: 'How to choose between a lean Windows 10 build and a current Windows 11 setup when compatibility, latency, and feature support matter.',
		points: ['Match the OS to hardware age', 'Keep security and driver support in view', 'Avoid changing OS without a rollback plan'],
	},
	{
		title: 'BIOS Optimization for Stable FPS',
		slug: 'bios-optimization-stable-fps',
		description: 'What BIOS tuning can improve, what it should not touch blindly, and why memory stability matters more than aggressive settings.',
		points: ['Document current BIOS settings', 'Tune memory carefully', 'Stress test before calling changes done'],
	},
	{
		title: 'Gaming PC Latency Basics',
		slug: 'gaming-pc-latency-basics',
		description: 'A plain-English guide to input latency, frame time consistency, background tasks, and the checks worth doing before buying new hardware.',
		points: ['Separate FPS from latency', 'Watch frame time spikes', 'Measure changes with repeatable tests'],
	},
];

function Guides() {
	return (
		<>
			<SEO
				title="Gaming PC Optimization Guides | Softhe.io"
				description="High-intent gaming PC optimization guides covering CS2, Windows 10 vs 11, BIOS tuning, and latency basics."
				keywords="CS2 optimization, Windows 10 vs Windows 11 gaming, BIOS optimization, gaming PC latency, FPS stability"
				ogTitle="Gaming PC Optimization Guides"
				ogDescription="Practical optimization guides for competitive gaming PCs."
				structuredData={{
					'@context': 'https://schema.org',
					'@type': 'ItemList',
					name: 'Softhe.io Gaming PC Optimization Guides',
					itemListElement: guides.map((guide, index) => ({
						'@type': 'ListItem',
						position: index + 1,
						url: `https://softhe.io/guides#${guide.slug}`,
						name: guide.title,
					})),
				}}
			/>
			<div className="guides-page">
				<section className="page-header">
					<div className="container">
						<h1>Optimization Guides</h1>
						<p>Practical guidance for players comparing Windows, BIOS, FPS, and latency optimization options.</p>
					</div>
				</section>

				<section className="guides-content">
					<div className="container">
						<div className="guides-grid">
							{guides.map((guide) => (
								<article className="guide-card" id={guide.slug} key={guide.slug}>
									<span className="section-kicker">Guide</span>
									<h2>{guide.title}</h2>
									<p>{guide.description}</p>
									<ul>
										{guide.points.map((point) => (
											<li key={point}>{point}</li>
										))}
									</ul>
								</article>
							))}
						</div>
					</div>
				</section>
			</div>
		</>
	);
}

export default Guides;
