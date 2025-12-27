import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Vitest Configuration for OTTER: ELITE FORCE
 *
 * Optimized test setup with:
 * - happy-dom for lightweight DOM simulation
 * - V8 coverage with comprehensive reporting
 * - ESM package handling for Three.js ecosystem
 * - Separate test patterns for unit and integration tests
 */
export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		environment: "happy-dom",
		setupFiles: ["./src/test/setup.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html", "lcov"],
			exclude: [
				"node_modules/",
				"dist/",
				"src/test/",
				"src/__tests__/",
				"**/*.spec.ts",
				"**/*.test.ts",
				"**/*.test.tsx",
				"**/*.d.ts",
				"**/types/",
				"vite.config.ts",
				"vitest.config.ts",
				"playwright.config.ts",
				"e2e/",
				".github/",
			],
			all: true,
			lines: 25,
			functions: 25,
			branches: 25,
			statements: 25,
			reportsDirectory: "./coverage",
		},
		include: ["src/**/*.{test,spec}.{ts,tsx}"],
		exclude: ["node_modules", "dist", "e2e"],
		// Handle ESM packages with directory imports
		server: {
			deps: {
				inline: [
					"@react-three/fiber",
					"@react-three/drei",
					"@react-three/postprocessing",
					"three",
					"yuka",
				],
			},
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
		conditions: ["node", "default", "import"],
	},
});
