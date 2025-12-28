import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
	plugins: [
		react(),
		// Generate bundle visualization in analyze mode
		mode === "analyze" &&
			visualizer({
				filename: "./dist/stats.html",
				open: true,
				gzipSize: true,
				brotliSize: true,
			}),
	].filter(Boolean),
	base: "./",
	build: {
		outDir: "dist",
		assetsDir: "assets",
		sourcemap: true,
		rollupOptions: {
			output: {
				manualChunks: {
					// Split vendor chunks for better caching
					react: ["react", "react-dom"],
					three: ["three", "@react-three/fiber", "@react-three/drei"],
					audio: ["tone"],
					ai: ["yuka"],
				},
			},
		},
	},
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: "./src/test/setup.ts",
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: ["node_modules/", "src/test/"],
		},
	},
}));
