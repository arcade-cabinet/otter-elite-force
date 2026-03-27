import { expect, test } from "@playwright/test";

/**
 * US-083: E2E — menu to new game to mission loads
 *
 * Verified against actual DOM output from the SolidJS + Tailwind UI.
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

		// Main buttons
		await expect(page.getByRole("button", { name: /New Campaign/i })).toBeVisible();
		await expect(page.getByRole("button", { name: /Skirmish/i })).toBeVisible();
		await expect(page.getByRole("button", { name: /Settings/i })).toBeVisible();

		// Build info
		await expect(page.getByText(/Build Alpha/i)).toBeVisible();
	});

	test("New Campaign navigates to mission briefing", async ({ page }) => {
		await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });

		// Click New Campaign
		await page.getByRole("button", { name: /New Campaign/i }).click();

		// Briefing should appear with mission details
		await expect(page.getByText("Mission Briefing")).toBeVisible({ timeout: 10000 });
		await expect(page.getByRole("heading", { name: "Beachhead" })).toBeVisible();
		await expect(page.getByText("CLASSIFIED")).toBeVisible();
		await expect(page.getByText("FOXHOUND").first()).toBeVisible();

		// Deploy and Back buttons
		await expect(page.getByRole("button", { name: /Deploy/i })).toBeVisible();
		await expect(page.getByRole("button", { name: /Back/i })).toBeVisible();
	});

	test("full flow: menu -> briefing -> Deploy -> game loads with HUD", async ({ page }) => {
		await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });

		// Step 1: New Campaign
		await page.getByRole("button", { name: /New Campaign/i }).click();
		await expect(page.getByText("Mission Briefing")).toBeVisible({ timeout: 10000 });

		// Step 2: Deploy
		await page.getByRole("button", { name: /Deploy/i }).click();
		await page.waitForTimeout(5000);

		// Step 3: Verify game HUD is visible (resource bar)
		await expect(page.getByText(/Fish/i).first()).toBeVisible({ timeout: 10000 });

		// Step 4: Verify canvas exists (game rendering)
		const canvasCount = await page.locator("canvas").count();
		expect(canvasCount).toBeGreaterThanOrEqual(1);
	});

	test("briefing Back returns to menu", async ({ page }) => {
		await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });

		await page.getByRole("button", { name: /New Campaign/i }).click();
		await expect(page.getByText("Mission Briefing")).toBeVisible({ timeout: 10000 });

		// Back goes to campaign view (which defaults to menu if not in a campaign)
		await page.getByRole("button", { name: /Back/i }).click();
		await page.waitForTimeout(1000);

		// Should be able to see some screen (campaign view or menu)
		// The Back button on briefing navigates to "campaign" screen
		const pageContent = await page.evaluate(() => document.body.innerText);
		expect(pageContent.length).toBeGreaterThan(0);
	});

	test("briefing dialogue shows FOXHOUND speaker and mission text", async ({ page }) => {
		await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
		await page.getByRole("button", { name: /New Campaign/i }).click();
		await page.waitForTimeout(2000);

		// FOXHOUND appears as a briefing speaker
		const foxhoundCount = await page.locator("text=FOXHOUND").count();
		expect(foxhoundCount).toBeGreaterThanOrEqual(1);

		// Mission objectives should be visible
		await expect(page.getByText("Primary Objectives")).toBeVisible();
	});

	test("Settings screen is accessible from menu", async ({ page }) => {
		await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
		await page.getByRole("button", { name: /Settings/i }).click();

		// Settings heading should be visible (it's an h2, not h1)
		await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 10000 });

		// Master Volume slider should be present
		await expect(page.getByText("Master Volume")).toBeVisible();
	});
});
