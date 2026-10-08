import { readFile } from 'node:fs/promises';
import process from 'node:process';

const parseLogFile = async (path) => {
	const text = await readFile(path, 'utf8');
	return text.split(/\r?\n/).filter((line) => line.trim()).flatMap((line) => {
		try {
			const entry = JSON.parse(line);
			if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('Invalid log entry');
			return [entry];
		} catch { throw new Error('Monitoring log contains malformed JSON: ' + path); }
	});
};

const searchableText = (entry) => JSON.stringify(entry).toLowerCase();
const browserLogs = await parseLogFile(process.env.BROWSER_LOG_FILE || 'browser-errors.jsonl');
const deliveryLogs = await parseLogFile(process.env.DELIVERY_LOG_FILE || 'delivery-failures.jsonl');
const reviewLogs = await parseLogFile(process.env.CONFIRMATION_REVIEW_LOG_FILE || 'confirmation-reviews.jsonl');
const browserFailures = browserLogs.filter((entry) => searchableText(entry).includes('browser_error'));
const deliveryFailures = deliveryLogs.filter((entry) => /(?:contact|ticket|resend|emailjs|order|withdrawal)_delivery_failed/.test(searchableText(entry)));
const confirmationReviews = reviewLogs.filter((entry) => searchableText(entry).includes('stripe_confirmation_requires_review'));
const stripeLogs = await parseLogFile(process.env.STRIPE_LOG_FILE || 'stripe-events.jsonl');
const fulfillmentLogs = await parseLogFile(process.env.FULFILLMENT_LOG_FILE || 'fulfillment-events.jsonl');
const stripeFailures = stripeLogs.filter((entry) => searchableText(entry).includes('stripe_webhook_failed'));
const fulfillmentFailures = fulfillmentLogs.filter((entry) => /fulfillment_(?:delivery|processing)_failed/.test(searchableText(entry)));
const testAlert = process.env.TEST_ALERT || 'none';

if (testAlert === 'browser' && browserFailures.length === 0) throw new Error('Synthetic browser-error alert was not detected');
if (testAlert === 'delivery' && deliveryFailures.length === 0) throw new Error('Synthetic delivery-failure alert was not detected');
if (testAlert === 'stripe' && stripeFailures.length === 0) throw new Error('Synthetic Stripe-webhook alert was not detected');
if (testAlert === 'fulfillment' && fulfillmentFailures.length === 0) throw new Error('Synthetic fulfillment alert was not detected');
if (browserFailures.length || deliveryFailures.length || confirmationReviews.length || stripeFailures.length || fulfillmentFailures.length) {
	throw new Error(`Monitoring alert: ${browserFailures.length} browser error event(s), ${deliveryFailures.length} delivery failure event(s), ${confirmationReviews.length} confirmation review event(s), ${stripeFailures.length} Stripe webhook failure event(s), ${fulfillmentFailures.length} fulfillment failure event(s)`);
}

console.log('No browser-error, delivery-failure, confirmation-review, Stripe-webhook, or fulfillment failure events were detected in the monitoring window.');
