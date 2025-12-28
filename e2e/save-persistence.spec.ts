import { expect, test } from "@playwright/test";
import { injectGameState, waitForStable } from "./helpers";

/**
 * E2E Tests: Save Data and Persistence
 *
 * Tests for save data management:
 * - State persistence across reloads
 * - Data reset functionality
 */

test.describe("Save and Persistence", () => {
	test("game state persists across page reloads", async ({ page }) => {
		await page.goto("/");

		// Inject specific state
		await injectGameState(page, {
			coins: 777,
			rank: 3,
			discoveredChunks: {
				"0,0": {
					id: "0,0",
					x: 0,
					z: 0,
					secured: true,
					seed: 1,
					terrainType: "MARSH",
					entities: [],
					decorations: [],
				},
				"1,0": {
					id: "1,0",
					x: 1,
					z: 0,
					secured: false,
					seed: 2,
					terrainType: "RIVER",
					entities: [],
					decorations: [],
				},
				"0,1": {
					id: "0,1",
					x: 0,
					z: 1,
					secured: false,
					seed: 3,
					terrainType: "DENSE_JUNGLE",
					entities: [],
					decorations: [],
				},
			},
		});

		// Reload and verify state persisted
		await page.reload();
		await waitForStable(page);

		// Navigate to canteen to check coins
		await page.locator('button:has-text("VISIT CANTEEN")').click();
		await waitForStable(page);

		// Should show our injected coin amount
		await expect(page.locator("text=777")).toBeVisible();
	});

	test("reset data clears all progress", async ({ page }) => {
		await page.goto("/");

		// Inject state with progress
		await injectGameState(page, {
			coins: 999,
			rank: 5,
			discoveredChunks: {
				"0,0": {
					id: "0,0",
					x: 0,
					z: 0,
					secured: true,
					seed: 1,
					terrainType: "MARSH",
					entities: [],
					decorations: [],
				},
				"1,1": {
					id: "1,1",
					x: 1,
					z: 1,
					secured: true,
					seed: 2,
					terrainType: "DENSE_JUNGLE",
					entities: [],
					decorations: [],
				},
			},
			isLZSecured: true,
		});

		// Click reset button (need to handle confirmation dialog)
		page.on("dialog", (dialog) => dialog.accept());
		await page.locator('button:has-text("RESET ALL DATA")').click();

		// Page should reload, wait for it
		await page.waitForLoadState("networkidle");
		await waitForStable(page);

		// Should be back to fresh state - NEW GAME button visible
		await expect(page.locator('button:has-text("NEW GAME")')).toBeVisible();
	});
});
