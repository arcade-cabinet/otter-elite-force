import { test, expect } from "@playwright/test";

test.describe("OTTER: ELITE FORCE", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
	});

	test("should display main menu", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("OTTER");
		await expect(page.locator("h1")).toContainText("ELITE FORCE");
	});

	test("should show campaign button", async ({ page }) => {
		const campaignBtn = page.locator('button:has-text("CAMPAIGN")');
		await expect(campaignBtn).toBeVisible();
	});

	test("should display player stats", async ({ page }) => {
		await expect(page.locator("text=SGT. BUBBLES")).toBeVisible();
		await expect(page.locator("text=RANK")).toBeVisible();
		await expect(page.locator("text=MEDALS")).toBeVisible();
	});

	test("should display level cards", async ({ page }) => {
		await expect(page.locator(".level-card").first()).toBeVisible();
	});

	test("should have reset data button", async ({ page }) => {
		const resetBtn = page.locator('button:has-text("RESET DATA")');
		await expect(resetBtn).toBeVisible();
	});
});
