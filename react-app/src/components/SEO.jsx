import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function SEO({
	title,
	description,
	keywords,
	ogTitle,
	ogDescription,
	ogImage,
	canonicalUrl,
	structuredData,
	noIndex = false,
	type = 'website'
}) {
	const location = useLocation();
	const baseUrl = import.meta.env.VITE_APP_URL || 'https://softhe.io';
	const fullUrl = `${baseUrl}${location.pathname}`;

	useEffect(() => {
		// Update document title
		if (title) {
			document.title = title;
		}

		// Update or create meta tags
		const updateMetaTag = (name, content, property = false) => {
			if (!content) return;

			const attribute = property ? 'property' : 'name';
			const attributeValue = property ? name : name;

			let element = document.querySelector(`meta[${attribute}="${attributeValue}"]`);

			if (!element) {
				element = document.createElement('meta');
				element.setAttribute(attribute, attributeValue);
				document.head.appendChild(element);
			}

			element.setAttribute('content', content);
		};

		// Standard meta tags
		updateMetaTag('description', description);
		updateMetaTag('keywords', keywords);
		updateMetaTag('robots', noIndex ? 'noindex, nofollow' : 'index, follow');

		// Open Graph tags
		updateMetaTag('og:title', ogTitle || title, true);
		updateMetaTag('og:description', ogDescription || description, true);
		updateMetaTag('og:type', type, true);
		updateMetaTag('og:url', fullUrl, true);
		updateMetaTag('og:image', ogImage || `${baseUrl}/images/social-share.png`, true);

		// Twitter Card tags
		updateMetaTag('twitter:card', 'summary_large_image');
		updateMetaTag('twitter:title', ogTitle || title);
		updateMetaTag('twitter:description', ogDescription || description);
		updateMetaTag('twitter:image', ogImage || `${baseUrl}/images/social-share.png`);
		updateMetaTag('twitter:site', '@SoftheCS');
		updateMetaTag('twitter:creator', '@SoftheCS');

		// Canonical URL
		let canonical = document.querySelector('link[rel="canonical"]');
		if (!canonical) {
			canonical = document.createElement('link');
			canonical.setAttribute('rel', 'canonical');
			document.head.appendChild(canonical);
		}
		canonical.setAttribute('href', canonicalUrl || fullUrl);

		// Structured data
		const structuredDataId = 'softhe-structured-data';
		let structuredDataElement = document.getElementById(structuredDataId);
		if (structuredData) {
			if (!structuredDataElement) {
				structuredDataElement = document.createElement('script');
				structuredDataElement.id = structuredDataId;
				structuredDataElement.type = 'application/ld+json';
				document.head.appendChild(structuredDataElement);
			}
			structuredDataElement.textContent = JSON.stringify(structuredData);
		} else if (structuredDataElement) {
			structuredDataElement.remove();
		}

	}, [title, description, keywords, ogTitle, ogDescription, ogImage, canonicalUrl, structuredData, noIndex, type, location.pathname, fullUrl, baseUrl]);

	return null; // This component doesn't render anything
}

export default SEO;
