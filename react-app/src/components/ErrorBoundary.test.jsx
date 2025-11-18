import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }) => {
	if (shouldThrow) {
		throw new Error('Test error');
	}
	return <div>No error</div>;
};

// Component with component stack error
const NestedThrowError = () => {
	return (
		<div>
			<ThrowError shouldThrow={true} />
		</div>
	);
};

describe('ErrorBoundary', () => {
	let originalEnv;

	beforeEach(() => {
		// Save original NODE_ENV
		originalEnv = process.env.NODE_ENV;
		// Suppress console.error for tests
		vi.spyOn(console, 'error').mockImplementation(() => { });
	});

	afterEach(() => {
		// Restore original NODE_ENV
		process.env.NODE_ENV = originalEnv;
		vi.restoreAllMocks();
	});

	it('should render children when there is no error', () => {
		render(
			<ErrorBoundary>
				<div>Test content</div>
			</ErrorBoundary>
		);

		expect(screen.getByText('Test content')).toBeInTheDocument();
	});

	it('should render error UI when child component throws', () => {
		render(
			<ErrorBoundary>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>
		);

		expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();
		expect(screen.getByText(/We're sorry for the inconvenience/i)).toBeInTheDocument();
	});

	it('should display error icon', () => {
		render(
			<ErrorBoundary>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>
		);

		const errorIcon = document.querySelector('.fa-exclamation-triangle');
		expect(errorIcon).toBeInTheDocument();
	});

	it('should display action buttons', () => {
		render(
			<ErrorBoundary>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>
		);

		expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /go home/i })).toBeInTheDocument();
	});

	it('should display support email link', () => {
		render(
			<ErrorBoundary>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>
		);

		const supportLink = screen.getByText('support@softhe.io');
		expect(supportLink).toBeInTheDocument();
		expect(supportLink).toHaveAttribute('href', 'mailto:support@softhe.io');
	});

	it('should attempt to reset when Try Again button is clicked', () => {
		render(
			<ErrorBoundary>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>
		);

		const tryAgainButton = screen.getByRole('button', { name: /try again/i });
		tryAgainButton.click();

		// After reset, error boundary should try to render children again
		// Since ThrowError still throws, error UI should still be visible
		expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();
	});

	it('should show error details in development mode', () => {
		process.env.NODE_ENV = 'development';

		render(
			<ErrorBoundary>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>
		);

		const details = screen.getByText('Error Details (Development Only)');
		expect(details).toBeInTheDocument();
	});

	it('should not show error details in production mode', () => {
		process.env.NODE_ENV = 'production';

		render(
			<ErrorBoundary>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>
		);

		const details = screen.queryByText('Error Details (Development Only)');
		expect(details).not.toBeInTheDocument();
	});

	it('should call console.error when error is caught', () => {
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

		render(
			<ErrorBoundary>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>
		);

		expect(consoleSpy).toHaveBeenCalled();
	});

	it('should handle nested errors', () => {
		render(
			<ErrorBoundary>
				<NestedThrowError />
			</ErrorBoundary>
		);

		expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();
	});

	it('should have correct home link', () => {
		render(
			<ErrorBoundary>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>
		);

		const homeLink = screen.getByRole('link', { name: /go home/i });
		expect(homeLink).toHaveAttribute('href', '/');
	});

	it('should render with correct CSS classes', () => {
		const { container } = render(
			<ErrorBoundary>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>
		);

		expect(container.querySelector('.error-boundary')).toBeInTheDocument();
		expect(container.querySelector('.error-boundary-container')).toBeInTheDocument();
		expect(container.querySelector('.error-icon')).toBeInTheDocument();
		expect(container.querySelector('.error-title')).toBeInTheDocument();
		expect(container.querySelector('.error-actions')).toBeInTheDocument();
	});

	it('should handle multiple children without error', () => {
		render(
			<ErrorBoundary>
				<div>Child 1</div>
				<div>Child 2</div>
				<div>Child 3</div>
			</ErrorBoundary>
		);

		expect(screen.getByText('Child 1')).toBeInTheDocument();
		expect(screen.getByText('Child 2')).toBeInTheDocument();
		expect(screen.getByText('Child 3')).toBeInTheDocument();
	});

	it('should catch errors from any child in multiple children', () => {
		render(
			<ErrorBoundary>
				<div>Child 1</div>
				<ThrowError shouldThrow={true} />
				<div>Child 3</div>
			</ErrorBoundary>
		);

		expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();
		expect(screen.queryByText('Child 1')).not.toBeInTheDocument();
		expect(screen.queryByText('Child 3')).not.toBeInTheDocument();
	});

	it('should maintain error state after error is caught', () => {
		const { rerender } = render(
			<ErrorBoundary>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>
		);

		expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();

		// Rerender with same props
		rerender(
			<ErrorBoundary>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>
		);

		// Should still show error UI
		expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();
	});

	it('should display all action button icons', () => {
		const { container } = render(
			<ErrorBoundary>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>
		);

		expect(container.querySelector('.fa-redo')).toBeInTheDocument();
		expect(container.querySelector('.fa-sync')).toBeInTheDocument();
		expect(container.querySelector('.fa-home')).toBeInTheDocument();
	});

	it('should have support section with icon', () => {
		const { container } = render(
			<ErrorBoundary>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>
		);

		const supportSection = container.querySelector('.error-support');
		expect(supportSection).toBeInTheDocument();
		expect(supportSection.querySelector('.fa-envelope')).toBeInTheDocument();
	});
});
