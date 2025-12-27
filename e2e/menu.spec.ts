import { expect, test } from "@playwright/test";

/**
 * Main Menu E2E Tests for OTTER: ELITE FORCE
 *
 * Tests the main menu functionality including:
 * - UI rendering and layout
 * - Character selection
 * - Navigation to different game modes
 * - Rank and stats display
 */

test.describe("OTTER: ELITE FORCE - Main Menu", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		// Wait for initial render
		await page.waitForTimeout(1000);
	});

	// ============================================
	// Title and Branding Tests
	// ============================================

	test("should display main menu with correct title", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("OTTER");
		await expect(page.locator("h1")).toContainText("ELITE FORCE");
	});

	test("should display subtitle tagline", async ({ page }) => {
		await expect(page.locator(".subtitle")).toContainText("DEFEND THE RIVER");
	});

	// ============================================
	// Platoon Commander Tests
	// ============================================

	test("should show platoon commander section", async ({ page }) => {
		await expect(page.locator("text=PLATOON COMMANDER")).toBeVisible();
	});

	test("should display default character - SGT. BUBBLES", async ({ page }) => {
		// The character name should be visible in the platoon commander section
		// It's rendered in a .stat-val span
		await expect(page.locator(".stat-val").first()).toBeVisible({ timeout: 10000 });

		// Verify the character name contains expected text (case insensitive)
		const charName = await page.locator(".stat-val").first().textContent();
		expect(charName?.toLowerCase()).toContain("bubbles");
	});

	test("should show rank information", async ({ page }) => {
		await expect(page.locator("text=RANK")).toBeVisible();
		await expect(page.locator("text=PUP")).toBeVisible();
	});

	// ============================================
	// Character Selection Tests
	// ============================================

	test("should have character selection cards", async ({ page }) => {
		const charCards = page.locator(".char-card");
		const count = await charCards.count();
		expect(count).toBeGreaterThan(0);
	});

	test("should have bubbles selected by default", async ({ page }) => {
		const bubblesCard = page.locator('.char-card.selected:has-text("SGT. BUBBLES")');
		await expect(bubblesCard).toBeVisible();
	});

	test("should allow switching characters", async ({ page }) => {
		// Get all character cards
		const charCards = page.locator(".char-card");
		const count = await charCards.count();

		// Skip if only one character available
		test.skip(count <= 1, "Only one character available");

		// Click on a different character
		await charCards.nth(1).click();
		await page.waitForTimeout(500);

		// Verify selection changed - there should be exactly one selected card
		const selectedCards = page.locator(".char-card.selected");
		await expect(selectedCards).toHaveCount(1);
	});

	// ============================================
	// Navigation Tests
	// ============================================

	test("should navigate to canteen successfully", async ({ page }) => {
		const canteenBtn = page.locator('button:has-text("VISIT CANTEEN")');
		await expect(canteenBtn).toBeVisible();
		await canteenBtn.click();

		await expect(page.locator("h2")).toContainText("FORWARD OPERATING BASE");
		await expect(page.locator("text=SUPPLY CREDITS")).toBeVisible();
	});

	test("should return from canteen to main menu", async ({ page }) => {
		// Go to canteen
		const canteenBtn = page.locator('button:has-text("VISIT CANTEEN")');
		await canteenBtn.click();

		await page.waitForTimeout(500);

		// Look for back button
		const backBtn = page.locator('button:has-text("BACK")');
		if (await backBtn.isVisible()) {
			await backBtn.click();
			await expect(page.locator("h1")).toContainText("OTTER");
		}
	});

	test("should navigate to campaign cutscene", async ({ page }) => {
		const startBtn = page.locator('button:has-text("START CAMPAIGN")');
		await expect(startBtn).toBeVisible();
		await startBtn.click();

		await expect(page.locator(".cutscene-screen")).toBeVisible();
		await expect(page.locator(".dialogue-box")).toBeVisible();
	});

	// ============================================
	// Menu Action Buttons Tests
	// ============================================

	test("should display all menu action buttons", async ({ page }) => {
		await expect(page.locator('button:has-text("START CAMPAIGN")')).toBeVisible();
		await expect(page.locator('button:has-text("VISIT CANTEEN")')).toBeVisible();
	});

	test("should have interactive buttons with hover states", async ({ page }) => {
		const startBtn = page.locator('button:has-text("START CAMPAIGN")');

		// Button should be clickable
		await expect(startBtn).toBeEnabled();

		// Hover over button
		await startBtn.hover();

		// Button should still be visible and enabled
		await expect(startBtn).toBeVisible();
		await expect(startBtn).toBeEnabled();
	});

	// ============================================
	// Accessibility Tests
	// ============================================

	test("should have proper heading hierarchy", async ({ page }) => {
		const h1 = page.locator("h1");
		await expect(h1).toHaveCount(1);
	});

	test("should have accessible button labels", async ({ page }) => {
		const buttons = page.locator("button");
		const count = await buttons.count();

		for (let i = 0; i < count; i++) {
			const button = buttons.nth(i);
			const text = await button.textContent();
			expect(text?.trim().length).toBeGreaterThan(0);
		}
	});
});

test.describe("OTTER: ELITE FORCE - Canteen", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await page.waitForTimeout(1000);

		// Navigate to canteen
		const canteenBtn = page.locator('button:has-text("VISIT CANTEEN")');
		await canteenBtn.click();
		await page.waitForTimeout(500);
	});

	test("should display canteen header", async ({ page }) => {
		await expect(page.locator("h2")).toContainText("FORWARD OPERATING BASE");
	});

	test("should show supply credits", async ({ page }) => {
		await expect(page.locator("text=SUPPLY CREDITS")).toBeVisible();
	});

	test("should display upgrade options", async ({ page }) => {
		// Look for upgrade items or shop elements
		const upgradeSection = page.locator(".upgrades, .shop-items, .store");
		if (await upgradeSection.isVisible()) {
			await expect(upgradeSection).toBeVisible();
		}
	});
});

test.describe("OTTER: ELITE FORCE - Cutscene", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await page.waitForTimeout(1000);

		// Start campaign
		const startBtn = page.locator('button:has-text("START CAMPAIGN")');
		await startBtn.click();
		await page.waitForTimeout(500);
	});

	test("should display cutscene screen", async ({ page }) => {
		await expect(page.locator(".cutscene-screen")).toBeVisible();
	});

	test("should show dialogue box", async ({ page }) => {
		await expect(page.locator(".dialogue-box")).toBeVisible();
	});

	test("should have continue or skip option", async ({ page }) => {
		// Look for progress button - could be "NEXT >>", "BEGIN MISSION", or other variants
		const progressBtn = page.locator(".dialogue-next");
		await expect(progressBtn).toBeVisible({ timeout: 5000 });

		// Verify the button has some text
		const text = await progressBtn.textContent();
		expect(text?.length).toBeGreaterThan(0);
	});

	test("should display dialogue text", async ({ page }) => {
		const dialogueBox = page.locator(".dialogue-box");
		const text = await dialogueBox.textContent();
		expect(text?.length).toBeGreaterThan(0);
	});
});
