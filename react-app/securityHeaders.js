// Security headers shared by `vite preview` and `vite dev`.
//
// The root `vercel.json` is the single source of truth: production headers are
// read from its catch-all `/(.*)` entry, so local preview and the Playwright
// e2e suite (which runs against `vite preview`) exercise the real policy.
import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

// Resolved lazily: under vitest's jsdom environment import.meta.url is not a
// file: URL, so tests pass the parsed production headers in explicitly.
const vercelConfigPath = () => fileURLToPath(new URL("../vercel.json", import.meta.url));
const CSP = "Content-Security-Policy";

export const parseCsp = (policy) => new Map(
	policy.split(";")
		.map((directive) => directive.trim())
		.filter(Boolean)
		.map((directive) => {
			const [name, ...sources] = directive.split(/\s+/);
			return [name.toLowerCase(), sources];
		}),
);

export const serializeCsp = (directives) => [...directives]
	.map(([name, sources]) => [name, ...sources].join(" "))
	.join("; ");

export const readProductionHeaders = (configPath = vercelConfigPath()) => {
	const config = JSON.parse(readFileSync(configPath, "utf8"));
	const entry = (config.headers || []).find(({ source }) => source === "/(.*)");
	if (!entry) throw new Error(`No "/(.*)" headers entry in ${configPath}`);
	return Object.fromEntries(entry.headers.map(({ key, value }) => [key, value]));
};

const withCsp = (headers, edit) => {
	const csp = parseCsp(headers[CSP]);
	edit(csp);
	return { ...headers, [CSP]: serializeCsp(csp) };
};

const addSources = (csp, name, sources) => {
	const current = csp.get(name) || csp.get("default-src") || [];
	csp.set(name, [...current, ...sources.filter((source) => !current.includes(source))]);
};

// Production headers, minus what cannot work over plain http://localhost:
// - `upgrade-insecure-requests` would rewrite same-origin subresource requests
//   to https://localhost, which the preview server does not serve.
// - HSTS is ignored over http, and if ever honoured would pin localhost to https.
// `connectSrc` lets an isolated browser suite reach its intercepted fixture provider.
export const previewHeaders = (production = readProductionHeaders(), { connectSrc = [] } = {}) => {
	const { "Strict-Transport-Security": _hsts, ...headers } = production;
	return withCsp(headers, (csp) => {
		csp.delete("upgrade-insecure-requests");
		if (connectSrc.length) addSources(csp, "connect-src", connectSrc);
	});
};

// `vite dev` needs inline/eval scripts (react-refresh preamble, HMR client),
// inline styles (CSS injected via <style>), and a WebSocket for HMR. Everything
// else stays as strict as production. There are no /api functions under
// `vite dev`, so CSP reporting is dropped rather than POSTing into a 404.
export const devHeaders = (production = readProductionHeaders()) => {
	const { "Reporting-Endpoints": _reporting, ...headers } = previewHeaders(production);
	return withCsp(headers, (csp) => {
		addSources(csp, "script-src", ["'unsafe-inline'", "'unsafe-eval'"]);
		addSources(csp, "style-src", ["'unsafe-inline'"]);
		addSources(csp, "connect-src", ["ws:", "wss:"]);
		csp.delete("report-uri");
		csp.delete("report-to");
	});
};
