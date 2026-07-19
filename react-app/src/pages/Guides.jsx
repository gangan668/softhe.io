import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { guides } from '../data/guides';
import './Guides.css';

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
							<article className="guide-card" key={guide.slug}>
								<span className="section-kicker">Guide</span>
								<h2>{guide.title}</h2>
								<p>{guide.description}</p>
								<p className="guide-reading-time">{guide.readingTime}</p>
								<ul>
										{guide.points.map((point) => (
											<li key={point}>{point}</li>
									))}
								</ul>
								<Link className="guide-link" to={`/guides/${guide.slug}`}>Read guide <span aria-hidden="true">→</span></Link>
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
