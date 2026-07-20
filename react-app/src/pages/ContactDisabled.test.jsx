import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Contact from './Contact';

vi.mock('../utils/runtimeConfig', () => ({ contactFormEnabled: false }));

describe('Contact with delivery disabled', () => {
	it('shows one email action without rendering an unusable form', () => {
		render(<MemoryRouter><Contact /></MemoryRouter>);
		expect(screen.queryByLabelText('Full Name *')).not.toBeInTheDocument();
		expect(screen.getByRole('link', { name: /email support/i })).toHaveAttribute('href', 'mailto:support@softhe.io');
		expect(screen.getByText(/unavailable until its delivery and privacy checks pass/i)).toBeInTheDocument();
	});
});
