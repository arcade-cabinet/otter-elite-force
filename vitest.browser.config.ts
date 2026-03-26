import path from "node:path";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

/**
 * Vitest Browser Configuration — runs integration tests in real Chromium.
 * Phaser requires Canvas/WebGL so happy-dom is insufficient for scene tests.
 *
 * Usage: pnpm test:browser
 */
export default defineConfig({
	test: {
		include: ["src/__tests__/browser/**/*.test.ts"],
		browser: {
			enabled: true,
			provider: playwright(),
			instances: [{ browser: "chromium" }],
			headless: true,
		},
		// Longer timeout for browser tests — Phaser boot + scene transitions take time
		testTimeout: 120000, // Governor playtests can run long
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
