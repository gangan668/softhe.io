import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isPrivateRoute } from '../config/routePolicy';
import { absoluteUrl } from '../config/site';
import { commerceEnabled } from '../utils/runtimeConfig';

// The copy table pulls in benchmark and product data, so it loads as its own chunk; first page loads
// already have the same copy in their static HTML. Built with the same flag as scripts/postbuild.js.
let metadataTable;
const loadMetadataTable = () => {
	metadataTable ??= import('../config/pageMetadata').then(({ buildPageMetadata, socialCopy }) => ({
		byPath: new Map(buildPageMetadata({ commerceEnabled }).map((entry) => [entry.path, entry])),
		socialCopy,
	})).catch((error) => {
		// Forget the failed load so the next navigation retries instead of reusing the rejection.
		metadataTable = undefined;
		throw error;
	});
	return metadataTable;
};

const setHead = (selector, tag, attribute, value, contentAttribute, content) => {
	let element = document.head.querySelector(selector);
	if (!element) {
		element = document.createElement(tag);
		element.setAttribute(attribute, value);
		document.head.appendChild(element);
	}
	element.setAttribute(contentAttribute, content);
};
const setMeta = (name, content) => setHead(`meta[name="${name}"]`, 'meta', 'name', name, 'content', content);
const setProperty = (property, content) => setHead(`meta[property="${property}"]`, 'meta', 'property', property, 'content', content);

// Outside Suspense and protected content so loading, errors, and redirects retain the policy.
export default function RouteMetadata() {
	const { pathname } = useLocation();
	useEffect(() => {
		const url = absoluteUrl(pathname);
		setMeta('robots', isPrivateRoute(pathname) ? 'noindex, nofollow' : 'index, follow');
		setHead('link[rel="canonical"]', 'link', 'rel', 'canonical', 'href', url);
		setProperty('og:url', url);

		let current = true;
		loadMetadataTable().then(({ byPath, socialCopy }) => {
			// Unknown paths keep the current copy until the not-found page supplies its own.
			const entry = byPath.get(pathname.replace(/\/+$/, '') || '/');
			if (!current || !entry) return;
			const { ogTitle, ogDescription } = socialCopy(entry);
			const image = absoluteUrl('/images/social-share.jpg');
			document.title = entry.title;
			setMeta('description', entry.description);
			if (entry.keywords) setMeta('keywords', entry.keywords);
			else document.head.querySelector('meta[name="keywords"]')?.remove();
			setProperty('og:title', ogTitle);
			setProperty('og:description', ogDescription);
			setProperty('og:type', entry.type || 'website');
			setProperty('og:image', image);
			setMeta('twitter:card', 'summary_large_image');
			setMeta('twitter:title', ogTitle);
			setMeta('twitter:description', ogDescription);
			setMeta('twitter:image', image);
		}).catch(() => {
			// The static HTML already carries this route's copy; a failed chunk load only affects SPA transitions.
		});
		return () => { current = false; };
	}, [pathname]);
	return null;
}
