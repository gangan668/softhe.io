import { useEffect } from 'react';

const FOCUSABLE_SELECTOR = [
	'a[href]',
	'button:not([disabled])',
	'input:not([disabled])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Supplies the keyboard and background-isolation behavior expected of a modal.
 * The visual treatment remains owned by each component.
 */
export function useDialogFocus({
	dialogRef,
	isOpen,
	onDismiss,
	initialFocusRef,
	backgroundSelector,
}) {
	useEffect(() => {
		if (!isOpen || !dialogRef.current) return undefined;

		const dialog = dialogRef.current;
		const returnFocusTo = document.activeElement;
		const previousOverflow = document.body.style.overflow;
		const backgroundElements = backgroundSelector
			? [...document.querySelectorAll(backgroundSelector)].filter(
					(element) => element !== dialog && !element.contains(dialog),
				)
			: [];
		const previousBackgroundState = backgroundElements.map((element) => ({
			element,
			inert: element.getAttribute('inert'),
			ariaHidden: element.getAttribute('aria-hidden'),
		}));

		document.body.style.overflow = 'hidden';
		backgroundElements.forEach((element) => {
			element.setAttribute('inert', '');
			element.setAttribute('aria-hidden', 'true');
		});

		const getFocusable = () => [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)].filter(
			(element) => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true',
		);
		const focusTarget = initialFocusRef?.current || getFocusable()[0] || dialog;
		focusTarget.focus();

		const handleKeyDown = (event) => {
			if (event.key === 'Escape') {
				event.preventDefault();
				onDismiss?.();
				return;
			}

			if (event.key !== 'Tab') return;
			const focusable = getFocusable();
			if (focusable.length === 0) {
				event.preventDefault();
				dialog.focus();
				return;
			}

			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
			document.body.style.overflow = previousOverflow;
			previousBackgroundState.forEach(({ element, inert, ariaHidden }) => {
				if (inert === null) element.removeAttribute('inert');
				else element.setAttribute('inert', inert);
				if (ariaHidden === null) element.removeAttribute('aria-hidden');
				else element.setAttribute('aria-hidden', ariaHidden);
			});
			if (returnFocusTo instanceof HTMLElement && returnFocusTo.isConnected) {
				returnFocusTo.focus();
			}
		};
	}, [backgroundSelector, dialogRef, initialFocusRef, isOpen, onDismiss]);
}
