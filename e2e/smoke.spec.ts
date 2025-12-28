import { expect, test } from "@playwright/test";

/**
 * Smoke Tests for OTTER: ELITE FORCE
 *
 * Quick health check tests that verify core functionality works.
 * These should run fast and catch major regressions.
 */

test.describe("Smoke Tests", () => {
	test("app loads and displays title", async ({ page }) => {
		await page.goto("/");
		await expect(page.getByRole("heading", { name: /OTTER/i })).toBeVisible();
	});

	test("app renders without console errors", async ({ page }) => {
		const errors: string[] = [];

		page.on("console", (msg) => {
			if (msg.type() === "error") {
				errors.push(msg.text());
			}
		});

		await page.goto("/");
		await page.waitForTimeout(2000);

		// Filter out known non-critical errors
		const criticalErrors = errors.filter(
			(e) => !e.includes("favicon") && !e.includes("manifest") && !e.includes("WebGL"),
		);

		expect(criticalErrors).toHaveLength(0);
	});

	test("app has root element", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#root")).toBeVisible();
	});

	test("navigation works", async ({ page }) => {
		await page.goto("/");
		await page.waitForTimeout(1000);

		// Can navigate to canteen
		const canteenBtn = page.locator('button:has-text("VISIT CANTEEN")');
		if (await canteenBtn.isVisible()) {
			await canteenBtn.click();
			await page.waitForTimeout(500);

			// Verify we navigated
			await expect(page.locator("text=FORWARD OPERATING BASE")).toBeVisible();
		}
	});

	test("localStorage is accessible", async ({ page }) => {
		await page.goto("/");

		const works = await page.evaluate(() => {
			try {
				localStorage.setItem("test", "value");
				const result = localStorage.getItem("test") === "value";
				localStorage.removeItem("test");
				return result;
			} catch {
				return false;
			}
		});

		expect(works).toBe(true);
	});

	test("canvas element exists for 3D scene", async ({ page }) => {
		await page.goto("/");
		await page.waitForTimeout(1000);

		// Start the campaign to trigger 3D scene rendering (cutscene has a canvas)
		// Use NEW GAME for fresh start (no save data)
		const newGameBtn = page.locator('button:has-text("NEW GAME")');
		if (await newGameBtn.isVisible()) {
			await newGameBtn.click();
		}
		await page.waitForTimeout(2000);

		// Should have at least one canvas for Three.js (cutscene or game scene)
		const canvasCount = await page.locator("canvas").count();
		expect(canvasCount).toBeGreaterThanOrEqual(1);
	});
});
