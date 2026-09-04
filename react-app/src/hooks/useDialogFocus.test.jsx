import { useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useDialogFocus } from './useDialogFocus';

function DialogProbe({
	isOpen = true,
	onDismiss,
	withDialog = true,
	withInitialFocus = false,
	withButtons = true,
	backgroundSelector,
	modal = true,
}) {
	const dialogRef = useRef(null);
	const initialFocusRef = useRef(null);
	useDialogFocus({
		dialogRef,
		isOpen,
		onDismiss,
		initialFocusRef: withInitialFocus ? initialFocusRef : undefined,
		backgroundSelector,
		modal,
	});

	if (!withDialog) return null;
	return (
		<div ref={dialogRef} role="dialog" aria-label="Test dialog" tabIndex={-1}>
			{withButtons && (
				<>
					<button type="button">First</button>
					<button ref={initialFocusRef} type="button">Initial</button>
					<button type="button">Last</button>
					<button type="button" hidden>Hidden</button>
					<button type="button" aria-hidden="true">ARIA hidden</button>
				</>
			)}
		</div>
	);
}

afterEach(() => {
	cleanup();
	document.body.style.overflow = '';
});

describe('useDialogFocus', () => {
	it('does nothing when closed or when the dialog ref has no element', () => {
		const onDismiss = vi.fn();
		const { rerender } = render(<DialogProbe isOpen={false} onDismiss={onDismiss} />);
		expect(screen.getByRole('dialog', { name: /test dialog/i })).not.toHaveFocus();
		expect(document.body.style.overflow).toBe('');

		rerender(<DialogProbe isOpen={true} onDismiss={onDismiss} withDialog={false} />);
		expect(document.body.style.overflow).toBe('');
	});

	it('uses the requested initial focus target and restores the trigger and body overflow', () => {
		const trigger = document.createElement('button');
		trigger.textContent = 'Open';
		document.body.appendChild(trigger);
		trigger.focus();
		document.body.style.overflow = 'scroll';

		const { unmount } = render(<DialogProbe withInitialFocus />);
		expect(screen.getByRole('button', { name: 'Initial' })).toHaveFocus();
		expect(document.body.style.overflow).toBe('hidden');

		unmount();
		expect(document.body.style.overflow).toBe('scroll');
		expect(trigger).toHaveFocus();
		trigger.remove();
	});

	it('falls back to the first focusable control', () => {
		render(<DialogProbe />);
		expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
	});

	it('wraps forward and backward Tab focus inside the dialog', async () => {
		const user = userEvent.setup();
		render(<DialogProbe />);
		const first = screen.getByRole('button', { name: 'First' });
		const last = screen.getByRole('button', { name: 'Last' });

		last.focus();
		await user.tab();
		expect(first).toHaveFocus();

		await user.tab({ shift: true });
		expect(last).toHaveFocus();

		first.focus();
		await user.keyboard('{ArrowDown}');
		expect(first).toHaveFocus();
	});

	it('keeps focus on a dialog that has no focusable descendants', async () => {
		const user = userEvent.setup();
		render(<DialogProbe withButtons={false} />);
		const dialog = screen.getByRole('dialog', { name: /test dialog/i });
		expect(dialog).toHaveFocus();

		await user.tab();
		expect(dialog).toHaveFocus();
	});

	it('dismisses on Escape', async () => {
		const user = userEvent.setup();
		const onDismiss = vi.fn();
		render(<DialogProbe onDismiss={onDismiss} />);

		await user.keyboard('{Escape}');
		expect(onDismiss).toHaveBeenCalledOnce();
	});

	it('keeps page scrolling and background interaction available for non-modal banners', async () => {
		const user = userEvent.setup();
		const background = document.createElement('main');
		background.className = 'banner-background';
		document.body.appendChild(background);
		document.body.style.overflow = 'auto';

		render(
			<DialogProbe
				backgroundSelector=".banner-background"
				modal={false}
			/>,
		);

		expect(document.body.style.overflow).toBe('auto');
		expect(background).not.toHaveAttribute('inert');
		expect(background).not.toHaveAttribute('aria-hidden');

		const last = screen.getByRole('button', { name: 'Last' });
		last.focus();
		await user.tab();
		expect(last).not.toHaveFocus();
		background.remove();
	});

	it('isolates backgrounds and restores absent and pre-existing attributes', () => {
		const plainBackground = document.createElement('main');
		plainBackground.className = 'modal-background';
		const statefulBackground = document.createElement('aside');
		statefulBackground.className = 'modal-background';
		statefulBackground.setAttribute('inert', 'persist');
		statefulBackground.setAttribute('aria-hidden', 'false');
		document.body.append(plainBackground, statefulBackground);

		const { unmount } = render(
			<DialogProbe backgroundSelector=".modal-background" />,
		);
		expect(plainBackground).toHaveAttribute('inert');
		expect(plainBackground).toHaveAttribute('aria-hidden', 'true');
		expect(statefulBackground).toHaveAttribute('aria-hidden', 'true');

		unmount();
		expect(plainBackground).not.toHaveAttribute('inert');
		expect(plainBackground).not.toHaveAttribute('aria-hidden');
		expect(statefulBackground).toHaveAttribute('inert', 'persist');
		expect(statefulBackground).toHaveAttribute('aria-hidden', 'false');
		plainBackground.remove();
		statefulBackground.remove();
	});

	it('does not restore focus to a trigger that has been removed', () => {
		const trigger = document.createElement('button');
		document.body.appendChild(trigger);
		trigger.focus();
		const { unmount } = render(<DialogProbe />);
		trigger.remove();

		expect(() => unmount()).not.toThrow();
	});
});
