import { describe, expect, it } from 'vitest';
import { validateAuditReport } from './audit-policy';

const approvedReport = () => ({
	vulnerabilities: {
		'react-router': {
			severity: 'high',
			via: [{
				url: 'https://github.com/advisories/GHSA-qwww-vcr4-c8h2',
			}],
		},
		'react-router-dom': {
			severity: 'high',
			via: ['react-router'],
		},
	},
	metadata: {
		vulnerabilities: {
			info: 0,
			low: 0,
			moderate: 0,
			high: 2,
			critical: 0,
			total: 2,
		},
	},
});

describe('audit policy', () => {
	it('allows only the pinned RSC advisory', () => {
		expect(validateAuditReport(approvedReport(), '7.18.1')).toEqual({
			advisory: 'https://github.com/advisories/GHSA-qwww-vcr4-c8h2',
			version: '7.18.1',
		});
	});

	it('rejects any additional vulnerable package', () => {
		const report = approvedReport();
		report.vulnerabilities.minimatch = { severity: 'high', via: [] };
		report.metadata.vulnerabilities.high = 3;
		report.metadata.vulnerabilities.total = 3;
		expect(() => validateAuditReport(report, '7.18.1')).toThrow('Unexpected audit findings');
	});

	it('rejects an advisory change', () => {
		const report = approvedReport();
		report.vulnerabilities['react-router'].via[0].url = 'https://github.com/advisories/another';
		expect(() => validateAuditReport(report, '7.18.1')).toThrow('do not match the approved exception');
	});

	it('rejects a router version change', () => {
		expect(() => validateAuditReport(approvedReport(), '7.18.2')).toThrow(
			'audit exception requires react-router-dom 7.18.1',
		);
	});

	it('forces review when npm reports a clean tree', () => {
		expect(() => validateAuditReport({
			vulnerabilities: {},
			metadata: { vulnerabilities: { high: 0, critical: 0, total: 0 } },
		}, '7.18.1')).toThrow('Unexpected audit findings: none');
	});
});
