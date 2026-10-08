import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, Link } from 'react-router-dom';
import RouteMetadata from './RouteMetadata';
import SEO from './SEO';
import { absoluteUrl } from '../config/site';

const privateRoutes = ['/login', '/register', '/forgot-password', '/resend-confirmation', '/reset-password', '/account', '/admin'];
const publicRoutes = ['/', '/services', '/store', '/performance', '/contact', '/faq', '/checkout', '/privacy-policy', '/cookie-policy', '/terms', '/legal-notice', '/withdrawal'];
const robots = () => document.querySelector('meta[name="robots"]').content;
const canonical = () => document.querySelector('link[rel="canonical"]').href;

describe('route metadata policy', () => {
	it.each(privateRoutes)('keeps %s private during loading and after page metadata loads', (path) => {
		const view = render(<MemoryRouter initialEntries={[path]}><RouteMetadata /></MemoryRouter>);
		expect(robots()).toBe('noindex, nofollow');
		expect(canonical()).toBe(absoluteUrl(path));
		view.rerender(<MemoryRouter initialEntries={[path]}><RouteMetadata /><SEO title="Private page" /></MemoryRouter>);
		expect(robots()).toBe('noindex, nofollow');
	});
	it.each(publicRoutes)('sets public canonical metadata for %s', (path) => {
		render(<MemoryRouter initialEntries={[path]}><RouteMetadata /><SEO title="Public page" /></MemoryRouter>);
		expect(robots()).toBe('index, follow');
		expect(canonical()).toBe(absoluteUrl(path));
	});
	it('restores metadata on private/public SPA transitions', async () => {
		const user = userEvent.setup();
		render(<MemoryRouter><RouteMetadata /><SEO title="Routed page" /><Link to="/login">Login</Link><Link to="/store">Store</Link></MemoryRouter>);
		await user.click(screen.getByRole('link', { name: 'Login' }));
		expect(robots()).toBe('noindex, nofollow');
		expect(canonical()).toBe(absoluteUrl('/login'));
		await user.click(screen.getByRole('link', { name: 'Store' }));
		expect(robots()).toBe('index, follow');
		expect(canonical()).toBe(absoluteUrl('/store'));
	});
});
