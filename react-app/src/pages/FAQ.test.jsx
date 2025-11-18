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

		// Use getAllByText and filter for buttons to avoid multiple matches
		const generalButtons = screen.getAllByText(/General/i);
		expect(generalButtons.some(el => el.classList.contains('category-btn'))).toBe(true);

		const technicalButtons = screen.getAllByText(/Technical/i);
		expect(technicalButtons.some(el => el.classList.contains('category-btn'))).toBe(true);

		const billingButtons = screen.getAllByText(/Billing/i);
		expect(billingButtons.some(el => el.classList.contains('category-btn'))).toBe(true);

		const supportButtons = screen.getAllByText(/Support/i);
		expect(supportButtons.some(el => el.classList.contains('category-btn'))).toBe(true);
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

		// Click on Technical category button specifically
		const technicalButtons = screen.getAllByText(/Technical/i);
		const technicalButton = technicalButtons.find(el => el.classList.contains('category-btn'));
		fireEvent.click(technicalButton);

		// Technical questions should be visible
		expect(screen.getByText(/How much performance improvement can I expect?/i)).toBeInTheDocument();

		// Technical button should have active class
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

		// Use getAllByText since "Contact Support" appears in both content and button
		const contactSupportElements = screen.getAllByText(/Contact Support/i);
		expect(contactSupportElements.length).toBeGreaterThan(0);

		// Check that at least one is a link/button
		const hasLink = contactSupportElements.some(el =>
			el.tagName === 'A' || el.closest('a') !== null
		);
		expect(hasLink).toBe(true);

		expect(screen.getByText(/Join Discord/i)).toBeInTheDocument();
	});

	it('has correct links in CTA section', () => {
		renderFAQ();

		// Get all Contact Support elements and find the one that's a link
		const contactSupportElements = screen.getAllByText(/Contact Support/i);
		const contactLinks = contactSupportElements.map(el => el.closest('a')).filter(Boolean);
		const contactLink = contactLinks.find(link => link.getAttribute('href') === '/contact');

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

		// Click on a category button specifically
		const generalButtons = screen.getAllByText(/General/i);
		const generalButton = generalButtons.find(el => el.classList.contains('category-btn'));
		fireEvent.click(generalButton);

		// Search should be cleared
		expect(searchInput.value).toBe('');
	});
});
