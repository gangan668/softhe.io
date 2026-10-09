import { spawnSync } from 'node:child_process';
import process from 'node:process';

const mode = process.argv[2];
if (!['enabled', 'disabled', 'portal'].includes(mode)) {
	throw new Error('Usage: node scripts/run-e2e.js <enabled|disabled|portal>');
}

const featureEnabled = mode === 'enabled' ? 'true' : 'false';
const environment = {
	...process.env,
	VITE_APP_URL: 'https://softhe.io',
	VITE_PUBLIC_ORIGIN: 'https://softhe.io',
	VITE_REQUIRE_PRODUCTION_CONFIG: 'true',
	VITE_LEGAL_NAME: 'Softhe E2E Test Operator',
	VITE_LEGAL_ADDRESS: 'Testgatan 1, 111 11 Stockholm, Sweden',
	VITE_BUSINESS_REGISTRATION_ID: '000000-0000',
	VITE_LEGAL_JURISDICTION: 'Sweden',
	VITE_VAT_STATUS: 'not-registered',
	VITE_SUPPORT_EMAIL: 'suport.softhe@gmail.com',
	VITE_BENCHMARK_HARDWARE: 'E2E benchmark fixture hardware',
	VITE_BENCHMARK_SOFTWARE: 'E2E BIOS, drivers, and Windows fixture',
	VITE_BENCHMARK_SCENARIO: 'E2E game settings and repeated capture procedure',
	VITE_BENCHMARK_CAPTURE_DATE: '2026-07-20',
	VITE_BENCHMARK_RUN_COUNT: '2',
	VITE_BENCHMARK_SUMMARY_METHOD: 'median',
	VITE_COMMERCE_ENABLED: featureEnabled,
	COMMERCE_ENABLED: featureEnabled,
	VITE_CONTACT_FORM_ENABLED: featureEnabled,
	STRIPE_SECRET_KEY: 'sk_test_e2e_fixture_only',
	STRIPE_WEBHOOK_SECRET: 'whsec_e2e_fixture_only',
	PUBLIC_SITE_URL: 'https://softhe.io',
	// Browser fixtures must never inherit a developer's live provider settings.
	VITE_SUPABASE_URL: mode === 'portal' ? 'https://portal-fixture.supabase.co' : '',
	VITE_SUPABASE_PUBLISHABLE_KEY: mode === 'portal' ? 'sb_publishable_e2e_fixture_only' : '',
	VITE_CAPTCHA_ENABLED: 'false',
	VITE_TURNSTILE_SITE_KEY: '',
};

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run this script through npm so npm_execpath is available');
const testFiles = mode === 'portal' ? ['e2e/portal.spec.js', 'e2e/metadata.spec.js', 'e2e/analytics.spec.js']
	: [mode === 'enabled' ? 'e2e/smoke.spec.js' : 'e2e/disabled.spec.js', 'e2e/metadata.spec.js', 'e2e/analytics.spec.js'];

const run = (command, args) => {
	const result = spawnSync(command, args, {
		env: environment,
		stdio: 'inherit',
	});
	if (result.error) throw result.error;
	if (result.status !== 0) process.exit(result.status ?? 1);
};

run(process.execPath, [npmCli, 'run', 'build']);
run(process.execPath, [npmCli, 'exec', '--', 'playwright', 'test', ...testFiles]);
