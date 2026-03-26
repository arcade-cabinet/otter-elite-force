import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import solid from "vite-plugin-solid";
import { defineConfig } from "vite";

export default defineConfig(({ mode: _mode }) => ({
	plugins: [
		solid({
			extensions: [".tsx", ".ts"],
		}),
		tailwindcss(),
	],
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
				manualChunks(id) {
					if (id.includes("node_modules/tone")) return "tone";
					if (id.includes("node_modules/yuka")) return "yuka";
					if (id.includes("node_modules/koota")) return "koota";
				},
			},
		},
		// US-089: Report gzip sizes for audit
		reportCompressedSize: true,
	},
}));
