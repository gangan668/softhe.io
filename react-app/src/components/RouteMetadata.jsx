import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isPrivateRoute } from '../config/routePolicy';
import { absoluteUrl } from '../config/site';

// Outside Suspense and protected content so loading, errors, and redirects retain the policy.
export default function RouteMetadata() {
	const { pathname } = useLocation();
	useEffect(() => {
		const setHead = (selector, tag, attribute, value, contentAttribute) => {
			let element = document.head.querySelector(selector);
			if (!element) {
				element = document.createElement(tag);
				element.setAttribute(attribute, value);
				document.head.appendChild(element);
			}
			element.setAttribute(contentAttribute, tag === 'meta' && attribute === 'name'
				? (isPrivateRoute(pathname) ? 'noindex, nofollow' : 'index, follow') : absoluteUrl(pathname));
		};
		setHead('meta[name="robots"]', 'meta', 'name', 'robots', 'content');
		setHead('link[rel="canonical"]', 'link', 'rel', 'canonical', 'href');
		setHead('meta[property="og:url"]', 'meta', 'property', 'og:url', 'content');
	}, [pathname]);
	return null;
}
