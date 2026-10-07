import { act, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import WebAnalytics from './WebAnalytics';

vi.mock('./VercelAnalyticsClient', () => { throw new Error('Optional analytics chunk unavailable'); });
afterEach(() => { localStorage.clear(); vi.unstubAllEnvs(); });

it('keeps the website usable when the consented optional analytics chunk fails', async () => {
	vi.stubEnv('PROD', true);
	localStorage.setItem('softhe_analytics_consent', 'true');
	await act(async () => render(<MemoryRouter><h1>Website content</h1><button>Continue browsing</button><WebAnalytics /></MemoryRouter>));
	expect(screen.getByRole('heading', { name: 'Website content' })).toBeVisible();
	expect(screen.getByRole('button', { name: 'Continue browsing' })).toBeEnabled();
	expect(document.querySelector('script[src$="/_vercel/insights/script.js"]')).toBeNull();
});
