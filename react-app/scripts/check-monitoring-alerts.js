import { readFile } from 'node:fs/promises';
import process from 'node:process';

const parseLogFile = async (path) => {
	const text = await readFile(path, 'utf8').catch(() => '');
	return text.split(/\r?\n/).filter(Boolean).flatMap((line) => {
		try { return [JSON.parse(line)]; } catch { return []; }
	});
};

const searchableText = (entry) => JSON.stringify(entry).toLowerCase();
const browserLogs = await parseLogFile(process.env.BROWSER_LOG_FILE || 'browser-errors.jsonl');
const deliveryLogs = await parseLogFile(process.env.DELIVERY_LOG_FILE || 'delivery-failures.jsonl');
const reviewLogs = await parseLogFile(process.env.CONFIRMATION_REVIEW_LOG_FILE || 'confirmation-reviews.jsonl');
const browserFailures = browserLogs.filter((entry) => searchableText(entry).includes('browser_error'));
const deliveryFailures = deliveryLogs.filter((entry) => /(?:contact|ticket|resend|emailjs|order|withdrawal)_delivery_failed/.test(searchableText(entry)));
const confirmationReviews = reviewLogs.filter((entry) => searchableText(entry).includes('stripe_confirmation_requires_review'));
const testAlert = process.env.TEST_ALERT || 'none';

if (testAlert === 'browser' && browserFailures.length === 0) throw new Error('Synthetic browser-error alert was not detected');
if (testAlert === 'delivery' && deliveryFailures.length === 0) throw new Error('Synthetic delivery-failure alert was not detected');
if (browserFailures.length || deliveryFailures.length || confirmationReviews.length) {
	throw new Error(`Monitoring alert: ${browserFailures.length} browser error event(s), ${deliveryFailures.length} delivery failure event(s), ${confirmationReviews.length} confirmation review event(s)`);
}

console.log('No browser-error, delivery-failure, or confirmation-review events were detected in the monitoring window.');
