import * as fs from "node:fs";
import * as path from "node:path";
import { type Page, test } from "@playwright/test";

const SCREENSHOT_DIR = "visual-audit-results";

test.beforeAll(async () => {
	if (!fs.existsSync(SCREENSHOT_DIR)) {
		fs.mkdirSync(SCREENSHOT_DIR);
	}
});

const waitForStable = async (page: Page, ms = 2000) => {
	await page.waitForTimeout(ms);
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

		// 3. Start New Game -> Cutscene
		await page.locator('button:has-text("NEW GAME")').click();
		await waitForStable(page, 3000);
		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, "03-cutscene-start.png"),
			fullPage: true,
		});
		console.log("Captured Cutscene Start");

		// Click through dialogue
		const nextBtn = page.locator("button.dialogue-next");
		if (await nextBtn.isVisible()) {
			await nextBtn.click();
			await waitForStable(page, 1000);
			await page.screenshot({
				path: path.join(SCREENSHOT_DIR, "04-cutscene-line-2.png"),
				fullPage: true,
			});

			while (await nextBtn.innerText().then((text) => text.includes("NEXT"))) {
				await nextBtn.click();
				await waitForStable(page, 500);
			}
			await nextBtn.click(); // BEGIN MISSION
		}
		console.log("Passed through Cutscene");

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
		await waitForStable(page);
		await page.locator('button:has-text("VISIT CANTEEN")').click();
		await waitForStable(page, 3000);
		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, "08-canteen-platoon.png"),
			fullPage: true,
		});
		console.log("Captured Canteen Platoon");

		// 8. Canteen Upgrades
		await page.locator('button:has-text("UPGRADES")').click();
		await waitForStable(page, 1000);
		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, "09-canteen-upgrades.png"),
			fullPage: true,
		});
		console.log("Captured Canteen Upgrades");
	});
});
