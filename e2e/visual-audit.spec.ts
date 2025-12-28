import * as fs from "node:fs";
import * as path from "node:path";
import { expect, type Page, test } from "@playwright/test";

const SCREENSHOT_DIR = "visual-audit-results";

// Increased timeout for visual audit tests (they capture many screenshots)
test.setTimeout(120000);

test.beforeAll(async () => {
	if (!fs.existsSync(SCREENSHOT_DIR)) {
		fs.mkdirSync(SCREENSHOT_DIR);
	}
});

// Deterministic wait using networkidle + optional additional delay
const waitForStable = async (page: Page, ms = 1000) => {
	await page.waitForLoadState("networkidle");
	if (ms > 0) {
		await page.waitForTimeout(ms);
	}
};

test.describe("Visual Audit - Screenshot Generation", () => {
	test("capture key game states for visual analysis", async ({ page }) => {
		// 1. Main Menu
		await page.goto("/");
		await waitForStable(page);
		await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01-main-menu.png"), fullPage: true });
		console.log("Captured Main Menu");

		// 2. Character Selection Focus
		const bubblesCard = page.locator('.char-card:has-text("SGT. BUBBLES")');
		await bubblesCard.scrollIntoViewIfNeeded();
		await bubblesCard.screenshot({ path: path.join(SCREENSHOT_DIR, "02-character-card.png") });
		console.log("Captured Character Card");

		// 3. Start New Game -> Cutscene - wait for visibility first
		const newGameBtn = page.locator('button:has-text("NEW GAME")');
		await expect(newGameBtn).toBeVisible({ timeout: 10000 });
		await newGameBtn.click();
		await waitForStable(page, 4000);
		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, "03-cutscene-start.png"),
			fullPage: true,
		});
		console.log("Captured Cutscene Start");

		// Click through dialogue - use proper waiting
		const nextBtn = page.locator("button.dialogue-next");
		try {
			await nextBtn.waitFor({ state: "visible", timeout: 10000 });
			await nextBtn.click();
			await waitForStable(page, 500);
			await page.screenshot({
				path: path.join(SCREENSHOT_DIR, "04-cutscene-line-2.png"),
				fullPage: true,
			});

			// Click through all NEXT >> buttons until BEGIN MISSION
			let buttonText = await nextBtn.innerText();
			let clickCount = 0;
			while (buttonText.includes("NEXT") && clickCount < 20) {
				await nextBtn.click();
				await page.waitForTimeout(500);
				buttonText = await nextBtn.innerText();
				clickCount++;
			}
			// Use force:true to avoid animation instability
			const beginMissionBtn = page.locator('button.dialogue-next:has-text("BEGIN MISSION")');
			await expect(beginMissionBtn).toBeVisible({ timeout: 5000 });
			await beginMissionBtn.click({ force: true }); // BEGIN MISSION
			console.log("Passed through Cutscene");
		} catch {
			console.log("Cutscene button not found - skipping cutscene flow");
		}

		// 4. Gameplay - Starting Area
		await waitForStable(page, 5000);
		// Check if WebGL is working by looking for canvas
		const canvas = page.locator("canvas");
		if (await canvas.isVisible()) {
			await page.screenshot({
				path: path.join(SCREENSHOT_DIR, "05-gameplay-start.png"),
				fullPage: true,
			});
			console.log("Captured Gameplay Start");

			// 5. HUD Elements
			const hud = page.locator(".hud-container");
			if (await hud.isVisible()) {
				await hud.screenshot({ path: path.join(SCREENSHOT_DIR, "06-hud-overlay.png") });
				console.log("Captured HUD");
			}

			// 6. Action Buttons
			const actionCluster = page.locator(".action-cluster");
			if (await actionCluster.isVisible()) {
				await actionCluster.screenshot({
					path: path.join(SCREENSHOT_DIR, "07-action-buttons.png"),
				});
				console.log("Captured Action Buttons");
			}
		} else {
			console.log("Canvas not visible - skipping 3D screenshots");
		}

		// 7. Canteen
		await page.goto("/");
		await page.waitForLoadState("networkidle");
		await waitForStable(page, 2000);

		const canteenBtn = page.locator('button:has-text("VISIT CANTEEN")');
		await expect(canteenBtn).toBeVisible({ timeout: 10000 });
		await canteenBtn.click();
		await waitForStable(page, 4000);
		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, "08-canteen-platoon.png"),
			fullPage: true,
		});
		console.log("Captured Canteen Platoon");

		// 8. Canteen Upgrades
		const upgradesTab = page.locator('button:has-text("UPGRADES")');
		await expect(upgradesTab).toBeVisible({ timeout: 10000 });
		await upgradesTab.click();
		await waitForStable(page, 2000);
		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, "09-canteen-upgrades.png"),
			fullPage: true,
		});
		console.log("Captured Canteen Upgrades");
	});
});
