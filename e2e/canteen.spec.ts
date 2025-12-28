import { expect, test } from "@playwright/test";
import { injectGameState, robustClick, waitForStable } from "./helpers";

/**
 * E2E Tests: Canteen Operations
 *
 * Tests for the Forward Operating Base (FOB) canteen functionality:
 * - Character roster viewing
 * - Upgrade purchasing system
 * - Navigation between tabs
 */

test.describe("Canteen Operations", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await waitForStable(page);
	});

	test("navigate to canteen and view character roster", async ({ page }) => {
		// Navigate to canteen
		await robustClick(page, 'button:has-text("VISIT CANTEEN")');

		// Should show Forward Operating Base header
		await expect(page.locator("h2:has-text('FORWARD OPERATING BASE')")).toBeVisible();

		// Should show supply credits
		await expect(page.locator("text=SUPPLY CREDITS")).toBeVisible();

		// Should have PLATOON and UPGRADES tabs
		await expect(page.locator('button:has-text("PLATOON")')).toBeVisible();
		await expect(page.locator('button:has-text("UPGRADES")')).toBeVisible();

		// PLATOON tab should be active by default
		await expect(page.locator('button.active:has-text("PLATOON")')).toBeVisible();
	});

	test("character selection in platoon roster", async ({ page }) => {
		// Navigate to canteen
		await robustClick(page, 'button:has-text("VISIT CANTEEN")');
		await waitForStable(page);

		// Platoon grid should show character cards
		const platoonGrid = page.locator(".platoon-grid");
		await expect(platoonGrid).toBeVisible();

		// Default character (bubbles) should be unlocked
		const bubblesCard = page.locator('.platoon-card:has-text("SGT. BUBBLES")');
		await expect(bubblesCard).toHaveClass(/unlocked/);

		// Select different character if available
		const characterCards = page.locator(".platoon-card");
		const count = await characterCards.count();
		expect(count).toBeGreaterThan(0);

		// Clicking a card should open the preview modal
		await bubblesCard.click();
		await expect(page.locator(".canteen-modal")).toBeVisible();
		await expect(page.locator(".canteen-modal h3")).toContainText("SGT. BUBBLES");

		// Close modal
		await page.locator(".cancel-btn").click();
		await expect(page.locator(".canteen-modal")).not.toBeVisible();
	});

	test("upgrades tab shows boost options", async ({ page }) => {
		// Navigate to canteen
		await robustClick(page, 'button:has-text("VISIT CANTEEN")');
		await waitForStable(page);

		// Switch to UPGRADES tab
		await robustClick(page, 'button:has-text("UPGRADES")');

		// Should show upgrade options
		await expect(page.locator("text=SPEED BOOST")).toBeVisible();
		await expect(page.locator("text=HEALTH BOOST")).toBeVisible();
		await expect(page.locator("text=DAMAGE BOOST")).toBeVisible();

		// Each upgrade should have a buy button with CR (credits) cost
		const buyButtons = page.locator('.upgrade-item button:has-text("CR")');
		await expect(buyButtons.first()).toBeVisible();
	});

	test("purchase upgrade with sufficient coins", async ({ page }) => {
		// Inject coins for testing
		await injectGameState(page, {
			coins: 1000,
			upgrades: { speedBoost: 1, healthBoost: 1, damageBoost: 1, weaponLvl: {} },
		});

		// Navigate to canteen upgrades
		await robustClick(page, 'button:has-text("VISIT CANTEEN")');
		await waitForStable(page);
		await robustClick(page, 'button:has-text("UPGRADES")');

		// Initial speed boost level should be 1 - check within the speed boost item
		const speedItem = page.locator('.upgrade-item:has-text("SPEED BOOST")');
		await expect(speedItem).toBeVisible();
		await expect(speedItem.locator("text=Level 1")).toBeVisible();

		// Click buy on speed boost
		const speedBuyBtn = speedItem.locator('button:has-text("CR")');
		await speedBuyBtn.click();

		// Should now show level 2
		await expect(speedItem.locator("text=Level 2")).toBeVisible();
	});

	test("return to menu from canteen", async ({ page }) => {
		// Navigate to canteen
		await robustClick(page, 'button:has-text("VISIT CANTEEN")');
		await waitForStable(page);

		// Click return button
		await robustClick(page, 'button:has-text("RETURN TO PERIMETER")');

		// Should be back at main menu
		await expect(page.getByRole("heading", { name: /OTTER/i })).toBeVisible();
	});
});
