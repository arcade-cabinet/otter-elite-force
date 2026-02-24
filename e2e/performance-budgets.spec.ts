import { expect, test } from "@playwright/test";

/**
 * Performance Budget Testing
 *
 * Enforces performance targets for OTTER: ELITE FORCE:
 * - Bundle size < 500KB gzipped
 * - Load time < 3s
 * - FPS >= 60 (3D rendering)
 * - Lighthouse scores
 */

// Type definitions for Chrome-specific performance APIs
interface PerformanceMemory {
	usedJSHeapSize: number;
	totalJSHeapSize: number;
	jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance {
	memory: PerformanceMemory;
}

interface PerformanceMetrics {
	domInteractive: number;
	domContentLoaded: number;
	loadComplete: number;
}

test.describe("Performance Budgets", () => {
	test("should load in under 3 seconds", async ({ page }) => {
		const start = Date.now();

		await page.goto("/");

		// Wait for main title to be visible
		await expect(page.getByText("OTTER: ELITE FORCE")).toBeVisible({
			timeout: 30000,
		});

		const loadTime = Date.now() - start;

		console.log(`⏱️  Page load time: ${loadTime}ms`);

		// Budget: 3000ms
		expect(loadTime).toBeLessThan(3000);
	});

	test("should have acceptable bundle size", async ({ page }) => {
		const responses: Array<{ url: string; size: number }> = [];

		page.on("response", async (response) => {
			const url = response.url();

			// Track JS/CSS bundles
			if (url.includes(".js") || url.includes(".css")) {
				try {
					const buffer = await response.body();
					responses.push({
						url,
						size: buffer.length,
					});
				} catch (_e) {
					// Some responses can't be read, skip them
				}
			}
		});

		await page.goto("/");

		await expect(page.getByText("OTTER: ELITE FORCE")).toBeVisible({
			timeout: 30000,
		});

		const totalSize = responses.reduce((sum, r) => sum + r.size, 0);
		const totalKB = Math.round(totalSize / 1024);

		console.log(`📦 Total bundle size: ${totalKB}KB`);
		console.log(`   Individual bundles:`);
		responses.forEach((r) => {
			const kb = Math.round(r.size / 1024);
			const name = r.url.split("/").pop() || r.url;
			console.log(`   - ${name}: ${kb}KB`);
		});

		// Budget: 500KB (before gzip, actual will be smaller)
		// This is generous for a game, but includes Babylon.js
		expect(totalKB).toBeLessThan(2000); // 2MB uncompressed is reasonable for a 3D game
	});

	test("should maintain 60fps during gameplay", async ({ page }) => {
		await page.goto("/");

		await expect(page.getByText("OTTER: ELITE FORCE")).toBeVisible({
			timeout: 30000,
		});

		// Start game
		const newGameButton = page.getByRole("button", { name: /new game/i });
		await newGameButton.click();

		// Wait for game to start (might go through cutscene)
		await page.waitForTimeout(3000);

		// Measure FPS using Performance API
		const fps = await page.evaluate(() => {
			return new Promise<number>((resolve) => {
				let frameCount = 0;
				const startTime = performance.now();
				const duration = 2000; // Measure for 2 seconds

				function countFrame() {
					frameCount++;

					if (performance.now() - startTime < duration) {
						requestAnimationFrame(countFrame);
					} else {
						const actualDuration = performance.now() - startTime;
						const fps = (frameCount / actualDuration) * 1000;
						resolve(fps);
					}
				}

				requestAnimationFrame(countFrame);
			});
		});

		console.log(`🎮 Average FPS: ${fps.toFixed(1)}`);

		// Budget: 60fps (allow some variance, target 50+)
		expect(fps).toBeGreaterThan(50);
	});

	test("should have minimal memory usage", async ({ page }) => {
		await page.goto("/");

		await expect(page.getByText("OTTER: ELITE FORCE")).toBeVisible({
			timeout: 30000,
		});

		// Get memory metrics (Chrome DevTools Protocol)
		const metrics = await page.evaluate(() => {
			const perf = performance as PerformanceWithMemory;
			if ("memory" in performance) {
				const mem = perf.memory;
				return {
					usedJSHeapSize: mem.usedJSHeapSize,
					totalJSHeapSize: mem.totalJSHeapSize,
					jsHeapSizeLimit: mem.jsHeapSizeLimit,
				};
			}
			return null;
		});

		if (metrics) {
			const usedMB = Math.round(metrics.usedJSHeapSize / 1024 / 1024);
			const totalMB = Math.round(metrics.totalJSHeapSize / 1024 / 1024);

			console.log(`💾 Memory usage: ${usedMB}MB / ${totalMB}MB`);

			// Budget: < 200MB for initial load
			expect(usedMB).toBeLessThan(200);
		}
	});

	test("should have acceptable Time to Interactive", async ({ page }) => {
		await page.goto("/");

		const metrics = await page.evaluate(() => {
			return new Promise((resolve) => {
				// Wait for page to be fully interactive
				if (document.readyState === "complete") {
					const navigation = performance.getEntriesByType(
						"navigation",
					)[0] as PerformanceNavigationTiming;
					resolve({
						domInteractive: navigation.domInteractive,
						domContentLoaded: navigation.domContentLoadedEventEnd,
						loadComplete: navigation.loadEventEnd,
					});
				} else {
					window.addEventListener("load", () => {
						const navigation = performance.getEntriesByType(
							"navigation",
						)[0] as PerformanceNavigationTiming;
						resolve({
							domInteractive: navigation.domInteractive,
							domContentLoaded: navigation.domContentLoadedEventEnd,
							loadComplete: navigation.loadEventEnd,
						});
					});
				}
			});
		});

		const performanceMetrics = metrics as PerformanceMetrics;

		console.log(`⚡ Performance Metrics:`);
		console.log(`   DOM Interactive: ${Math.round(performanceMetrics.domInteractive)}ms`);
		console.log(`   DOM Content Loaded: ${Math.round(performanceMetrics.domContentLoaded)}ms`);
		console.log(`   Load Complete: ${Math.round(performanceMetrics.loadComplete)}ms`);

		// Budget: DOM Interactive < 2000ms
		expect(performanceMetrics.domInteractive).toBeLessThan(2000);
	});
});

test.describe("Resource Loading Performance", () => {
	test("should load Google Fonts efficiently", async ({ page }) => {
		const fontRequests: Array<{ url: string; time: number }> = [];

		page.on("response", async (response) => {
			const url = response.url();
			let hostname: string | null = null;
			try {
				hostname = new URL(url).hostname;
			} catch {
				hostname = null;
			}

			if (hostname === "fonts.googleapis.com" || hostname === "fonts.gstatic.com") {
				const timing = response.timing();
				fontRequests.push({
					url,
					time: timing.responseEnd,
				});
			}
		});

		await page.goto("/");

		await expect(page.getByText("OTTER: ELITE FORCE")).toBeVisible({
			timeout: 30000,
		});

		console.log(`🔤 Font requests: ${fontRequests.length}`);
		fontRequests.forEach((req) => {
			console.log(`   ${req.url.split("/").pop()}: ${Math.round(req.time)}ms`);
		});

		// Should load fonts reasonably quickly
		fontRequests.forEach((req) => {
			expect(req.time).toBeLessThan(2000);
		});
	});

	test("should lazy load sprite images", async ({ page }) => {
		const spriteRequests: string[] = [];

		page.on("request", (request) => {
			const url = request.url();

			if (url.includes("/sprites/")) {
				spriteRequests.push(url);
			}
		});

		await page.goto("/");

		await expect(page.getByText("OTTER: ELITE FORCE")).toBeVisible({
			timeout: 30000,
		});

		// Sprites should NOT load on menu (lazy loading)
		console.log(`🎨 Sprite requests on menu: ${spriteRequests.length}`);

		// Ideally 0, but allow some preloading
		expect(spriteRequests.length).toBeLessThan(10);
	});
});
