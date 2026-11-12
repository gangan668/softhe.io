import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { devHeaders, previewHeaders } from "./securityHeaders.js";

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
		// Relaxed dev CSP derived from the production policy in ../vercel.json
		// (adds inline/eval for react-refresh + HMR, inline styles, ws: for HMR).
		headers: devHeaders(),
	},
	build: {
		// Keep source maps out of public production deploys.
		sourcemap: false,

		// Optimize chunk size
		chunkSizeWarningLimit: 1000,
	},
	preview: {
		// Exactly the production headers from ../vercel.json, minus HSTS and
		// upgrade-insecure-requests (both break plain http://localhost).
		headers: previewHeaders(),
	},
}));
