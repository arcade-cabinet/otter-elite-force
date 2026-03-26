import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ mode: _mode }) => ({
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
				manualChunks(id) {
					if (id.includes("node_modules/tone")) return "tone";
					if (id.includes("node_modules/yuka")) return "yuka";
					if (id.includes("node_modules/koota")) return "koota";
					if (id.includes("node_modules/konva") || id.includes("node_modules/react-konva"))
						return "konva";
				},
			},
		},
		// US-089: Report gzip sizes for audit
		reportCompressedSize: true,
	},
}));
