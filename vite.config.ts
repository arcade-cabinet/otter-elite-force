/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		visualizer({
			filename: "dist/stats.html",
			gzipSize: true,
			brotliSize: true,
		}),
	],
	base: "./",
	resolve: {
		alias: {
			"@": "/src",
			"@core": "/src/core",
			"@entities": "/src/entities",
			"@scenes": "/src/scenes",
			"@ui": "/src/ui",
			"@stores": "/src/stores",
			"@utils": "/src/utils",
		},
	},
	build: {
		outDir: "dist",
		assetsDir: "assets",
		sourcemap: true,
		rollupOptions: {
			output: {
				manualChunks: {
					"react-vendor": ["react", "react-dom"],
					"three-vendor": ["three", "@react-three/fiber", "@react-three/drei"],
					"audio-vendor": ["tone"],
					"ai-vendor": ["yuka"],
					"animation-vendor": ["gsap"],
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
			exclude: ["node_modules/", "src/test/", "e2e/"],
		},
		exclude: ["node_modules/", "e2e/"],
	},
});
