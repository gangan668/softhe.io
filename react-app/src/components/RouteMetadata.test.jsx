import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, Link } from 'react-router-dom';
import RouteMetadata from './RouteMetadata';
import SEO from './SEO';
import { absoluteUrl } from '../config/site';
import { buildPageMetadata, socialCopy } from '../config/pageMetadata';
import { commerceEnabled } from '../utils/runtimeConfig';

const privateRoutes = ['/login', '/register', '/forgot-password', '/resend-confirmation', '/reset-password', '/account', '/admin'];
const publicRoutes = ['/', '/services', '/store', '/performance', '/contact', '/faq', '/checkout', '/privacy-policy', '/cookie-policy', '/terms', '/legal-notice', '/withdrawal'];
const robots = () => document.querySelector('meta[name="robots"]').content;
const canonical = () => document.querySelector('link[rel="canonical"]').href;
const meta = (attribute, name) => document.querySelector(`meta[${attribute}="${name}"]`)?.content ?? null;

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
	it.each(buildPageMetadata({ commerceEnabled }))('applies the shared copy for $path', async (entry) => {
		render(<MemoryRouter initialEntries={[entry.path]}><RouteMetadata /></MemoryRouter>);
		const { ogTitle, ogDescription } = socialCopy(entry);
		// The copy table loads as its own chunk, so it lands just after the synchronous robots/canonical policy.
		await waitFor(() => expect(document.title).toBe(entry.title));
		expect(meta('name', 'description')).toBe(entry.description);
		expect(meta('property', 'og:title')).toBe(ogTitle);
		expect(meta('property', 'og:description')).toBe(ogDescription);
		expect(meta('name', 'twitter:title')).toBe(ogTitle);
		expect(meta('name', 'twitter:description')).toBe(ogDescription);
		expect(meta('name', 'keywords')).toBe(entry.keywords ?? null);
	});
	it('replaces the previous page copy on navigation to a page without its own SEO component', async () => {
		const user = userEvent.setup();
		render(<MemoryRouter initialEntries={['/store']}><RouteMetadata /><Link to="/reset-password">Reset</Link></MemoryRouter>);
		await user.click(screen.getByRole('link', { name: 'Reset' }));
		await waitFor(() => expect(document.title).toBe('Choose a New Password | Softhe.io'));
	});
	it('removes page structured data when the page unmounts', () => {
		const view = render(<MemoryRouter><SEO structuredData={{ '@type': 'Organization' }} /></MemoryRouter>);
		expect(document.querySelectorAll('#softhe-structured-data')).toHaveLength(1);
		view.unmount();
		expect(document.getElementById('softhe-structured-data')).toBeNull();
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
