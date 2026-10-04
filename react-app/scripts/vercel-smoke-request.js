import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execute = promisify(execFile);

export const parseCurlResponse = (raw) => {
	let remaining = raw;
	while (remaining.startsWith('HTTP/')) {
		const boundary = remaining.indexOf('\r\n\r\n');
		if (boundary < 0) throw new Error('Malformed authenticated HTTP response');
		const lines = remaining.slice(0, boundary).split('\r\n');
		const status = Number(lines.shift().match(/^HTTP\/\S+\s+(\d{3})\b/)?.[1]);
		if (!status) throw new Error('Missing authenticated HTTP status');
		remaining = remaining.slice(boundary + 4);
		if (status < 200) continue;
		const headers = new Headers();
		for (const line of lines) {
			const separator = line.indexOf(':');
			if (separator > 0) headers.append(line.slice(0, separator), line.slice(separator + 1).trim());
		}
		return { response: { status, ok: status >= 200 && status < 300, headers }, text: remaining };
	}
	throw new Error('Missing authenticated HTTP response');
};

export const requestVercel = async (origin, path) => {
	const url = new URL(origin);
	if (url.protocol !== 'https:' || !url.hostname.endsWith('.vercel.app') || url.origin !== origin) {
		throw new Error('Authenticated smoke requires an immutable HTTPS Vercel deployment origin');
	}
	const { stdout } = await execute('npx', [
		'--yes', 'vercel@59.3.0', 'curl', path, '--deployment', origin, '--',
		'--silent', '--show-error', '--include', '--max-time', '30',
	], { timeout: 60000, maxBuffer: 4 * 1024 * 1024 });
	return parseCurlResponse(stdout);
};
