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
		await expect(page.locator("h1")).toContainText("Otter Elite Force", { timeout: 10000 });
	});

	test("app renders without critical console errors", async ({ page }) => {
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
			(e) =>
				!e.includes("favicon") &&
				!e.includes("manifest") &&
				!e.includes("WebGL") &&
				!e.includes("net::ERR"),
		);

		expect(criticalErrors).toHaveLength(0);
	});

	test("app has root element", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#root")).toBeVisible();
	});

	test("main menu buttons are visible", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });

		await expect(page.getByRole("button", { name: /New Campaign/i })).toBeVisible();
		await expect(page.getByRole("button", { name: /Skirmish/i })).toBeVisible();
		await expect(page.getByRole("button", { name: /Settings/i })).toBeVisible();
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

	test("game loads with canvas after deploying mission", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });

		// New Campaign -> Briefing -> Deploy
		await page.getByRole("button", { name: /New Campaign/i }).click();
		await expect(page.getByText("FOXHOUND").first()).toBeVisible({ timeout: 10000 });
		await page.getByRole("button", { name: /Deploy/i }).click();
		await page.waitForTimeout(3000);

		// LittleJS creates a canvas
		const canvasCount = await page.locator("canvas").count();
		expect(canvasCount).toBeGreaterThanOrEqual(1);
	});
});
