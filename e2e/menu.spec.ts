import { expect, test } from "@playwright/test";

/**
 * Main Menu E2E Tests for OTTER: ELITE FORCE
 *
 * Tests the main menu interface:
 * - Title and branding
 * - New Campaign / Skirmish / Settings buttons
 * - Continue button appears only with saved progress
 * - Briefing screen accessible from New Campaign
 */

test.describe("Main Menu", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await page.evaluate(() => localStorage.clear());
		await page.reload();
		await page.waitForLoadState("networkidle");
	});

	test("displays game title and subtitle", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("Otter Elite Force", { timeout: 10000 });
		await expect(page.getByText("Copper-Silt Reach")).toBeVisible();
	});

	test("shows main action buttons", async ({ page }) => {
		await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
		await expect(page.getByRole("button", { name: /New Campaign/i })).toBeVisible();
		await expect(page.getByRole("button", { name: /Skirmish/i })).toBeVisible();
		await expect(page.getByRole("button", { name: /Settings/i })).toBeVisible();
	});

	test("shows build version footer", async ({ page }) => {
		await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
		await expect(page.getByText(/Build Alpha/i)).toBeVisible();
	});
});

test.describe("Settings Screen", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await page.evaluate(() => localStorage.clear());
		await page.reload();
		await page.waitForLoadState("networkidle");
		await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
	});

	test("navigates to settings and back", async ({ page }) => {
		await page.getByRole("button", { name: /Settings/i }).click();

		await expect(page.getByText("Settings")).toBeVisible({ timeout: 5000 });
		await expect(page.getByText("Master Volume")).toBeVisible();

		// Back to menu
		await page.getByRole("button", { name: /Back to Menu/i }).click();
		await expect(page.locator("h1")).toContainText("Otter Elite Force", { timeout: 5000 });
	});

	test("has audio, visual, and accessibility sections", async ({ page }) => {
		await page.getByRole("button", { name: /Settings/i }).click();
		await expect(page.getByText("Audio")).toBeVisible({ timeout: 5000 });
		await expect(page.getByText("Visual")).toBeVisible();
		await expect(page.getByText("Accessibility")).toBeVisible();
	});
});

test.describe("Briefing Screen", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await page.evaluate(() => localStorage.clear());
		await page.reload();
		await page.waitForLoadState("networkidle");
		await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
	});

	test("New Campaign opens mission briefing", async ({ page }) => {
		await page.getByRole("button", { name: /New Campaign/i }).click();

		// Briefing should show mission details
		await expect(page.getByText("Mission Briefing")).toBeVisible({ timeout: 10000 });
		await expect(page.getByText("Beachhead")).toBeVisible();
		await expect(page.getByText("FOXHOUND")).toBeVisible();
	});

	test("briefing has Deploy and Back buttons", async ({ page }) => {
		await page.getByRole("button", { name: /New Campaign/i }).click();
		await expect(page.getByText("Mission Briefing")).toBeVisible({ timeout: 10000 });

		await expect(page.getByRole("button", { name: /Deploy/i })).toBeVisible();
		await expect(page.getByRole("button", { name: /Back/i })).toBeVisible();
	});

	test("briefing shows CLASSIFIED stamp and mission code", async ({ page }) => {
		await page.getByRole("button", { name: /New Campaign/i }).click();
		await expect(page.getByText("CLASSIFIED")).toBeVisible({ timeout: 10000 });
		await expect(page.getByText("OP-BEACHHEAD")).toBeVisible();
	});
});
