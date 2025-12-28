import * as fs from "node:fs";
import * as path from "node:path";
import { test } from "@playwright/test";
import { updateSaveData, waitForStable } from "./helpers";

const SCREENSHOT_DIR = "visual-audit-results-combat";

// Increased timeout for visual audit tests
test.setTimeout(120000);

test.beforeAll(async () => {
	if (!fs.existsSync(SCREENSHOT_DIR)) {
		fs.mkdirSync(SCREENSHOT_DIR);
	}
});

test.describe("Visual Audit - Combat and Objectives", () => {
	test("capture combat and objective states", async ({ page }) => {
		await page.goto("/");

		// Inject state with various entities nearby
		await page.evaluate(() => {
			const key = "otter_v8";
			const state = {
				version: 8,
				rank: 1,
				xp: 100,
				medals: 0,
				unlocked: 1,
				unlockedCharacters: ["bubbles", "whiskers"],
				unlockedWeapons: ["service-pistol"],
				coins: 1000,
				discoveredChunks: {
					"0,0": {
						id: "0,0",
						x: 0,
						z: 0,
						seed: 12345,
						terrainType: "MARSH",
						secured: false,
						entities: [
							{ id: "gator-1", type: "GATOR", position: [5, 0, 5], hp: 10 },
							{ id: "snake-1", type: "SNAKE", position: [-5, 0, 5], hp: 2 },
							{ id: "siphon-1", type: "SIPHON", position: [0, 0, 10] },
							{ id: "cage-1", type: "PRISON_CAGE", position: [10, 0, 0], objectiveId: "whiskers" },
							{ id: "stockpile-1", type: "GAS_STOCKPILE", position: [-10, 0, 0] },
						],
						decorations: [{ id: "reed-1", type: "REED", count: 20 }],
					},
				},
				territoryScore: 0,
				peacekeepingScore: 0,
				difficultyMode: "TACTICAL",
				isFallTriggered: false,
				strategicObjectives: {
					siphonsDismantled: 0,
					villagesLiberated: 0,
					gasStockpilesCaptured: 0,
					healersProtected: 0,
					alliesRescued: 0,
				},
				spoilsOfWar: { creditsEarned: 0, clamsHarvested: 0, upgradesUnlocked: 0 },
				upgrades: {
					speedBoost: 0,
					healthBoost: 0,
					damageBoost: 0,
					weaponLvl: { "service-pistol": 1 },
				},
				isLZSecured: true,
				baseComponents: [],
				lastPlayerPosition: [0, 0, 0],
			};
			localStorage.setItem(key, JSON.stringify(state));
		});

		await page.reload();
		await waitForStable(page);

		// 1. Continue Campaign
		await page.locator('button:has-text("CONTINUE CAMPAIGN")').click();
		await page.waitForLoadState("networkidle");
		await waitForStable(page, 3000); // Extended wait for game world initialization

		const canvas = page.locator("canvas");
		if (await canvas.isVisible()) {
			// Look around to find entities
			// We injected them at specific local positions

			// Screenshot of the scene with injected entities
			await page.screenshot({
				path: path.join(SCREENSHOT_DIR, "01-combat-scene.png"),
				fullPage: true,
			});
			console.log("Captured Combat Scene");

			// Try to focus on a specific entity if possible
			// This is hard without real control, but let's take a few more screenshots
			// maybe the camera catches something.

			await page.mouse.move(400, 300); // Center
			await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02-combat-center.png") });

			// Test "The Fall" UI in a real scene
			await updateSaveData(page, { isFallTriggered: true });
			await page.reload();
			await page.waitForLoadState("networkidle");
			await waitForStable(page, 2000);
			await page.locator('button:has-text("CONTINUE CAMPAIGN")').click();
			await page.waitForLoadState("networkidle");
			await waitForStable(page, 2000);
			await page.screenshot({
				path: path.join(SCREENSHOT_DIR, "03-fall-warning-overlay.png"),
				fullPage: true,
			});
			console.log("Captured Fall Warning");
		} else {
			console.log("Canvas not visible - skipping 3D screenshots");
		}
	});
});
