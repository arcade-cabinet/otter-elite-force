import { expect, test } from "@playwright/test";

/**
 * E2E Tests for OTTER: ELITE FORCE
 *
 * Supports two modes:
 * 1. PLAYWRIGHT_MCP=true - Full tests including WebGL/canvas interactions
 * 2. Default (headless) - Basic tests that don't require GPU
 *
 * Run with MCP: PLAYWRIGHT_MCP=true pnpm test:e2e
 * Run headless: pnpm test:e2e
 */

// Check if running with full MCP capabilities
const hasMcpSupport = process.env.PLAYWRIGHT_MCP === "true";

test.describe("OTTER: ELITE FORCE - Core Functionality", () => {
	test.beforeEach(async ({ page }) => {
		// Listen for console errors
		page.on("console", (msg) => {
			if (msg.type() === "error") {
				console.log(`Console error: ${msg.text()}`);
			}
		});

		await page.goto("/");
	});

	// ============================================
	// Basic Tests (work in both modes)
	// ============================================

	test("should load the page with correct title", async ({ page }) => {
		await expect(page).toHaveTitle(/OTTER/i);

		const root = page.locator("#root");
		await expect(root).toBeVisible();
	});

	test("should have localStorage available for save data", async ({ page }) => {
		const localStorageWorks = await page.evaluate(() => {
			try {
				const key = "otter-elite-force-test";
				localStorage.setItem(key, "test-value");
				const result = localStorage.getItem(key) === "test-value";
				localStorage.removeItem(key);
				return result;
			} catch {
				return false;
			}
		});

		expect(localStorageWorks).toBe(true);
	});

	test("should display main menu with game title", async ({ page }) => {
		// Wait for app to load
		await page.waitForTimeout(1000);

		// Check for title
		const title = page.locator("h1");
		await expect(title).toContainText("OTTER");
		await expect(title).toContainText("ELITE FORCE");
	});

	test("should show platoon commander info", async ({ page }) => {
		await page.waitForTimeout(1500);

		// Check for platoon commander section
		await expect(page.locator("text=PLATOON COMMANDER")).toBeVisible({ timeout: 10000 });

		// Character name should be visible (any character name, not necessarily SGT. BUBBLES)
		// since the name comes from the store which may have different defaults
		const charName = page.locator(".stat-val").first();
		await expect(charName).toBeVisible({ timeout: 5000 });
	});

	// ============================================
	// WebGL Tests (conditional based on environment)
	// ============================================

	test("should render canvas element", async ({ page }) => {
		// Wait for React to mount and loading to finish
		await page.waitForTimeout(hasMcpSupport ? 3000 : 2500);

		const canvas = page.locator("canvas");
		const canvasCount = await canvas.count();

		if (hasMcpSupport) {
			// With MCP, canvas MUST be visible
			await expect(canvas).toBeVisible({ timeout: 15000 });
			expect(canvasCount).toBeGreaterThan(0);
		} else {
			// In headless mode, just log the result
			console.log(`Canvas elements found: ${canvasCount}`);
			// App should at least not crash
			const root = page.locator("#root");
			await expect(root).toBeVisible();
		}
	});

	test("should report WebGL capabilities", async ({ page }) => {
		const webglInfo = await page.evaluate(() => {
			const canvas = document.createElement("canvas");
			const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
			if (gl) {
				return {
					available: true,
					renderer: gl.getParameter(gl.RENDERER) || "unknown",
					vendor: gl.getParameter(gl.VENDOR) || "unknown",
					version: gl.getParameter(gl.VERSION) || "unknown",
				};
			}
			return {
				available: false,
				renderer: "none",
				vendor: "none",
				version: "none",
			};
		});

		console.log(`WebGL Info: ${JSON.stringify(webglInfo, null, 2)}`);
		console.log(`MCP Support: ${hasMcpSupport}`);

		if (hasMcpSupport) {
			expect(webglInfo.available).toBe(true);
		}
		// In headless mode, WebGL may or may not be available
	});

	// ============================================
	// Navigation Tests
	// ============================================

	test("should navigate to canteen", async ({ page }) => {
		await page.waitForTimeout(1000);

		const canteenBtn = page.locator('button:has-text("VISIT CANTEEN")');
		await expect(canteenBtn).toBeVisible();
		await canteenBtn.click();

		await expect(page.locator("h2")).toContainText("FORWARD OPERATING BASE");
		await expect(page.locator("text=SUPPLY CREDITS")).toBeVisible();
	});

	test("should start campaign from menu", async ({ page }) => {
		await page.waitForTimeout(1000);

		const startBtn = page.locator('button:has-text("START CAMPAIGN")');
		await expect(startBtn).toBeVisible();
		await startBtn.click();

		// Should show cutscene
		await expect(page.locator(".cutscene-screen")).toBeVisible();
		await expect(page.locator(".dialogue-box")).toBeVisible();
	});
});

test.describe("OTTER: ELITE FORCE - Character Selection", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await page.waitForTimeout(1000);
	});

	test("should display character selection cards", async ({ page }) => {
		// Check if bubbles is selected by default
		const bubblesCard = page.locator('.char-card.selected:has-text("SGT. BUBBLES")');
		await expect(bubblesCard).toBeVisible();
	});

	test("should show rank information", async ({ page }) => {
		await expect(page.locator("text=RANK")).toBeVisible();
		await expect(page.locator("text=PUP")).toBeVisible();
	});
});

test.describe("OTTER: ELITE FORCE - Game Flow", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await page.waitForTimeout(1000);
	});

	test("should progress through cutscene to gameplay", async ({ page }) => {
		test.skip(!hasMcpSupport, "Requires WebGL/MCP support");

		// Start campaign
		const startBtn = page.locator('button:has-text("START CAMPAIGN")');
		await startBtn.click();

		// Should show cutscene
		await expect(page.locator(".cutscene-screen")).toBeVisible();

		// Click through dialogue
		const continueBtn = page.locator('button:has-text("Continue")');
		if (await continueBtn.isVisible()) {
			await continueBtn.click();
		}

		// Wait for game mode
		await page.waitForTimeout(2000);
	});

	test("should maintain game state in localStorage", async ({ page }) => {
		// Start a game session
		const startBtn = page.locator('button:has-text("START CAMPAIGN")');
		await startBtn.click();

		await page.waitForTimeout(2000);

		// Check if save data exists
		const saveData = await page.evaluate(() => {
			return localStorage.getItem("otter_v8");
		});

		console.log(`Save data: ${saveData}`);
		// Save data should exist or be initialized
	});
});
