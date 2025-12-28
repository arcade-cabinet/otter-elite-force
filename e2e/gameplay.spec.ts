import { expect, test } from "@playwright/test";
import { hasMcpSupport, injectGameState, robustClick, waitForStable } from "./helpers";

/**
 * E2E Tests: Core Gameplay Flow
 *
 * Tests for main menu to game transition:
 * - New game flow (menu -> cutscene -> game)
 * - Continue campaign for returning players
 * - Difficulty selection and escalation mechanics
 * - The Fall mechanic (TACTICAL mode)
 */

test.describe("Gameplay Flow - Menu to Game Transition", () => {
	test.beforeEach(async ({ page }) => {
		// Clear save data for fresh start
		await page.goto("/");
		await page.evaluate(() => localStorage.removeItem("otter_v8"));
		await page.reload();
		await waitForStable(page);
	});

	test("complete new game flow: menu -> cutscene -> game world", async ({ page }) => {
		// Verify main menu loaded
		await expect(page.getByRole("heading", { name: /OTTER/i })).toBeVisible();
		await expect(page.getByRole("heading", { name: /ELITE FORCE/i })).toBeVisible();

		// Check default character is selected
		const bubblesCard = page.locator('.char-card.selected:has-text("SGT. BUBBLES")');
		await expect(bubblesCard).toBeVisible();

		// Verify NEW GAME button is shown (no save data)
		const newGameBtn = page.locator('button:has-text("NEW GAME")');
		await expect(newGameBtn).toBeVisible();

		// Start new game
		await robustClick(page, 'button:has-text("NEW GAME")');

		// Should transition to cutscene
		const cutscene = page.locator(".cutscene-screen");
		await expect(cutscene).toBeVisible({ timeout: 10000 });
		await expect(page.locator(".dialogue-box")).toBeVisible();

		// Verify cutscene has proper elements
		const dialogueText = page.locator(".dialogue-text");
		await expect(dialogueText).toBeVisible();

		// Click through cutscene
		const nextBtn = page.locator("button.dialogue-next");
		await expect(nextBtn).toBeVisible({ timeout: 10000 });

		// Click NEXT >> until we reach BEGIN MISSION
		// Add small delays between clicks to allow dialogue state to update
		let buttonText = await nextBtn.innerText();
		while (buttonText.includes("NEXT")) {
			await nextBtn.click();
			await page.waitForTimeout(500); // Wait for dialogue to update
			buttonText = await nextBtn.innerText();
		}

		// Final click on BEGIN MISSION
		await nextBtn.click();
		await waitForStable(page, 2000); // Give time for game world to initialize

		// Should transition to gameplay (canvas visible if WebGL supported)
		if (hasMcpSupport) {
			const canvas = page.locator("canvas");
			await expect(canvas).toBeVisible({ timeout: 15000 });

			// HUD should also be visible
			await expect(page.locator(".hud-container")).toBeVisible({ timeout: 5000 });
		} else {
			// If no WebGL, we might still see HUD or just verify we're not on menu
			await expect(page.getByRole("heading", { name: /OTTER/i })).not.toBeVisible();
		}
	});

	test("continue campaign flow for returning players", async ({ page }) => {
		// Inject save data with some progress
		await injectGameState(page, {
			discoveredChunks: { "0,0": { id: "0,0", x: 0, z: 0, secured: false } },
			isLZSecured: false,
			coins: 500,
			rank: 1,
		});

		// Should show CONTINUE CAMPAIGN button instead of NEW GAME
		const continueBtn = page.locator('button:has-text("CONTINUE CAMPAIGN")');
		await expect(continueBtn).toBeVisible();

		// Should also show RESTART CAMPAIGN option
		const restartBtn = page.locator('button:has-text("RESTART CAMPAIGN")');
		await expect(restartBtn).toBeVisible();

		// Continue should go directly to game (skip cutscene)
		await continueBtn.click();
		await waitForStable(page, 2000);

		// Should be in game mode (canvas visible if WebGL supported)
		if (hasMcpSupport) {
			const canvas = page.locator("canvas");
			await expect(canvas).toBeVisible({ timeout: 10000 });
		} else {
			await expect(page.locator('button:has-text("CONTINUE CAMPAIGN")')).not.toBeVisible();
		}
	});

	test("difficulty selection only allows escalation", async ({ page }) => {
		// Start with SUPPORT difficulty (default)
		await expect(page.locator(".stat-val:has-text('SUPPORT')")).toBeVisible();

		// TACTICAL card should be clickable (can escalate)
		const tacticalCard = page.locator('.diff-card:has-text("TACTICAL")');
		await expect(tacticalCard).not.toHaveClass(/locked/);

		// SUPPORT should be marked as current
		const supportCard = page.locator('.diff-card:has-text("SUPPORT")');
		await expect(supportCard).toHaveClass(/selected/);

		// ELITE should be available for escalation
		const eliteCard = page.locator('.diff-card:has-text("ELITE")');
		await expect(eliteCard).not.toHaveClass(/locked/);

		// Escalate to TACTICAL
		page.on("dialog", (dialog) => dialog.accept());
		await tacticalCard.click();
		await expect(page.locator(".stat-val:has-text('TACTICAL')")).toBeVisible();

		// Now SUPPORT should be locked (cannot downgrade)
		await expect(page.locator('.diff-card:has-text("SUPPORT")')).toHaveClass(/locked/);
	});

	test("The Fall mechanic in TACTICAL mode", async ({ page }) => {
		// Inject TACTICAL mode with isFallTriggered enabled
		await injectGameState(page, {
			difficultyMode: "TACTICAL",
			isFallTriggered: true,
			isLZSecured: true,
			discoveredChunks: { "0,0": { id: "0,0", x: 0, z: 0, secured: true } },
		});

		// Start game
		await robustClick(page, 'button:has-text("CONTINUE CAMPAIGN")');
		await waitForStable(page, 3000);

		// HUD should show THE FALL warning
		await expect(page.locator("text=THE FALL")).toBeVisible();
		await expect(page.locator("text=RETURN TO LZ")).toBeVisible();
	});
});
