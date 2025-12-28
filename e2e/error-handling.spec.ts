import { expect, test } from "@playwright/test";
import { waitForStable } from "./helpers";

/**
 * E2E Tests: Error Handling and Edge Cases
 *
 * Tests for application resilience:
 * - Missing save data handling
 * - Corrupted save data handling
 * - Console error detection
 */

test.describe("Error Handling and Edge Cases", () => {
	test("app handles missing save data gracefully", async ({ page }) => {
		await page.goto("/");

		// Clear any existing save data
		await page.evaluate(() => localStorage.removeItem("otter_v8"));
		await page.reload();
		await waitForStable(page);

		// App should load without errors
		await expect(page.locator("#root")).toBeVisible();
		await expect(page.getByRole("heading", { name: /OTTER/i })).toBeVisible();
	});

	test("app handles corrupted save data", async ({ page }) => {
		await page.goto("/");

		// Inject corrupted data
		await page.evaluate(() => {
			localStorage.setItem("otter_v8", "{ invalid json }}}");
		});

		// Reload - app should handle this gracefully
		await page.reload();
		await waitForStable(page);

		// App should still function (may reset to defaults)
		await expect(page.locator("#root")).toBeVisible();
	});

	test("no console errors on normal gameplay flow", async ({ page }) => {
		const consoleErrors: string[] = [];

		page.on("console", (msg) => {
			if (msg.type() === "error") {
				consoleErrors.push(msg.text());
			}
		});

		await page.goto("/");
		await waitForStable(page);

		// Navigate through screens
		await page.locator('button:has-text("VISIT CANTEEN")').click();
		await waitForStable(page);

		await page.locator('button:has-text("RETURN TO PERIMETER")').click();
		await waitForStable(page);

		// Filter out expected/non-critical errors
		const criticalErrors = consoleErrors.filter(
			(e) =>
				!e.includes("favicon") &&
				!e.includes("manifest") &&
				!e.includes("WebGL") &&
				!e.includes("THREE.WebGLRenderer"),
		);

		expect(criticalErrors).toHaveLength(0);
	});
});
