import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";

// Local servers reuse the production headers from vercel.json so policy drift shows up locally.
const productionHeaders = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"))
	.headers.find((rule) => rule.source === "/(.*)").headers;

function localHeaders({ dev }) {
	const headers = Object.fromEntries(productionHeaders.map(({ key, value }) => [key, value]));
	const directives = headers["Content-Security-Policy"]
		.split(";")
		.map((directive) => directive.trim())
		// localhost is served over plain HTTP.
		.filter((directive) => directive && directive !== "upgrade-insecure-requests");
	// Only the isolated portal browser suite may connect to its mocked provider.
	if (!dev && process.env.SOFTHE_E2E_MODE === "portal") {
		const index = directives.findIndex((directive) => directive.startsWith("connect-src "));
		directives[index] += " https://portal-fixture.supabase.co";
	}
	if (dev) {
		// The Vite dev server injects the React refresh preamble and CSS inline, and uses a websocket for HMR.
		const additions = { "script-src": "'unsafe-inline'", "style-src": "'unsafe-inline'", "connect-src": "ws: wss:" };
		for (const [name, extra] of Object.entries(additions)) {
			const index = directives.findIndex((directive) => directive.startsWith(`${name} `));
			directives[index] = `${directives[index]} ${extra}`;
		}
	}
	headers["Content-Security-Policy"] = directives.join("; ");
	return headers;
}

// https://vite.dev/config/
export default defineConfig(() => ({
	// The custom domain is served from the deployment root.
	base: '/',
	plugins: [react()],
	resolve: {
		alias: {
			"react-router-dom": fileURLToPath(new URL("./src/lib/router.jsx", import.meta.url)),
		},
	},
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: "./src/test/setup.js",
		css: true,
		testTimeout: 10000,
		exclude: ["node_modules/", "dist/", "e2e/**"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			thresholds: {
				statements: 80,
				branches: 80,
				functions: 80,
				lines: 80,
			},
			exclude: [
				"node_modules/",
				"src/test/",
				"**/*.config.js",
				"**/dist/**",
			],
		},
	},
	server: {
		headers: localHeaders({ dev: true }),
	},
	build: {
		manifest: true,
		// Keep source maps out of public production deploys.
		sourcemap: false,

		// Optimize chunk size
		chunkSizeWarningLimit: 1000,
	},
	preview: {
		headers: localHeaders({ dev: false }),
	},
}));
