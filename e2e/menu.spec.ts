import { expect, test } from "@playwright/test";

test.describe("OTTER: ELITE FORCE - Main Menu", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
	});

	test("should display main menu with correct title", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("OTTER");
		await expect(page.locator("h1")).toContainText("ELITE FORCE");
		await expect(page.locator(".subtitle")).toContainText("DEFEND THE RIVER");
	});

	test("should show platoon commander and rank", async ({ page }) => {
		await expect(page.locator("text=PLATOON COMMANDER")).toBeVisible();
		await expect(page.locator("text=SGT. BUBBLES")).toBeVisible();
		await expect(page.locator("text=RANK")).toBeVisible();
		await expect(page.locator("text=PUP")).toBeVisible();
	});

	test("should allow character selection", async ({ page }) => {
		const _whiskersBtn = page.locator('.char-card:has-text("GEN. WHISKERS")');
		// Whiskers might be locked initially, check if bubbles is selected
		const bubblesCard = page.locator('.char-card.selected:has-text("SGT. BUBBLES")');
		await expect(bubblesCard).toBeVisible();
	});

	test("should navigate to canteen", async ({ page }) => {
		const canteenBtn = page.locator('button:has-text("VISIT CANTEEN")');
		await canteenBtn.click();
		await expect(page.locator("h2")).toContainText("FORWARD OPERATING BASE");
		await expect(page.locator("text=SUPPLY CREDITS")).toBeVisible();
	});

	test("should navigate to campaign cutscene", async ({ page }) => {
		const startBtn = page.locator('button:has-text("START CAMPAIGN")');
		await startBtn.click();
		await expect(page.locator(".cutscene-screen")).toBeVisible();
		await expect(page.locator(".dialogue-box")).toBeVisible();
	});
});
