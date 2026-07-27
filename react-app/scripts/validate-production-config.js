import process from 'node:process';

const isStrict = process.env.VITE_REQUIRE_PRODUCTION_CONFIG === 'true';

if (isStrict) {
	const required = [
		'VITE_APP_URL',
		'VITE_LEGAL_NAME',
		'VITE_LEGAL_ADDRESS',
		'VITE_BUSINESS_REGISTRATION_ID',
		'VITE_LEGAL_JURISDICTION',
		'VITE_VAT_STATUS',
		'VITE_SUPPORT_EMAIL',
		'VITE_BENCHMARK_HARDWARE',
		'VITE_BENCHMARK_SOFTWARE',
		'VITE_BENCHMARK_SCENARIO',
		'VITE_BENCHMARK_CAPTURE_DATE',
		'VITE_BENCHMARK_RUN_COUNT',
		'VITE_BENCHMARK_SUMMARY_METHOD',
		'VITE_COMMERCE_ENABLED',
		'VITE_CONTACT_FORM_ENABLED',
	];
	const missing = required.filter((key) => !process.env[key]?.trim());
	const invalidFlags = ['VITE_COMMERCE_ENABLED', 'VITE_CONTACT_FORM_ENABLED']
		.filter((key) => !['true', 'false'].includes(process.env[key]));
	const invalidVatStatus = !['registered', 'not-registered', 'exempt']
		.includes(process.env.VITE_VAT_STATUS);
	const invalidRunCount = !Number.isInteger(Number(process.env.VITE_BENCHMARK_RUN_COUNT))
		|| Number(process.env.VITE_BENCHMARK_RUN_COUNT) < 3;
	const invalidSummaryMethod = process.env.VITE_BENCHMARK_SUMMARY_METHOD !== 'median';
	const invalidJurisdiction = process.env.VITE_LEGAL_JURISDICTION?.trim().toLowerCase() !== 'sweden';
	const invalidRegistrationId = !/^\d{6}-?\d{4}$/.test(process.env.VITE_BUSINESS_REGISTRATION_ID || '');
	const invalidSupportEmail = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.VITE_SUPPORT_EMAIL || '');
	const invalidVatId = process.env.VITE_VAT_STATUS === 'registered'
		&& !/^SE\d{12}$/.test(process.env.VITE_VAT_ID || '');
	const invalidCaptureDate = !/^\d{4}-\d{2}-\d{2}$/.test(process.env.VITE_BENCHMARK_CAPTURE_DATE || '')
		|| Number.isNaN(Date.parse(`${process.env.VITE_BENCHMARK_CAPTURE_DATE}T00:00:00Z`));
	const invalidAppUrl = (() => {
		try {
			return new URL(process.env.VITE_APP_URL).protocol !== 'https:';
		} catch {
			return true;
		}
	})();
	const placeholderPatterns = {
		VITE_LEGAL_NAME: /^your\s/i,
		VITE_LEGAL_ADDRESS: /^street and number/i,
		VITE_BENCHMARK_HARDWARE: /^cpu, gpu/i,
		VITE_BENCHMARK_SOFTWARE: /^windows editions/i,
		VITE_BENCHMARK_SCENARIO: /^resolution, graphics/i,
	};
	const placeholders = Object.entries(placeholderPatterns)
		.filter(([key, pattern]) => pattern.test(process.env[key] || ''))
		.map(([key]) => key);

	if (missing.length || invalidFlags.length || invalidVatStatus || invalidRunCount || invalidSummaryMethod
		|| invalidJurisdiction || invalidRegistrationId || invalidSupportEmail || invalidVatId
		|| invalidCaptureDate || invalidAppUrl || placeholders.length) {
		const problems = [
			missing.length ? `missing: ${missing.join(', ')}` : '',
			invalidFlags.length ? `must be explicitly true or false: ${invalidFlags.join(', ')}` : '',
			invalidVatStatus ? 'VITE_VAT_STATUS must be registered, not-registered, or exempt' : '',
			invalidRunCount ? 'VITE_BENCHMARK_RUN_COUNT must be at least 3' : '',
			invalidSummaryMethod ? 'VITE_BENCHMARK_SUMMARY_METHOD must be median' : '',
			invalidJurisdiction ? 'VITE_LEGAL_JURISDICTION must be Sweden for this launch configuration' : '',
			invalidRegistrationId ? 'VITE_BUSINESS_REGISTRATION_ID must be a Swedish organisation number' : '',
			invalidSupportEmail ? 'VITE_SUPPORT_EMAIL must be a valid email address' : '',
			invalidVatId ? 'VITE_VAT_ID must be a valid Swedish VAT number when VAT_STATUS is registered' : '',
			invalidCaptureDate ? 'VITE_BENCHMARK_CAPTURE_DATE must be a valid YYYY-MM-DD date' : '',
			invalidAppUrl ? 'VITE_APP_URL must be a valid HTTPS URL' : '',
			placeholders.length ? `replace example values: ${placeholders.join(', ')}` : '',
		].filter(Boolean).join('; ');
		throw new Error(`Production configuration is incomplete (${problems})`);
	}
}

console.log(isStrict
	? 'Production client configuration is complete.'
	: 'Strict production configuration validation is disabled.');
