import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
	// Set base path for GitHub Pages deployment
	// In development: use '/' for local dev server
	// In production: use '/softhe.io/' for GitHub Pages (username.github.io/softhe.io)
	// Change to '/' in production if using a custom domain
	base: mode === 'production' ? '/softhe.io/' : '/',
	plugins: [react()],
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: "./src/test/setup.js",
		css: true,
		testTimeout: 10000,
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
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
				"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
				"font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
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
		// Enable source maps for production debugging
		sourcemap: true,

		// Optimize chunk size
		chunkSizeWarningLimit: 1000,

		rollupOptions: {
			output: {
				manualChunks: {
					"react-vendor": ["react", "react-dom"],
					"router-vendor": ["react-router-dom"],
				},
			},
		},
	},
	preview: {
		headers: {
			// Apply same security headers for preview (relaxed for local testing)
			"Content-Security-Policy": [
				"default-src 'self' 'unsafe-inline'",
				"script-src 'self' 'unsafe-inline' https://buy.stripe.com https://js.stripe.com",
				"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
				"font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
				"img-src 'self' data: https: http: blob:",
				"connect-src 'self' http: https: https://buy.stripe.com https://api.stripe.com https://*.google-analytics.com",
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
