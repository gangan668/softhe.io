import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import FAQ from './FAQ';

describe('FAQ Component', () => {
	const renderFAQ = () => {
		return render(
			<BrowserRouter>
				<FAQ />
			</BrowserRouter>
		);
	};

	it('renders FAQ page header', () => {
		renderFAQ();
		expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
		expect(screen.getByText(/Find answers to common questions/i)).toBeInTheDocument();
	});

	it('renders all category buttons', () => {
		renderFAQ();
		expect(screen.getByText(/All Questions/i)).toBeInTheDocument();
		expect(screen.getByText(/General/i)).toBeInTheDocument();
		expect(screen.getByText(/Technical/i)).toBeInTheDocument();
		expect(screen.getByText(/Billing/i)).toBeInTheDocument();
		expect(screen.getByText(/Support/i)).toBeInTheDocument();
	});

	it('renders search input', () => {
		renderFAQ();
		const searchInput = screen.getByPlaceholderText(/Search for answers/i);
		expect(searchInput).toBeInTheDocument();
	});

	it('renders FAQ items', () => {
		renderFAQ();
		expect(screen.getByText(/What is Softhe.io and what do you offer?/i)).toBeInTheDocument();
		expect(screen.getByText(/What exactly is included in the custom Windows ISO?/i)).toBeInTheDocument();
	});

	it('toggles FAQ item when clicked', () => {
		renderFAQ();
		const faqButton = screen.getByText(/What is Softhe.io and what do you offer?/i);
		const faqItem = faqButton.closest('.faq-item');

		// Initially not active
		expect(faqItem).not.toHaveClass('active');

		// Click to expand
		fireEvent.click(faqButton);
		expect(faqItem).toHaveClass('active');

		// Click to collapse
		fireEvent.click(faqButton);
		expect(faqItem).not.toHaveClass('active');
	});

	it('filters FAQ items by category', () => {
		renderFAQ();

		// Click on Technical category
		const technicalButton = screen.getByText(/Technical/i);
		fireEvent.click(technicalButton);

		// Technical questions should be visible
		expect(screen.getByText(/How much performance improvement can I expect?/i)).toBeInTheDocument();

		// General category should have active class on All Questions by default
		expect(technicalButton).toHaveClass('active');
	});

	it('filters FAQ items by search term', () => {
		renderFAQ();
		const searchInput = screen.getByPlaceholderText(/Search for answers/i);

		// Search for "refund"
		fireEvent.change(searchInput, { target: { value: 'refund' } });

		// Should find the refund policy question
		expect(screen.getByText(/What is your refund policy?/i)).toBeInTheDocument();
	});

	it('shows no results message when search has no matches', () => {
		renderFAQ();
		const searchInput = screen.getByPlaceholderText(/Search for answers/i);

		// Search for something that doesn't exist
		fireEvent.change(searchInput, { target: { value: 'xyzabc123notfound' } });

		// Should show no results message
		expect(screen.getByText(/No results found/i)).toBeInTheDocument();
	});

	it('renders CTA section', () => {
		renderFAQ();
		expect(screen.getByText(/Still Have Questions?/i)).toBeInTheDocument();
		expect(screen.getByText(/Contact Support/i)).toBeInTheDocument();
		expect(screen.getByText(/Join Discord/i)).toBeInTheDocument();
	});

	it('has correct links in CTA section', () => {
		renderFAQ();
		const contactLink = screen.getByText(/Contact Support/i).closest('a');
		const discordLink = screen.getByText(/Join Discord/i).closest('a');

		expect(contactLink).toHaveAttribute('href', '/contact');
		expect(discordLink).toHaveAttribute('href', 'https://discord.com/users/softhecs');
	});

	it('expands matching FAQ items when searching', () => {
		renderFAQ();
		const searchInput = screen.getByPlaceholderText(/Search for answers/i);

		// Search for "ISO"
		fireEvent.change(searchInput, { target: { value: 'ISO' } });

		// FAQ items with "ISO" should be expanded (have active class)
		const isoQuestion = screen.getByText(/What exactly is included in the custom Windows ISO?/i);
		const faqItem = isoQuestion.closest('.faq-item');
		expect(faqItem).toHaveClass('active');
	});

	it('clears search when changing category', () => {
		renderFAQ();
		const searchInput = screen.getByPlaceholderText(/Search for answers/i);

		// Perform a search
		fireEvent.change(searchInput, { target: { value: 'test search' } });
		expect(searchInput.value).toBe('test search');

		// Click on a category
		const generalButton = screen.getByText(/General/i);
		fireEvent.click(generalButton);

		// Search should be cleared
		expect(searchInput.value).toBe('');
	});
});
