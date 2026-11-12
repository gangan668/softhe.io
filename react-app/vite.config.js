import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";
import { devHeaders, previewHeaders } from "./securityHeaders.js";

// Local servers reuse the production headers from ../vercel.json (see securityHeaders.js) so policy drift shows up locally.
// Only the isolated portal browser suite may connect to its mocked provider.
const fixtureConnectSrc = process.env.SOFTHE_E2E_MODE === "portal" ? ["https://portal-fixture.supabase.co"] : [];

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
		// Production policy plus inline/eval scripts, inline styles and ws: for HMR; no reporting.
		headers: devHeaders(),
	},
	build: {
		manifest: true,
		// Keep source maps out of public production deploys.
		sourcemap: false,

		// Optimize chunk size
		chunkSizeWarningLimit: 1000,
	},
	preview: {
		// Production headers minus HSTS and upgrade-insecure-requests, which break http://localhost.
		headers: previewHeaders(undefined, { connectSrc: fixtureConnectSrc }),
	},
}));
