import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
	plugins: [react(), tailwindcss()],
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
					// Heavy game dependencies — loaded lazily via dynamic import
					phaser: ["phaser"],
					tone: ["tone"],
					// Lighter deps — loaded with the initial bundle or game chunk
					yuka: ["yuka"],
					koota: ["koota"],
				},
			},
		},
		// US-089: Report gzip sizes for audit
		reportCompressedSize: true,
	},
}));
