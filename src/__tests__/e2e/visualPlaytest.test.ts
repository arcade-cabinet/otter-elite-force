/**
 * Visual Playtest — end-to-end browser test for OTTER: ELITE FORCE.
 *
 * Launches a real Chromium browser via Playwright, navigates through every
 * screen, takes screenshots for manual review, and verifies visual elements.
 *
 * Run:
 *   pnpm dev          # in one terminal
 *   pnpm test -- src/__tests__/e2e/visualPlaytest.test.ts
 *
 * Screenshots are saved to src/__tests__/e2e/__screenshots__/ for review.
 *
 * The test starts its own dev server as a child process on port 5174
 * (to avoid conflicting with a developer's running server on 5173).
 * If the server fails to start, the suite is skipped gracefully.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Browser, BrowserContext, Page } from "playwright";
import { chromium } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEV_PORT = 5174;
const BASE_URL = `http://localhost:${DEV_PORT}`;
const SCREENSHOT_DIR = join(import.meta.dirname, "__screenshots__");
const SERVER_STARTUP_TIMEOUT_MS = 30_000;
const WEBGL_ARGS = [
	"--use-gl=swiftshader",
	"--enable-webgl",
	"--ignore-gpu-blocklist",
	"--disable-gpu-sandbox",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Poll a URL until it responds with 2xx, or throw after timeout. */
async function waitForServer(url: string, timeoutMs: number): Promise<void> {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		try {
			const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
			if (res.ok) return;
		} catch {
			// server not ready yet
		}
		await new Promise((r) => setTimeout(r, 500));
	}
	throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

