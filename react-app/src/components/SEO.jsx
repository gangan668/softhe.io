import { useEffect } from 'react';

const setMeta = (attribute, name, content) => {
	let element = document.querySelector(`meta[${attribute}="${name}"]`);
	if (!element) {
		element = document.createElement('meta');
		element.setAttribute(attribute, name);
		document.head.appendChild(element);
	}
	element.setAttribute('content', content);
};

/**
 * Page-specific head additions. Route titles, descriptions, and social copy come from
 * config/pageMetadata via RouteMetadata; pass them here only for pages outside that table,
 * such as the not-found page.
 */
function SEO({ title, description, canonicalUrl, structuredData, noIndex = false }) {
	useEffect(() => {
		if (title) {
			document.title = title;
			setMeta('property', 'og:title', title);
			setMeta('name', 'twitter:title', title);
		}
		if (description) {
			setMeta('name', 'description', description);
			setMeta('property', 'og:description', description);
			setMeta('name', 'twitter:description', description);
		}
		if (noIndex) setMeta('name', 'robots', 'noindex, nofollow');
		if (canonicalUrl) document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonicalUrl);

		if (!structuredData) return undefined;
		// Owned by the page that rendered it, so it leaves with that page.
		const structuredDataElement = document.createElement('script');
		structuredDataElement.id = 'softhe-structured-data';
		structuredDataElement.type = 'application/ld+json';
		structuredDataElement.textContent = JSON.stringify(structuredData);
		document.getElementById(structuredDataElement.id)?.remove();
		document.head.appendChild(structuredDataElement);
		return () => structuredDataElement.remove();
	}, [title, description, canonicalUrl, structuredData, noIndex]);

	return null;
}

export default SEO;
