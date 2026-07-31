import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

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
		headers: {
			// Content Security Policy (relaxed for dev - no upgrade-insecure-requests)
			"Content-Security-Policy": [
				"default-src 'self' 'unsafe-inline' 'unsafe-eval'",
				"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://buy.stripe.com https://js.stripe.com",
				"style-src 'self' 'unsafe-inline'",
				"font-src 'self'",
				"img-src 'self' data: https: http: blob:",
				"connect-src 'self' ws: wss: http: https: https://buy.stripe.com https://api.stripe.com https://*.google-analytics.com",
				"frame-src 'self' https://buy.stripe.com https://js.stripe.com",
				"object-src 'none'",
				"base-uri 'self'",
				"form-action 'self' https://buy.stripe.com",
			].join("; "),

			// Prevent clickjacking
			"X-Frame-Options": "DENY",

			// Prevent MIME type sniffing
			"X-Content-Type-Options": "nosniff",

			// Enable XSS protection
			"X-XSS-Protection": "1; mode=block",

			// Referrer Policy
			"Referrer-Policy": "strict-origin-when-cross-origin",

			// Permissions Policy (formerly Feature Policy)
			"Permissions-Policy": [
				"camera=()",
				"microphone=()",
				"geolocation=()",
				'payment=(self "https://buy.stripe.com")',
				"usb=()",
				"magnetometer=()",
				"accelerometer=()",
				"gyroscope=()",
			].join(", "),
		},
	},
	build: {
		// Keep source maps out of public production deploys.
		sourcemap: false,

		// Optimize chunk size
		chunkSizeWarningLimit: 1000,
	},
	preview: {
		headers: {
			// Apply same security headers for preview (relaxed for local testing)
			"Content-Security-Policy": [
				"default-src 'self' 'unsafe-inline'",
				"script-src 'self' 'unsafe-inline' https://buy.stripe.com https://js.stripe.com https://cdn.jsdelivr.net https://www.googletagmanager.com",
				"style-src 'self' 'unsafe-inline'",
				"font-src 'self'",
				"img-src 'self' data: https: http: blob:",
				"connect-src 'self' http: https: https://buy.stripe.com https://api.stripe.com https://*.google-analytics.com https://api.emailjs.com",
				"frame-src 'self' https://buy.stripe.com https://js.stripe.com",
				"object-src 'none'",
				"base-uri 'self'",
				"form-action 'self' https://buy.stripe.com",
			].join("; "),
			"X-Frame-Options": "DENY",
			"X-Content-Type-Options": "nosniff",
			"X-XSS-Protection": "1; mode=block",
			"Referrer-Policy": "strict-origin-when-cross-origin",
			"Permissions-Policy": [
				"camera=()",
				"microphone=()",
				"geolocation=()",
				'payment=(self "https://buy.stripe.com")',
				"usb=()",
				"magnetometer=()",
				"accelerometer=()",
				"gyroscope=()",
			].join(", "),
		},
	},
}));
