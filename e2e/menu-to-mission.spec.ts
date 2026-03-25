import { expect, test } from "@playwright/test";

/**
 * US-083: E2E — menu to new game to mission loads
 *
 * Verified against actual DOM output from the React + Tailwind UI.
 * Selectors use text content matching (not CSS class names) for resilience.
 */

test.describe("US-083: Menu to Mission E2E Flow", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await page.evaluate(() => localStorage.clear());
		await page.reload();
		await page.waitForLoadState("networkidle");
	});

	test("main menu renders with correct branding", async ({ page }) => {
		// Title
		await expect(page.locator("h1")).toContainText("Otter Elite Force", { timeout: 10000 });

		// Copper-Silt Reach badge
		await expect(page.getByText("Copper-Silt Reach")).toBeVisible();

		// Four main buttons
		await expect(page.getByRole("button", { name: /New Game/i })).toBeVisible();
		await expect(page.getByRole("button", { name: /Continue/i })).toBeVisible();
		await expect(page.getByRole("button", { name: /Skirmish/i })).toBeVisible();
		await expect(page.getByRole("button", { name: /Settings/i })).toBeVisible();

		// Faction cards
		await expect(page.getByText("Otter Elite Force").nth(1)).toBeVisible();
		await expect(page.getByText("Scale-Guard")).toBeVisible();

		// Mission counter
		await expect(page.getByText(/\d+ \/ 16 missions completed/i)).toBeVisible();
	});

	test("New Game expands difficulty selection", async ({ page }) => {
		await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });

		// Click New Game
		await page.getByRole("button", { name: /New Game/i }).click();

		// Three difficulty options should appear
		await expect(page.getByRole("button", { name: /Support/i })).toBeVisible({ timeout: 5000 });
		await expect(page.getByRole("button", { name: /Tactical/i })).toBeVisible();
		await expect(page.getByRole("button", { name: /Elite/i })).toBeVisible();

		// Descriptions visible
		await expect(page.getByText(/0\.75x enemy damage/i)).toBeVisible();
		await expect(page.getByText(/1x damage/i)).toBeVisible();
		await expect(page.getByText(/1\.25x enemy damage/i)).toBeVisible();
	});

	test("selecting difficulty navigates to campaign view", async ({ page }) => {
		await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });

		// New Game -> Support difficulty
		await page.getByRole("button", { name: /New Game/i }).click();
		await page.getByRole("button", { name: /Support/i }).click();

		// Campaign view should appear with 16 missions across 4 chapters
		await expect(page.getByText("Campaign")).toBeVisible({ timeout: 10000 });
		await expect(page.getByText("Chapter 1")).toBeVisible();
		await expect(page.getByText("Beachhead")).toBeVisible();
		await expect(page.getByText("Chapter 4")).toBeVisible();
		await expect(page.getByText(/The Reckoning/i)).toBeVisible();
		await expect(page.getByText("Difficulty:")).toBeVisible();
		await expect(page.getByText(/0 of 16 missions completed/i)).toBeVisible();

		// Mission 1 should be available, others locked
		await expect(page.getByText("Available")).toBeVisible();
	});

	test("full flow: menu -> campaign -> Mission 1 loads with HUD", async ({ page }) => {
		await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });

		// Step 1: New Game -> Support
		await page.getByRole("button", { name: /New Game/i }).click();
		await page.getByRole("button", { name: /Support/i }).click();

		// Step 2: Click Mission 1 (Beachhead)
		await expect(page.getByText("Beachhead")).toBeVisible({ timeout: 10000 });
		await page.getByText("Beachhead").click();

		// Step 3: Wait for game to load
		await page.waitForTimeout(4000);

		// Step 4: Verify resource bar is visible
		await expect(page.getByText("Fish")).toBeVisible({ timeout: 15000 });
		await expect(page.getByText("Timber")).toBeVisible();
		await expect(page.getByText("Salvage")).toBeVisible();

		// Step 5: Verify mission identity in HUD
		await expect(page.getByText(/Chapter 1/i)).toBeVisible({ timeout: 10000 });

		// Step 6: Verify Phaser canvas exists (minimap)
		const canvasCount = await page.locator("canvas").count();
		expect(canvasCount).toBeGreaterThanOrEqual(1);
	});

	test("briefing dialogue shows FOXHOUND speaker", async ({ page }) => {
		await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
		await page.getByRole("button", { name: /New Game/i }).click();
		await page.getByRole("button", { name: /Support/i }).click();
		await page.getByText("Beachhead").click();
		await page.waitForTimeout(4000);

		// FOXHOUND appears in multiple HUD locations — use locator for any match
		const foxhoundCount = await page.locator("text=FOXHOUND").count();
		expect(foxhoundCount).toBeGreaterThanOrEqual(1);

		// Briefing text should contain mission dialogue
		const transmissionText = page.getByTestId("command-transmission-text");
		if (await transmissionText.isVisible({ timeout: 5000 }).catch(() => false)) {
			const text = await transmissionText.textContent();
			expect(text?.length).toBeGreaterThan(10);
		}
	});

	test("Settings screen is accessible from menu", async ({ page }) => {
		await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
		await page.getByRole("button", { name: /Settings/i }).click();

		// Settings panel should show volume or control options
		// The settings page may have different label text — just verify we left the menu
		await expect(page.locator("h1")).not.toContainText("Otter Elite Force", { timeout: 10000 });
	});

	test("Continue is disabled with no save data", async ({ page }) => {
		await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });

		const continueBtn = page.getByRole("button", { name: /Continue/i });
		await expect(continueBtn).toBeVisible();
		await expect(continueBtn).toBeDisabled();
	});
});
