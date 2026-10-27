// The one source for route titles, descriptions, and social copy. scripts/postbuild.js writes these
// into each route's static HTML and RouteMetadata applies them after client-side navigation, so the
// page a crawler fetches and the page a visitor sees cannot disagree.
// Node imports this module at build time, so relative imports keep their extensions.
import { benchmarkPublication, benchmarkResults } from '../data/benchmark.js';
import { PRODUCTS } from '../data/products.js';

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const lowestPrice = Math.min(...PRODUCTS.map((product) => product.price));

/**
 * @param {{ commerceEnabled: boolean }} options Same flag the storefront uses, so ordering copy matches the build.
 * @returns {Array<{ path: string, title: string, description: string, ogTitle?: string, ogDescription?: string, keywords?: string, robots?: string }>}
 */
export function buildPageMetadata({ commerceEnabled }) {
	const orderingNote = commerceEnabled ? '' : ' Online ordering is currently unavailable.';
	const { averageFps } = benchmarkResults;

	return [
		{
			path: '/',
			title: 'Windows and BIOS tuning for gaming PCs | Softhe.io',
			description: 'Custom Windows builds and BIOS tuning for gaming PCs, with a preliminary whole-system CS2 comparison, compatibility guidance, and setup support.',
			ogDescription: 'Custom Windows builds and BIOS tuning, with a preliminary whole-system CS2 comparison and setup support.',
			keywords: 'pc optimization, gaming optimization, fps boost, custom windows iso, bios optimization, esports performance, competitive gaming, windows optimization, gaming pc tuning',
		},
		{
			path: '/services',
			title: 'Windows and BIOS services | Softhe.io',
			description: 'Compare custom Windows builds and BIOS tuning for gaming PCs. See the scope, price, compatibility guidance, and support included with each service.',
			ogTitle: 'PC optimization services for gaming PCs | Softhe.io',
			ogDescription: 'Compare custom Windows builds, BIOS tuning, prices, and support for gaming PCs.',
			keywords: 'pc optimization services, windows iso, bios tuning, gaming pc optimization, custom windows, performance tuning, gaming services, esports optimization',
		},
		{
			path: '/store',
			title: 'Windows builds and BIOS tuning store | Softhe.io',
			description: `Compare custom Windows builds and BIOS tuning for gaming PCs by price, included work, and hardware fit. Products start at €${lowestPrice}.${orderingNote}`,
			ogTitle: 'Windows builds and BIOS tuning | Softhe.io',
			ogDescription: 'Compare the price, scope, and hardware fit of each Softhe.io product.',
			keywords: 'buy windows iso, custom windows, bios optimization service, gaming pc products, windows optimization, pc optimization store',
		},
		{
			path: '/performance',
			title: 'Preliminary CS2 benchmark results | Softhe.io',
			description: 'Review a preliminary whole-system CS2 comparison, its changed variables, and the evidence still needed to reproduce it.',
			ogTitle: 'CS2 benchmark comparison | Softhe.io',
			ogDescription: `One PC measured ${averageFps.stock} and ${averageFps.optimized} average FPS across two configurations. ${capitalize(benchmarkPublication.captureCountText)} raw captures are published and several variables changed.`,
			keywords: 'fps benchmarks, gaming performance, cs2 fps, counter-strike performance, windows optimization results, gaming benchmarks, fps comparison, frame time optimization',
		},
		{
			path: '/contact',
			title: 'Contact product and setup support | Softhe.io',
			description: 'Contact Softhe.io about custom Windows builds, BIOS tuning, compatibility questions, setup guidance, or an existing order.',
			ogTitle: 'Contact Softhe.io',
			ogDescription: 'Need help choosing or setting up a PC optimization product? Email and Discord support are available.',
			keywords: 'contact pc optimization, gaming support, technical support, pc optimization help, custom windows support, bios tuning support, gaming pc help',
		},
		{
			path: '/checkout',
			title: 'Checkout | Softhe.io',
			description: `Review your selected Softhe.io products and order terms before payment.${orderingNote}`,
			robots: 'noindex, nofollow',
		},
		{
			path: '/faq',
			title: 'Windows and BIOS tuning FAQ | Softhe.io',
			description: 'Answers about Softhe.io Windows builds, BIOS tuning, compatibility, benchmark limits, orders, and support.',
			keywords: 'PC optimization FAQ, Windows ISO questions, BIOS tuning help, gaming optimization FAQ',
		},
		{
			path: '/privacy-policy',
			title: 'Privacy Policy | Softhe.io',
			description: 'How Softhe.io handles contact, checkout, analytics, rate-limit, and support data.',
		},
		{
			path: '/cookie-policy',
			title: 'Cookie Policy | Softhe.io',
			description: 'How Softhe.io uses essential browser storage and optional consent-based analytics.',
		},
		{
			path: '/terms',
			title: 'Terms of Service | Softhe.io',
			description: 'Terms for Softhe.io digital products, optimization services, payments, delivery, support, and refunds.',
		},
		{
			path: '/legal-notice',
			title: 'Legal Notice | Softhe.io',
			description: 'Operator and contact information for the Softhe.io website and services.',
		},
		{
			path: '/withdrawal',
			title: 'Withdraw from an Order | Softhe.io',
			description: 'Submit a withdrawal request for an eligible Softhe.io distance contract and receive a timestamped acknowledgement.',
		},
		{
			path: '/login',
			title: 'Customer Login | Softhe.io',
			description: 'Sign in to your Softhe.io customer account.',
			robots: 'noindex, nofollow',
		},
		{
			path: '/register',
			title: 'Create Customer Account | Softhe.io',
			description: 'Create a verified Softhe.io customer account.',
			robots: 'noindex, nofollow',
		},
		{
			path: '/forgot-password',
			title: 'Reset Password | Softhe.io',
			description: 'Request a secure password reset for your Softhe.io customer account.',
			robots: 'noindex, nofollow',
		},
		{
			path: '/resend-confirmation',
			title: 'Resend Account Confirmation | Softhe.io',
			description: 'Request a new confirmation link for an unverified Softhe.io customer account.',
			robots: 'noindex, nofollow',
		},
		{
			path: '/reset-password',
			title: 'Choose a New Password | Softhe.io',
			description: 'Choose a new password for your Softhe.io customer account.',
			robots: 'noindex, nofollow',
		},
		{
			path: '/account',
			title: 'Customer Account | Softhe.io',
			description: 'Manage your Softhe.io profile, orders, tickets, and account history.',
			robots: 'noindex, nofollow',
		},
		{
			path: '/admin',
			title: 'Staff Portal | Softhe.io',
			description: 'Softhe.io staff portal.',
			robots: 'noindex, nofollow',
		},
	];
}

/** Social copy falls back to the page copy, matching what postbuild writes. */
export const socialCopy = (entry) => ({
	ogTitle: entry.ogTitle || entry.title,
	ogDescription: entry.ogDescription || entry.description,
});
