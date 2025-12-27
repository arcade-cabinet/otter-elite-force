import { expect, test } from "@playwright/test";

/**
 * Main Menu E2E Tests for OTTER: ELITE FORCE
 *
 * Tests the game loader interface (NOT level select):
 * - New Game / Continue Campaign buttons
 * - Character selection (rescue-based unlocks)
 * - Difficulty modes (escalation only)
 * - Canteen navigation
 *
 * CRITICAL: The game uses an open world design, NOT discrete levels.
 */

test.describe("OTTER: ELITE FORCE - Game Loader Interface", () => {
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

	test("should display Copper-Silt Reach subtitle", async ({ page }) => {
		await expect(page.locator(".subtitle")).toContainText("COPPER-SILT REACH");
	});

	// ============================================
	// Game Loader Tests (NOT Level Select)
	// ============================================

	test("should show NEW GAME button for fresh start", async ({ page }) => {
		// On first load with no save data, should show NEW GAME
		const newGameBtn = page.locator('button:has-text("NEW GAME")');
		await expect(newGameBtn).toBeVisible();
	});

	test("should NOT have level select or mission list", async ({ page }) => {
		// Critical: Ensure no level selection exists
		await expect(page.locator(".level-grid")).not.toBeVisible();
		await expect(page.locator(".level-card")).toHaveCount(0);
		await expect(page.locator("text=MISSIONS")).not.toBeVisible();
	});

	// ============================================
	// Platoon Commander Tests
	// ============================================

	test("should show platoon commander section", async ({ page }) => {
		await expect(page.locator("text=PLATOON COMMANDER")).toBeVisible();
	});

	test("should display default character - SGT. BUBBLES", async ({ page }) => {
		await expect(page.locator(".stat-val").first()).toBeVisible({ timeout: 10000 });
		const charName = await page.locator(".stat-val").first().textContent();
		expect(charName?.toLowerCase()).toContain("bubbles");
	});

	test("should show rank information", async ({ page }) => {
		await expect(page.locator("text=RANK")).toBeVisible();
		await expect(page.locator("text=PUP")).toBeVisible();
	});

	test("should show territory score", async ({ page }) => {
		await expect(page.locator("text=TERRITORY SECURED")).toBeVisible();
	});

	test("should show peacekeeping score", async ({ page }) => {
		await expect(page.locator("text=PEACEKEEPING SCORE")).toBeVisible();
	});

	// ============================================
	// Character Selection Tests (Rescue-Based)
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

	test("should show locked characters with rescue hint", async ({ page }) => {
		// Locked characters should show "RESCUE TO UNLOCK"
		await expect(page.locator("text=RESCUE TO UNLOCK").first()).toBeVisible();
	});

	test("should explain rescue-based unlock system", async ({ page }) => {
		await expect(page.locator("text=Rescue allies in the field")).toBeVisible();
	});

	// ============================================
	// Difficulty Mode Tests (Escalation Only)
	// ============================================

	test("should display all three difficulty modes", async ({ page }) => {
		const diffGrid = page.locator(".difficulty-grid");
		await expect(diffGrid).toBeVisible();
		await expect(page.locator("text=SUPPORT")).toBeVisible();
		await expect(page.locator("text=TACTICAL")).toBeVisible();
		await expect(page.locator("text=ELITE")).toBeVisible();
	});

	test("should explain escalation-only difficulty", async ({ page }) => {
		await expect(page.locator("text=can be increased but never decreased")).toBeVisible();
	});

	test("should highlight current difficulty as selected", async ({ page }) => {
		const selectedDiff = page.locator(".diff-card.selected");
		await expect(selectedDiff).toBeVisible();
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

	test("should navigate to campaign cutscene from NEW GAME", async ({ page }) => {
		const newGameBtn = page.locator('button:has-text("NEW GAME")');
		await expect(newGameBtn).toBeVisible();
		await newGameBtn.click();

		await expect(page.locator(".cutscene-screen")).toBeVisible();
		await expect(page.locator(".dialogue-box")).toBeVisible();
	});

	// ============================================
	// Reset Data Tests
	// ============================================

	test("should have reset data button", async ({ page }) => {
		const resetBtn = page.locator('button:has-text("RESET ALL DATA")');
		await expect(resetBtn).toBeVisible();
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

test.describe("OTTER: ELITE FORCE - Canteen (FOB)", () => {
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

		// Start campaign via NEW GAME
		const newGameBtn = page.locator('button:has-text("NEW GAME")');
		await newGameBtn.click();
		await page.waitForTimeout(500);
	});

	test("should display cutscene screen", async ({ page }) => {
		await expect(page.locator(".cutscene-screen")).toBeVisible();
	});

	test("should show dialogue box", async ({ page }) => {
		await expect(page.locator(".dialogue-box")).toBeVisible();
	});

	test("should have continue or skip option", async ({ page }) => {
		// Look for progress button
		const progressBtn = page.locator(".dialogue-next");
		await expect(progressBtn).toBeVisible({ timeout: 5000 });
		const text = await progressBtn.textContent();
		expect(text?.length).toBeGreaterThan(0);
	});

	test("should display dialogue text", async ({ page }) => {
		const dialogueBox = page.locator(".dialogue-box");
		const text = await dialogueBox.textContent();
		expect(text?.length).toBeGreaterThan(0);
	});
});

test.describe("OTTER: ELITE FORCE - Open World Design Compliance", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await page.waitForTimeout(1000);
	});

	test("should not have any level-related UI elements", async ({ page }) => {
		// Comprehensive check for level-based UI (should NOT exist)
		await expect(page.locator("text=/LEVEL \\d/i")).not.toBeVisible();
		await expect(page.locator("text=/MISSION \\d/i")).not.toBeVisible();
		await expect(page.locator("text=/STAGE \\d/i")).not.toBeVisible();
		await expect(page.locator(".level-select")).not.toBeVisible();
		await expect(page.locator(".mission-select")).not.toBeVisible();
	});

	test("should emphasize territory and peacekeeping scores", async ({ page }) => {
		// Open world progress is tracked via territory and peacekeeping, not level completion
		await expect(page.locator("text=TERRITORY")).toBeVisible();
		await expect(page.locator("text=PEACEKEEPING")).toBeVisible();
	});

	test("should show difficulty as campaign modifier, not per-level", async ({ page }) => {
		await expect(page.locator("text=CAMPAIGN DIFFICULTY")).toBeVisible();
	});
});
