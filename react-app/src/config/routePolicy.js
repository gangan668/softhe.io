const privateRoutes = new Set(['/login', '/register', '/forgot-password', '/resend-confirmation', '/reset-password', '/account', '/admin']);

const publicAnalyticsPaths = new Set(['/', '/services', '/store', '/performance', '/contact', '/faq', '/privacy-policy', '/cookie-policy', '/terms', '/legal-notice', '/withdrawal']);

export function publicAnalyticsPath(pathname) {
	return publicAnalyticsPaths.has(pathname) ? pathname : null;
}

export function isPrivateRoute(pathname) {
	const path = pathname.replace(/\/+$/, '') || '/';
	return [...privateRoutes].some((route) => path === route || path.startsWith(`${route}/`));
}
