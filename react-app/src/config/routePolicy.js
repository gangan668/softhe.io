const privateRoutes = new Set(['/login', '/register', '/forgot-password', '/resend-confirmation', '/reset-password', '/account', '/admin']);

export function isPrivateRoute(pathname) {
	const path = pathname.replace(/\/+$/, '') || '/';
	return [...privateRoutes].some((route) => path === route || path.startsWith(`${route}/`));
}
