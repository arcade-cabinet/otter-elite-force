import { expect, test } from "@playwright/test";

/**
 * Visual Regression Tests for OTTER: ELITE FORCE
 *
 * Uses Playwright's screenshot comparison to validate visual rendering
 * of 3D game components, UI elements, and gameplay scenarios.
 *
 * Run with: PLAYWRIGHT_MCP=true pnpm test:e2e:visual
 */

const VISUAL_THRESHOLD = 0.2; // 20% diff tolerance for WebGL rendering variations

test.describe("Visual Regression - Main Menu", () => {
	test("should match main menu screen", async ({ page }) => {
		await page.goto("/");

		// Wait for fonts and styles to load
		await page.waitForTimeout(2000);

		// Take snapshot of main menu
		await expect(page).toHaveScreenshot("main-menu.png", {
			maxDiffPixelRatio: VISUAL_THRESHOLD,
		});
	});

	test("should show character cards correctly", async ({ page }) => {
		await page.goto("/");
		await page.waitForTimeout(2000);

		const charCard = page.locator(".char-card.selected");
		await expect(charCard).toHaveScreenshot("selected-character-card.png", {
			maxDiffPixelRatio: VISUAL_THRESHOLD,
		});
	});

	test("should render rank and stats section", async ({ page }) => {
		await page.goto("/");
		await page.waitForTimeout(2000);

		const rankSection = page.locator(".platoon-info");
		if (await rankSection.isVisible()) {
			await expect(rankSection).toHaveScreenshot("rank-section.png", {
				maxDiffPixelRatio: VISUAL_THRESHOLD,
			});
		}
	});
});

test.describe("Visual Regression - Canteen Screen", () => {
	test("should match canteen screen", async ({ page }) => {
		await page.goto("/");
		await page.waitForTimeout(1000);

		// Navigate to canteen
		const canteenBtn = page.locator('button:has-text("VISIT CANTEEN")');
		await canteenBtn.click();

		await page.waitForTimeout(1500);

		await expect(page).toHaveScreenshot("canteen-screen.png", {
			maxDiffPixelRatio: VISUAL_THRESHOLD,
		});
	});
});

test.describe("Visual Regression - Cutscene", () => {
	test("should render cutscene correctly", async ({ page }) => {
		await page.goto("/");
		await page.waitForTimeout(1000);

		// Start campaign
		const startBtn = page.locator('button:has-text("START CAMPAIGN")');
		await startBtn.click();

		await page.waitForTimeout(2000);

		await expect(page).toHaveScreenshot("cutscene-screen.png", {
			maxDiffPixelRatio: VISUAL_THRESHOLD,
		});
	});

	test("should render dialogue box correctly", async ({ page }) => {
		await page.goto("/");
		await page.waitForTimeout(1000);

		const startBtn = page.locator('button:has-text("START CAMPAIGN")');
		await startBtn.click();

		await page.waitForTimeout(1500);

		const dialogueBox = page.locator(".dialogue-box");
		if (await dialogueBox.isVisible()) {
			await expect(dialogueBox).toHaveScreenshot("dialogue-box.png", {
				maxDiffPixelRatio: VISUAL_THRESHOLD,
			});
		}
	});
});

test.describe("Visual Regression - Responsive Design", () => {
	test("should render correctly on mobile viewport", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");
		await page.waitForTimeout(2000);

		await expect(page).toHaveScreenshot("mobile-menu.png", {
			maxDiffPixelRatio: VISUAL_THRESHOLD,
		});
	});

	test("should render correctly on tablet viewport", async ({ page }) => {
		await page.setViewportSize({ width: 768, height: 1024 });
		await page.goto("/");
		await page.waitForTimeout(2000);

		await expect(page).toHaveScreenshot("tablet-menu.png", {
			maxDiffPixelRatio: VISUAL_THRESHOLD,
		});
	});

	test("should render mobile canteen correctly", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");
		await page.waitForTimeout(1000);

		const canteenBtn = page.locator('button:has-text("VISIT CANTEEN")');
		await canteenBtn.click();
		await page.waitForTimeout(1500);

		await expect(page).toHaveScreenshot("mobile-canteen.png", {
			maxDiffPixelRatio: VISUAL_THRESHOLD,
		});
	});
});

test.describe("Visual Regression - UI Components", () => {
	test("should render action buttons correctly", async ({ page }) => {
		await page.goto("/");
		await page.waitForTimeout(2000);

		const actionButtons = page.locator(".menu-actions");
		if (await actionButtons.isVisible()) {
			await expect(actionButtons).toHaveScreenshot("action-buttons.png", {
				maxDiffPixelRatio: VISUAL_THRESHOLD,
			});
		}
	});

	test("should render title styling correctly", async ({ page }) => {
		await page.goto("/");
		await page.waitForTimeout(2000);

		const title = page.locator("h1");
		await expect(title).toHaveScreenshot("game-title.png", {
			maxDiffPixelRatio: VISUAL_THRESHOLD,
		});
	});
});
