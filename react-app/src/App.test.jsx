import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import App from './App';
vi.mock('./utils/monitoring', () => ({ initMonitoring: () => undefined, reportError: vi.fn() }));
vi.mock('./utils/analytics', async (original) => ({ ...await original(), trackPageView: vi.fn(), trackEvent: vi.fn(), initGA: vi.fn(), hasConsentDecision: () => true }));
beforeEach(() => { localStorage.setItem('softhe_analytics_consent', 'false'); window.history.replaceState(null, '', '/'); });
afterEach(() => { cleanup(); window.history.replaceState(null, '', '/'); });
it('routes an expired recovery callback to a readable recovery request and removes callback fragments', async () => { window.history.replaceState(null, '', '/reset-password#error=access_denied&error_code=otp_expired'); render(<App />); await screen.findByRole('heading', { name: 'Reset your password' }); expect(window.location.pathname).toBe('/forgot-password'); expect(window.location.hash).toBe(''); expect(screen.getByRole('alert')).toHaveTextContent('This password reset link is invalid or has expired'); });
it('moves keyboard focus to main content after public route navigation', async () => { render(<App />); fireEvent.click(screen.getByRole('navigation', { name: 'Primary navigation' }).querySelector('a[href="/faq"]')); await screen.findByRole('heading', { name: /Questions about products and support/i }); await waitFor(() => expect(document.activeElement).toBe(document.getElementById('main-content'))); });



