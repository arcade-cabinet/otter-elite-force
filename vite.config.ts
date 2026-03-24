import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
	base: "./",
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
		},
	},
	build: {
		outDir: "dist",
		assetsDir: "assets",
		sourcemap: true,
		rollupOptions: {
			output: {
				manualChunks: {
					phaser: ["phaser"],
					tone: ["tone"],
					yuka: ["yuka"],
					koota: ["koota"],
				},
			},
		},
	},
});
