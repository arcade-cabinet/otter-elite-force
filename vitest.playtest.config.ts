import path from "node:path";
import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

/**
 * Vitest config specifically for running governor playtest (slow tests).
 * Usage: npx vitest run --config vitest.playtest.config.ts
 */
export default defineConfig({
	plugins: [
		solid({
			extensions: [".tsx"],
		}),
	],
	test: {
		globals: true,
		environment: "happy-dom",
		fileParallelism: false,
		setupFiles: ["./src/test/setup.ts"],
		include: ["src/engine/playtester/allMissions.test.ts"],
		exclude: ["node_modules", "dist"],
		testTimeout: 300000,
		reporters: ["verbose"],
		printConsoleTrace: true,
		server: {
			deps: {
				inline: ["yuka"],
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
