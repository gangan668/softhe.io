import { Link, Navigate, useParams } from 'react-router-dom';
import SEO from '../components/SEO';
import { absoluteUrl, siteConfig } from '../config/site';
import { findGuide } from '../data/guides';
import './Guides.css';

function GuideDetail() {
	const { slug } = useParams();
	const guide = findGuide(slug);

	if (!guide) return <Navigate to="/404" replace />;

	const canonicalUrl = absoluteUrl(`/guides/${guide.slug}`);
	return (
		<>
			<SEO
				title={`${guide.title} | Softhe.io`}
				description={guide.description}
				canonicalUrl={canonicalUrl}
				type="article"
				structuredData={{
					'@context': 'https://schema.org',
					'@type': 'Article',
					headline: guide.title,
					description: guide.description,
					mainEntityOfPage: canonicalUrl,
					publisher: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.url },
				}}
			/>
			<article className="guide-detail">
				<header className="page-header">
					<div className="container">
						<span className="section-kicker">Optimization guide</span>
						<h1>{guide.title}</h1>
						<p>{guide.description}</p>
						<p className="guide-reading-time">{guide.readingTime}</p>
					</div>
				</header>
				<div className="guides-content">
					<div className="container guide-detail-layout">
						<nav className="guide-toc" aria-label="Guide contents">
							<strong>In this guide</strong>
							<ul>
								{guide.sections.map((section, index) => <li key={section.heading}><a href={`#section-${index + 1}`}>{section.heading}</a></li>)}
							</ul>
						</nav>
						<div className="guide-article-card">
							{guide.sections.map((section, index) => (
								<section id={`section-${index + 1}`} key={section.heading}>
									<h2>{section.heading}</h2>
									{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
								</section>
							))}
							<aside className="guide-safety-note">
								<strong>Safety note</strong>
								<p>Back up important data, keep recovery options available, and stay within hardware and software vendor guidance. Results vary by system.</p>
							</aside>
							<Link className="guide-link" to="/guides">← All guides</Link>
						</div>
					</div>
				</div>
			</article>
		</>
	);
}

export default GuideDetail;
