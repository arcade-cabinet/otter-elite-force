import { expect, test } from "@playwright/test";

/**
 * Main Menu E2E Tests for OTTER: ELITE FORCE
 *
 * Tests the main menu interface:
 * - Title and branding
 * - New Game / Continue / Skirmish / Settings buttons
 * - Difficulty selection (Support / Tactical / Elite)
 * - Campaign view with 16 missions across 4 chapters
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

	test("shows four main action buttons", async ({ page }) => {
		await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
		await expect(page.getByRole("button", { name: /New Game/i })).toBeVisible();
		await expect(page.getByRole("button", { name: /Continue/i })).toBeVisible();
		await expect(page.getByRole("button", { name: /Skirmish/i })).toBeVisible();
		await expect(page.getByRole("button", { name: /Settings/i })).toBeVisible();
	});

	test("shows faction matchup cards", async ({ page }) => {
		await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
		// Faction names (appear as large headings in the cards)
		await expect(page.getByText("Scale-Guard")).toBeVisible();
		// The title and faction card both say "Otter Elite Force"
		const oefCount = await page.getByText("Otter Elite Force").count();
		expect(oefCount).toBeGreaterThanOrEqual(2); // title + faction card
	});

	test("shows mission progress counter", async ({ page }) => {
		await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
		await expect(page.getByText(/\d+ \/ 16 missions completed/i)).toBeVisible();
	});
});

test.describe("Difficulty Selection", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await page.evaluate(() => localStorage.clear());
		await page.reload();
		await page.waitForLoadState("networkidle");
		await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
	});

	test("New Game expands three difficulty options", async ({ page }) => {
		await page.getByRole("button", { name: /New Game/i }).click();
		await expect(page.getByRole("button", { name: /Support/i })).toBeVisible({ timeout: 5000 });
		await expect(page.getByRole("button", { name: /Tactical/i })).toBeVisible();
		await expect(page.getByRole("button", { name: /Elite/i })).toBeVisible();
	});

	test("difficulty descriptions explain modifiers", async ({ page }) => {
		await page.getByRole("button", { name: /New Game/i }).click();
		await expect(page.getByText(/0\.75x enemy damage/i)).toBeVisible({ timeout: 5000 });
		await expect(page.getByText(/1\.25x resources/i)).toBeVisible();
	});
});

test.describe("Campaign View", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await page.evaluate(() => localStorage.clear());
		await page.reload();
		await page.waitForLoadState("networkidle");
		await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
		// Navigate to campaign
		await page.getByRole("button", { name: /New Game/i }).click();
		await page.getByRole("button", { name: /Support/i }).click({ timeout: 5000 });
	});

	test("shows all 4 chapters", async ({ page }) => {
		await expect(page.getByText("Chapter 1")).toBeVisible({ timeout: 10000 });
		await expect(page.getByText("Chapter 2")).toBeVisible();
		await expect(page.getByText("Chapter 3")).toBeVisible();
		await expect(page.getByText("Chapter 4")).toBeVisible();
	});

	test("shows Mission 1 as available", async ({ page }) => {
		await expect(page.getByText("Beachhead")).toBeVisible({ timeout: 10000 });
		await expect(page.getByText("Available")).toBeVisible();
	});

	test("has Back to Menu button", async ({ page }) => {
		await expect(page.getByRole("button", { name: /Back to Menu/i })).toBeVisible({
			timeout: 10000,
		});
	});

	test("shows difficulty badge", async ({ page }) => {
		await expect(page.getByText("Difficulty:")).toBeVisible({ timeout: 10000 });
		await expect(page.getByText("Support")).toBeVisible();
	});
});