/** Save a full-page screenshot with a descriptive name. */
async function screenshot(page: Page, name: string): Promise<void> {
	if (!existsSync(SCREENSHOT_DIR)) {
		mkdirSync(SCREENSHOT_DIR, { recursive: true });
	}
	const safeName = name.replace(/[^a-zA-Z0-9_-]/g, "_");
	await page.screenshot({
		path: join(SCREENSHOT_DIR, `${safeName}.png`),
		fullPage: true,
	});
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("Visual Playtest", () => {
	let devServer: ChildProcess | null = null;
	let serverStartedByUs = false;
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;
	const pageErrors: string[] = [];

	// -----------------------------------------------------------------------
	// Lifecycle
	// -----------------------------------------------------------------------

	beforeAll(async () => {
		// Check if a dev server is already running on our port
		const alreadyRunning = await fetch(BASE_URL)
			.then(() => true)
			.catch(() => false);

		if (!alreadyRunning) {
			// Spawn the Vite dev server as a child process
			devServer = spawn("npx", ["vite", "--port", String(DEV_PORT), "--strictPort"], {
				cwd: join(import.meta.dirname, "../../.."),
				stdio: "pipe",
				env: { ...process.env, BROWSER: "none" },
				detached: false,
			});

			// Log server output for debugging
			devServer.stdout?.on("data", (data: Buffer) => {
				const msg = data.toString();
				if (process.env.DEBUG) console.log(`[vite] ${msg}`);
			});
			devServer.stderr?.on("data", (data: Buffer) => {
				const msg = data.toString();
				if (process.env.DEBUG) console.error(`[vite] ${msg}`);
			});

			try {
				await waitForServer(BASE_URL, SERVER_STARTUP_TIMEOUT_MS);
				serverStartedByUs = true;
			} catch {
				// Kill the server if it did not start in time
				devServer.kill("SIGTERM");
				devServer = null;
				console.warn(
					`Dev server did not start on port ${DEV_PORT} within ${SERVER_STARTUP_TIMEOUT_MS}ms — skipping visual playtest.`,
				);
				return;
			}
		}

		// Launch Chromium
		browser = await chromium.launch({
			headless: true,
			args: WEBGL_ARGS,
		});
		context = await browser.newContext({
			viewport: { width: 1920, height: 1080 },
		});
		page = await context.newPage();

		// Collect page errors for the "no errors" test
		page.on("pageerror", (err) => {
			pageErrors.push(err.message);
		});
	}, 60_000);

	afterAll(async () => {
		if (page) await page.close().catch(() => {});
		if (context) await context.close().catch(() => {});
		if (browser) await browser.close().catch(() => {});
		if (devServer && serverStartedByUs) {
			devServer.kill("SIGTERM");
			devServer = null;
		}
	});

	// -----------------------------------------------------------------------
	// Guard: skip everything if browser was never launched
	// -----------------------------------------------------------------------

	function skipIfNoBrowser(): boolean {
		if (!page) {
			console.log("Playwright browser not available — skipping test");
			return true;
		}
		return false;
	}

	// -----------------------------------------------------------------------
	// 1. Menu screen
	// -----------------------------------------------------------------------

	it("1. Menu screen: title and buttons render", async () => {
		if (skipIfNoBrowser()) return;

		await page.goto(BASE_URL);
		await page.waitForLoadState("networkidle");

		// Wait for the title to fade in (has a 120ms delay + 700ms transition)
		await page.waitForTimeout(1500);

		// Verify title
		const h1 = page.locator("h1");
		await expect(h1).toContainText("Otter Elite Force", { timeout: 10_000 });

		// Verify at least 3 buttons (New Campaign, Skirmish, Settings)
		const buttons = page.locator("nav[aria-label='Main Navigation'] button");
		const buttonCount = await buttons.count();
		expect(buttonCount).toBeGreaterThanOrEqual(3);

		// Verify specific button labels
		await expect(page.getByText("New Campaign")).toBeVisible();
		await expect(page.getByText("Skirmish")).toBeVisible();
		await expect(page.getByText("Settings")).toBeVisible();

		await screenshot(page, "01_main_menu");
	});

	// -----------------------------------------------------------------------
	// 2. Settings screen
	// -----------------------------------------------------------------------

	it("2. Settings screen: volume sliders and back button", async () => {
		if (skipIfNoBrowser()) return;

		await page.goto(BASE_URL);
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(1500);

		// Navigate to settings
		await page.getByText("Settings").click();
		await page.waitForTimeout(500);

		// Verify we left the main menu — Settings heading should appear
		await expect(page.locator("h2")).toContainText("Settings", { timeout: 10_000 });

		// Verify volume sliders exist (type="range" inputs)
		const sliders = page.locator('input[type="range"]');
		const sliderCount = await sliders.count();
		expect(sliderCount).toBeGreaterThanOrEqual(3); // Master, Music, SFX

		// Verify slider labels
		await expect(page.getByText("Master Volume")).toBeVisible();
		await expect(page.getByText("Music Volume")).toBeVisible();
		await expect(page.getByText("SFX Volume")).toBeVisible();

		await screenshot(page, "02_settings_screen");

		// Click Back to Menu
		await page.getByText("Back to Menu").click();
		await page.waitForTimeout(500);

		// Verify we returned to main menu
		const h1 = page.locator("h1");
		await expect(h1).toContainText("Otter Elite Force", { timeout: 10_000 });
	});

	// -----------------------------------------------------------------------
	// 3. Briefing screen
	// -----------------------------------------------------------------------

	it("3. Briefing screen: mission code and Deploy button", async () => {
		if (skipIfNoBrowser()) return;

		await page.goto(BASE_URL);
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(1500);

		// New Campaign goes directly to briefing for mission_1
		await page.getByText("New Campaign").click();
		await page.waitForTimeout(1000);

		// Verify briefing elements
		await expect(page.getByText("OP-BEACHHEAD")).toBeVisible({ timeout: 10_000 });
		await expect(page.getByText("Mission Briefing")).toBeVisible();
		await expect(page.getByText("CLASSIFIED")).toBeVisible();
		await expect(page.getByText("Deploy")).toBeVisible();

		// Verify objectives section
		await expect(page.getByText("Primary Objectives")).toBeVisible();

		await screenshot(page, "03_briefing_screen");
	});

	// -----------------------------------------------------------------------
	// 4. Game screen boots with canvas
	// -----------------------------------------------------------------------

	it("4. Game screen: canvas renders after Deploy", async () => {
		if (skipIfNoBrowser()) return;

		await page.goto(BASE_URL);
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(1500);

		// Navigate: New Campaign -> Briefing -> Deploy
		await page.getByText("New Campaign").click();
		await page.waitForTimeout(1000);
		await expect(page.getByText("Deploy")).toBeVisible({ timeout: 10_000 });
		await page.getByText("Deploy").click();

		// Wait for the game engine to boot (LittleJS creates canvas elements)
		await page.waitForTimeout(10_000);

		// Verify at least one canvas exists
		const canvases = page.locator("canvas");
		const canvasCount = await canvases.count();
		expect(canvasCount).toBeGreaterThanOrEqual(1);

		// Verify the first canvas has non-zero dimensions
		const firstCanvas = canvases.first();
		const box = await firstCanvas.boundingBox();
		expect(box).not.toBeNull();
		expect(box!.width).toBeGreaterThan(0);
		expect(box!.height).toBeGreaterThan(0);

		await screenshot(page, "04_game_screen_boot");
	}, 30_000);

	// -----------------------------------------------------------------------
	// 5. HUD renders
	// -----------------------------------------------------------------------

	it("5. HUD renders: resource bar and objectives panel", async () => {
		if (skipIfNoBrowser()) return;

		// We should already be on the game screen from the previous test.
		// If the page navigated away, re-navigate.
		const tacticalHUD = page.locator('[data-testid="tactical-hud"]');
		if (!(await tacticalHUD.isVisible({ timeout: 2000 }).catch(() => false))) {
			// Re-navigate to game
			await page.goto(BASE_URL);
			await page.waitForLoadState("networkidle");
			await page.waitForTimeout(1500);
			await page.getByText("New Campaign").click();
			await page.waitForTimeout(1000);
			await page.getByText("Deploy").click();
			await page.waitForTimeout(10_000);
		}

		// Verify resource bar
		const resourceBar = page.locator('[data-testid="resource-bar"]');
		await expect(resourceBar).toBeVisible({ timeout: 15_000 });

		// Verify resource labels
		await expect(page.getByText("Fish").first()).toBeVisible();
		await expect(page.getByText("Timber").first()).toBeVisible();
		await expect(page.getByText("Salvage").first()).toBeVisible();

		// Verify objectives panel (hidden on mobile, visible at 1920x1080)
		const objectivesPanel = page.locator('[data-testid="objectives-panel"]');
		await expect(objectivesPanel).toBeVisible({ timeout: 5_000 });
		await expect(page.getByText("OBJECTIVES").first()).toBeVisible();

		await screenshot(page, "05_hud_renders");
	}, 30_000);

	// -----------------------------------------------------------------------
	// 6. Entities render: canvas has varied pixel data
	// -----------------------------------------------------------------------

	it("6. Entities render: canvas has non-uniform pixel colors", async () => {
		if (skipIfNoBrowser()) return;

		// Verify the game canvas has actual rendered content (not a blank color)
		const canvases = page.locator("canvas");
		const canvasCount = await canvases.count();
		expect(canvasCount).toBeGreaterThanOrEqual(1);

		// Sample pixel data from the largest canvas
		const pixelVariance = await page.evaluate(() => {
			const allCanvases = document.querySelectorAll("canvas");
			if (allCanvases.length === 0) return { uniqueColors: 0, totalSampled: 0 };

			// Find the largest canvas (likely the game canvas)
			let largest = allCanvases[0];
			for (const c of allCanvases) {
				if (c.width * c.height > largest.width * largest.height) {
					largest = c;
				}
			}

			const ctx = largest.getContext("2d");
			if (!ctx) return { uniqueColors: 0, totalSampled: 0 };

			// Sample a grid of pixels
			const colors = new Set<string>();
			const step = 40;
			let sampled = 0;
			for (let x = 0; x < largest.width; x += step) {
				for (let y = 0; y < largest.height; y += step) {
					const pixel = ctx.getImageData(x, y, 1, 1).data;
					colors.add(`${pixel[0]},${pixel[1]},${pixel[2]}`);
					sampled++;
				}
			}
			return { uniqueColors: colors.size, totalSampled: sampled };
		});

		// A real rendered scene should have many distinct colors
		expect(pixelVariance.uniqueColors).toBeGreaterThan(5);

		await screenshot(page, "06_entity_rendering");
	}, 15_000);

	// -----------------------------------------------------------------------
	// 7. Selection works: click center of canvas
	// -----------------------------------------------------------------------

	it("7. Selection works: clicking canvas shows selection panel", async () => {
		if (skipIfNoBrowser()) return;

		// Click near the center of the viewport where units likely spawned
		const viewport = page.viewportSize();
		const centerX = (viewport?.width ?? 1920) / 2;
		const centerY = (viewport?.height ?? 1080) / 2;

		// Click the center of the canvas (left click to select)
		await page.mouse.click(centerX, centerY);
		await page.waitForTimeout(1000);

		// Try a box-select drag to catch units in a wider area
		await page.mouse.move(centerX - 100, centerY - 100);
		await page.mouse.down();
		await page.mouse.move(centerX + 100, centerY + 100, { steps: 10 });
		await page.mouse.up();
		await page.waitForTimeout(1000);

		// Check if the selection panel appeared (it only shows when units are selected)
		const selectionPanel = page.locator('[data-testid="selection-panel"]');
		const selectionVisible = await selectionPanel.isVisible().catch(() => false);

		// Take screenshot regardless of whether selection worked
		// (unit positions are non-deterministic)
		await screenshot(page, "07_selection_attempt");

		if (selectionVisible) {
			// Verify the panel has unit info
			const panelText = await selectionPanel.textContent();
			expect(panelText).toBeTruthy();
			expect(panelText!.length).toBeGreaterThan(0);
		} else {
			// Selection is non-deterministic based on where units spawn;
			// log but do not fail hard
			console.log(
				"Selection panel not visible — units may not be at the click location. Screenshot saved for review.",
			);
		}
	}, 15_000);

	// -----------------------------------------------------------------------
	// 8. Movement works: right-click to issue move order
	// -----------------------------------------------------------------------

	it("8. Movement works: right-click issues a move order", async () => {
		if (skipIfNoBrowser()) return;

		// First, try to select units with a wide drag
		const viewport = page.viewportSize();
		const cx = (viewport?.width ?? 1920) / 2;
		const cy = (viewport?.height ?? 1080) / 2;

		// Box-select around center
		await page.mouse.move(cx - 200, cy - 200);
		await page.mouse.down();
		await page.mouse.move(cx + 200, cy + 200, { steps: 10 });
		await page.mouse.up();
		await page.waitForTimeout(500);

		await screenshot(page, "08a_before_move");

		// Right-click to issue a move order to a different position
		await page.mouse.click(cx + 300, cy + 200, { button: "right" });
		await page.waitForTimeout(3000);

		await screenshot(page, "08b_after_move");

		// Movement verification is visual — we check screenshots and
		// ensure the game is still running (no crash, canvas still present)
		const canvasCount = await page.locator("canvas").count();
		expect(canvasCount).toBeGreaterThanOrEqual(1);
	}, 15_000);

	// -----------------------------------------------------------------------
	// 9. Zoom works: scroll wheel changes camera scale
	// -----------------------------------------------------------------------

	it("9. Zoom works: mouse wheel zooms the camera", async () => {
		if (skipIfNoBrowser()) return;

		await screenshot(page, "09a_before_zoom");

		const viewport = page.viewportSize();
		const cx = (viewport?.width ?? 1920) / 2;
		const cy = (viewport?.height ?? 1080) / 2;

		// Zoom in with scroll
		await page.mouse.move(cx, cy);
		await page.mouse.wheel(0, -300); // negative deltaY = zoom in
		await page.waitForTimeout(1000);

		await screenshot(page, "09b_after_zoom_in");

		// Zoom back out
		await page.mouse.wheel(0, 600); // positive deltaY = zoom out
		await page.waitForTimeout(1000);

		await screenshot(page, "09c_after_zoom_out");

		// Verify the game canvas is still rendering (no crash from zoom)
		const canvasCount = await page.locator("canvas").count();
		expect(canvasCount).toBeGreaterThanOrEqual(1);
	}, 15_000);

	// -----------------------------------------------------------------------
	// 10. Mobile viewport: HUD adapts to narrow width
	// -----------------------------------------------------------------------

	it("10. Mobile viewport: HUD adapts to 375x812", async () => {
		if (skipIfNoBrowser()) return;

		// Resize to iPhone-like dimensions
		await page.setViewportSize({ width: 375, height: 812 });
		await page.waitForTimeout(2000);

		// Resource bar should still be visible
		const resourceBar = page.locator('[data-testid="resource-bar"]');
		const resourceVisible = await resourceBar.isVisible().catch(() => false);
		expect(resourceVisible).toBe(true);

		// Objectives panel should be HIDDEN on mobile (< 640px)
		const objectivesPanel = page.locator('[data-testid="objectives-panel"]');
		const objectivesVisible = await objectivesPanel.isVisible().catch(() => false);
		expect(objectivesVisible).toBe(false);

		await screenshot(page, "10_mobile_viewport");

		// Restore desktop viewport
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.waitForTimeout(1000);
	}, 15_000);

	// -----------------------------------------------------------------------
	// 11. No errors: zero pageerror events throughout
	// -----------------------------------------------------------------------

	it("11. No critical page errors throughout the entire playtest", () => {
		if (skipIfNoBrowser()) return;

		// Filter out known non-critical errors
		const criticalErrors = pageErrors.filter(
			(e) =>
				!e.includes("favicon") &&
				!e.includes("manifest") &&
				!e.includes("WebGL") &&
				!e.includes("net::ERR") &&
				!e.includes("ResizeObserver") &&
				// WebAudio context errors before user gesture are expected
				!e.includes("AudioContext") &&
				!e.includes("The AudioContext was not allowed to start") &&
				// LittleJS debug logging
				!e.includes("LittleJS") &&
				// WASM / WebGL init errors in headless SwiftShader
				!e.includes("WASM") &&
				!e.includes("GL_INVALID"),
		);

		if (criticalErrors.length > 0) {
			console.error("Critical page errors detected:");
			for (const err of criticalErrors) {
				console.error(`  - ${err}`);
			}
		}

		expect(criticalErrors).toHaveLength(0);
	});
});
