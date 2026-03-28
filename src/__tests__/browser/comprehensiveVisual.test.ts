/**
 * Comprehensive Visual & Interaction Tests — Vitest Browser Mode
 *
 * Runs in real Chromium via @vitest/browser-playwright. Tests the full
 * SolidJS app lifecycle: main menu, settings, briefing, game deployment,
 * HUD elements, player interactions, and mobile responsive behavior.
 *
 * Run: pnpm test:browser
 */

import { page } from "@vitest/browser/context";
import { beforeEach, describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Navigate to the app root and wait for the main menu to load.
 * Vitest browser mode serves the app via Vite, so we use "/" as root.
 */
async function navigateToApp() {
	await page.goto("/");
	// Clear state for a fresh session
	await page.evaluate(() => localStorage.clear());
	await page.goto("/");
}

/**
 * Wait for an element matching the selector to appear.
 * Polls at intervals until timeout.
 */
async function waitForSelector(selector: string, timeoutMs = 10000): Promise<HTMLElement | null> {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		const el = document.querySelector(selector);
		if (el) return el as HTMLElement;
		await new Promise((r) => setTimeout(r, 200));
	}
	return null;
}

/**
 * Wait for text content to appear anywhere in the document.
 */
async function waitForText(text: string, timeoutMs = 10000): Promise<boolean> {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		if (document.body?.innerText?.includes(text)) return true;
		await new Promise((r) => setTimeout(r, 200));
	}
	return false;
}

/**
 * Click a button by its text content.
 */
async function clickButtonByText(text: string): Promise<boolean> {
	const buttons = Array.from(document.querySelectorAll("button"));
	for (const btn of buttons) {
		if (btn.textContent?.toLowerCase().includes(text.toLowerCase())) {
			btn.click();
			return true;
		}
	}
	return false;
}

/**
 * Wait a fixed duration (milliseconds).
 */
function wait(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// SECTION 1: MAIN MENU
// ---------------------------------------------------------------------------

describe("Main Menu: Visual Elements", () => {
	beforeEach(async () => {
		await navigateToApp();
		// Wait for SolidJS to hydrate / render the menu
		const found = await waitForText("Otter Elite Force", 12000);
		expect(found).toBe(true);
	});

	it("renders the OTTER ELITE FORCE title in h1", async () => {
		const h1 = document.querySelector("h1");
		expect(h1).toBeTruthy();
		expect(h1!.textContent).toContain("Otter Elite Force");
	});

	it("renders the COPPER-SILT REACH subtitle badge", async () => {
		const found = await waitForText("Copper-Silt Reach");
		expect(found).toBe(true);
	});

	it("renders the campaign tagline", async () => {
		const found = await waitForText("Campaign-first river-jungle warfare");
		expect(found).toBe(true);
	});

	it("renders New Campaign, Skirmish, and Settings buttons", async () => {
		const buttons = Array.from(document.querySelectorAll("button"));
		const labels = buttons.map((b) => b.textContent?.toLowerCase() ?? "");

		expect(labels.some((l) => l.includes("new campaign"))).toBe(true);
		expect(labels.some((l) => l.includes("skirmish"))).toBe(true);
		expect(labels.some((l) => l.includes("settings"))).toBe(true);
	});

	it("renders button subtitles with descriptions", async () => {
		expect(await waitForText("Begin a new operation")).toBe(true);
		expect(await waitForText("Single-player battle")).toBe(true);
		expect(await waitForText("Audio / controls / readability")).toBe(true);
	});

	it("renders version info in footer", async () => {
		expect(await waitForText("v0.2.0-alpha")).toBe(true);
	});

	it("has proper aria landmarks (main + nav)", async () => {
		const main = document.querySelector('main[aria-label="Main Menu"]');
		expect(main).toBeTruthy();

		const nav = document.querySelector('nav[aria-label="Main Navigation"]');
		expect(nav).toBeTruthy();
	});
});

// ---------------------------------------------------------------------------
// SECTION 2: MENU NAVIGATION
// ---------------------------------------------------------------------------

describe("Main Menu: Navigation", () => {
	beforeEach(async () => {
		await navigateToApp();
		await waitForText("Otter Elite Force", 12000);
	});

	it("New Campaign navigates to briefing screen", async () => {
		await clickButtonByText("New Campaign");
		const found = await waitForText("Mission Briefing", 10000);
		expect(found).toBe(true);
	});

	it("Settings navigates to settings screen", async () => {
		await clickButtonByText("Settings");
		const found = await waitForText("Settings", 5000);
		expect(found).toBe(true);
		// Should see volume controls
		const masterVol = await waitForText("Master Volume", 3000);
		expect(masterVol).toBe(true);
	});

	it("Skirmish navigates away from main menu", async () => {
		await clickButtonByText("Skirmish");
		await wait(1000);
		// Should no longer show the main title as a heading
		const h1 = document.querySelector("h1");
		const isMainMenu = h1?.textContent?.includes("Otter Elite Force");
		expect(isMainMenu).toBeFalsy();
	});
});

// ---------------------------------------------------------------------------
// SECTION 3: SETTINGS SCREEN
// ---------------------------------------------------------------------------

describe("Settings Screen", () => {
	beforeEach(async () => {
		await navigateToApp();
		await waitForText("Otter Elite Force", 12000);
		await clickButtonByText("Settings");
		await waitForText("Master Volume", 5000);
	});

	it("renders Settings heading", async () => {
		const headings = Array.from(document.querySelectorAll("h2"));
		const settingsHeading = headings.find((h) => h.textContent?.includes("Settings"));
		expect(settingsHeading).toBeTruthy();
	});

	it("renders Field Controls badge", async () => {
		expect(await waitForText("Field Controls")).toBe(true);
	});

	it("has 3 volume sliders (Master, Music, SFX)", async () => {
		expect(await waitForText("Master Volume")).toBe(true);
		expect(await waitForText("Music Volume")).toBe(true);
		expect(await waitForText("SFX Volume")).toBe(true);

		const sliders = document.querySelectorAll('input[type="range"]');
		expect(sliders.length).toBeGreaterThanOrEqual(3);
	});

	it("has visual toggles (Show Grid Overlay, Reduce FX)", async () => {
		expect(await waitForText("Show Grid Overlay")).toBe(true);
		expect(await waitForText("Reduce FX")).toBe(true);
	});

	it("has accessibility toggles (Subtitles, Reduce Motion)", async () => {
		expect(await waitForText("Subtitles")).toBe(true);
		expect(await waitForText("Reduce Motion")).toBe(true);
	});

	it("toggles display ON or OFF text", async () => {
		const bodyText = document.body.innerText;
		// At least one toggle should show ON or OFF
		expect(bodyText.includes("ON") || bodyText.includes("OFF")).toBe(true);
	});

	it("has Operator Notes section", async () => {
		expect(await waitForText("Operator Notes")).toBe(true);
	});

	it("has section headers for Audio, Visual, Accessibility", async () => {
		expect(await waitForText("Audio")).toBe(true);
		expect(await waitForText("Visual")).toBe(true);
		expect(await waitForText("Accessibility")).toBe(true);
	});

	it("Back to Menu button returns to main menu", async () => {
		await clickButtonByText("Back to Menu");
		const found = await waitForText("Otter Elite Force", 5000);
		expect(found).toBe(true);
	});

	it("toggle click changes ON/OFF state", async () => {
		// Find Reduce Motion button and click it
		const buttons = Array.from(document.querySelectorAll("button"));
		const reduceMotion = buttons.find((b) => b.textContent?.includes("Reduce Motion"));
		expect(reduceMotion).toBeTruthy();

		const beforeText = reduceMotion!.textContent ?? "";
		reduceMotion!.click();
		await wait(300);
		const afterText = reduceMotion!.textContent ?? "";

		// State should have toggled
		if (beforeText.includes("OFF")) {
			expect(afterText).toContain("ON");
		} else {
			expect(afterText).toContain("OFF");
		}
	});
});

// ---------------------------------------------------------------------------
// SECTION 4: BRIEFING SCREEN
// ---------------------------------------------------------------------------

describe("Briefing Screen", () => {
	beforeEach(async () => {
		await navigateToApp();
		await waitForText("Otter Elite Force", 12000);
		await clickButtonByText("New Campaign");
		await waitForText("Mission Briefing", 10000);
	});

	it("renders Mission Briefing badge", async () => {
		expect(await waitForText("Mission Briefing")).toBe(true);
	});

	it("renders OP-BEACHHEAD mission code", async () => {
		expect(await waitForText("OP-BEACHHEAD")).toBe(true);
	});

	it("renders CLASSIFIED stamp", async () => {
		expect(await waitForText("CLASSIFIED")).toBe(true);
	});

	it("renders Field Operations Dossier subtitle", async () => {
		expect(await waitForText("Field Operations Dossier")).toBe(true);
	});

	it("renders Beachhead mission heading", async () => {
		const headings = Array.from(document.querySelectorAll("h2"));
		const beachhead = headings.find((h) => h.textContent?.includes("Beachhead"));
		expect(beachhead).toBeTruthy();
	});

	it("renders FOXHOUND speaker in briefing lines", async () => {
		const foxhound = document.body.innerText.match(/FOXHOUND/g);
		expect(foxhound).toBeTruthy();
		expect(foxhound!.length).toBeGreaterThanOrEqual(1);
	});

	it("renders Primary Objectives section with items", async () => {
		expect(await waitForText("Primary Objectives")).toBe(true);
		const manila = document.querySelector(".briefing-manila-paper");
		expect(manila).toBeTruthy();
		const items = manila!.querySelectorAll("ul li");
		expect(items.length).toBeGreaterThanOrEqual(1);
	});

	it("renders CDR. LUTRA authorization", async () => {
		expect(await waitForText("CDR. LUTRA")).toBe(true);
		expect(await waitForText("Authorized by")).toBe(true);
	});

	it("renders pawprint seal SVG", async () => {
		const manila = document.querySelector(".briefing-manila-paper");
		expect(manila).toBeTruthy();
		const svgs = manila!.querySelectorAll("svg");
		expect(svgs.length).toBeGreaterThanOrEqual(1);
	});

	it("renders Deploy button", async () => {
		const buttons = Array.from(document.querySelectorAll("button"));
		const deploy = buttons.find((b) => b.textContent?.toLowerCase().includes("deploy"));
		expect(deploy).toBeTruthy();
	});

	it("renders Back button", async () => {
		const buttons = Array.from(document.querySelectorAll("button"));
		const back = buttons.find((b) => b.textContent?.toLowerCase().includes("back"));
		expect(back).toBeTruthy();
	});

	it("manila paper container has briefing content", async () => {
		const manila = document.querySelector(".briefing-manila-paper");
		expect(manila).toBeTruthy();
		const text = manila!.textContent ?? "";
		expect(text.length).toBeGreaterThan(100);
	});

	it("Back button returns from briefing", async () => {
		await clickButtonByText("Back");
		await wait(1000);
		// Should navigate away from briefing
		const stillBriefing = document.body.innerText.includes("Mission Briefing");
		expect(stillBriefing).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// SECTION 5: GAME SCREEN (Deploy & HUD)
// ---------------------------------------------------------------------------

describe("Game Screen: Canvas & HUD", { timeout: 60000 }, () => {
	beforeEach(async () => {
		await navigateToApp();
		await waitForText("Otter Elite Force", 12000);
		await clickButtonByText("New Campaign");
		await waitForText("Mission Briefing", 10000);
		await clickButtonByText("Deploy");
		// Wait for HUD to appear
		const hudEl = await waitForSelector("[data-testid='runtime-hud-resources']", 15000);
		expect(hudEl).toBeTruthy();
		await wait(2000);
	});

	it("canvas element exists with nonzero dimensions", async () => {
		const canvas = document.querySelector("canvas");
		expect(canvas).toBeTruthy();
		expect(canvas!.width).toBeGreaterThan(0);
		expect(canvas!.height).toBeGreaterThan(0);
	});

	it("resource bar shows Fish, Timber, Salvage", async () => {
		const hud = document.querySelector("[data-testid='runtime-hud-resources']");
		expect(hud).toBeTruthy();
		const text = hud!.textContent ?? "";
		expect(text).toMatch(/Fish\s+\d+/i);
		expect(text).toMatch(/Timber\s+\d+/i);
		expect(text).toMatch(/Salvage\s+\d+/i);
	});

	it("resource bar shows population counter", async () => {
		const hud = document.querySelector("[data-testid='runtime-hud-resources']");
		expect(hud).toBeTruthy();
		const text = hud!.textContent ?? "";
		expect(text).toMatch(/Pop\s+\d+\/\d+/i);
	});

	it("runtime host container exists", async () => {
		const container = document.querySelector("[data-testid='runtime-host-container']");
		expect(container).toBeTruthy();
	});

	it("recenter button (H) is present", async () => {
		const btn = document.querySelector("[data-testid='runtime-btn-recenter']");
		expect(btn).toBeTruthy();
		expect(btn!.textContent).toContain("H");
	});

	it("zoom buttons (+/-) are present", async () => {
		const buttons = Array.from(document.querySelectorAll("button"));
		const zoomIn = buttons.find((b) => b.title === "Zoom in");
		const zoomOut = buttons.find((b) => b.title === "Zoom out");
		expect(zoomIn).toBeTruthy();
		expect(zoomOut).toBeTruthy();
	});

	it("objectives panel exists on desktop viewport", async () => {
		const panel = document.querySelector("[data-testid='runtime-hud-objectives']");
		expect(panel).toBeTruthy();
		const text = panel!.textContent ?? "";
		expect(text).toContain("Objectives");
	});

	it("mission title is rendered in top bar", async () => {
		const stencil = document.querySelector(".font-stencil");
		expect(stencil).toBeTruthy();
		expect(stencil!.textContent!.length).toBeGreaterThan(0);
	});
});

// ---------------------------------------------------------------------------
// SECTION 6: GAME SCREEN — ECONOMY
// ---------------------------------------------------------------------------

describe("Game Screen: Economy", { timeout: 45000 }, () => {
	it("resources change after 15 seconds (economy ticking)", async () => {
		await navigateToApp();
		await waitForText("Otter Elite Force", 12000);
		await clickButtonByText("New Campaign");
		await waitForText("Mission Briefing", 10000);
		await clickButtonByText("Deploy");
		await waitForSelector("[data-testid='runtime-hud-resources']", 15000);
		await wait(2000);

		// Read initial
		const hud = document.querySelector("[data-testid='runtime-hud-resources']");
		expect(hud).toBeTruthy();
		const initialText = hud!.textContent ?? "";
		const initialFish = initialText.match(/Fish\s+(\d+)/i);

		// Wait 15 seconds
		await wait(15000);

		// Read again
		const laterText =
			document.querySelector("[data-testid='runtime-hud-resources']")?.textContent ?? "";
		const laterFish = laterText.match(/Fish\s+(\d+)/i);
		const laterTimber = laterText.match(/Timber\s+(\d+)/i);

		// At least something should have changed
		const fishChanged = initialFish && laterFish && Number(initialFish[1]) !== Number(laterFish[1]);
		const timberChanged = laterTimber && Number(laterTimber[1]) > 0;

		// Economy should be running
		expect(fishChanged || timberChanged).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// SECTION 7: GAME SCREEN — INTERACTIONS
// ---------------------------------------------------------------------------

describe("Game Screen: Interactions", { timeout: 60000 }, () => {
	beforeEach(async () => {
		await navigateToApp();
		await waitForText("Otter Elite Force", 12000);
		await clickButtonByText("New Campaign");
		await waitForText("Mission Briefing", 10000);
		await clickButtonByText("Deploy");
		await waitForSelector("[data-testid='runtime-hud-resources']", 15000);
		await wait(3000);
	});

	it("clicking canvas does not crash the game", async () => {
		const canvas = document.querySelector("canvas");
		expect(canvas).toBeTruthy();

		// Dispatch a click event on the canvas
		canvas!.dispatchEvent(
			new MouseEvent("mousedown", {
				clientX: canvas!.width / 2,
				clientY: canvas!.height / 2,
				bubbles: true,
			}),
		);
		canvas!.dispatchEvent(
			new MouseEvent("mouseup", {
				clientX: canvas!.width / 2,
				clientY: canvas!.height / 2,
				bubbles: true,
			}),
		);
		await wait(500);

		// Game should still be running
		const hud = document.querySelector("[data-testid='runtime-hud-resources']");
		expect(hud).toBeTruthy();
	});

	it("right-click on canvas does not crash", async () => {
		const canvas = document.querySelector("canvas");
		expect(canvas).toBeTruthy();

		canvas!.dispatchEvent(
			new MouseEvent("contextmenu", {
				clientX: canvas!.width / 2 + 100,
				clientY: canvas!.height / 2 - 100,
				button: 2,
				bubbles: true,
			}),
		);
		await wait(500);

		const hud = document.querySelector("[data-testid='runtime-hud-resources']");
		expect(hud).toBeTruthy();
	});

	it("Escape key does not crash the game", async () => {
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
		await wait(500);

		const hud = document.querySelector("[data-testid='runtime-hud-resources']");
		expect(hud).toBeTruthy();
	});

	it("B key does not crash the game (build mode)", async () => {
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "b", bubbles: true }));
		await wait(1000);

		const hud = document.querySelector("[data-testid='runtime-hud-resources']");
		expect(hud).toBeTruthy();

		// Cancel
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
		await wait(300);
	});

	it("arrow keys do not crash the game (camera pan)", async () => {
		for (const key of ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]) {
			document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
			await wait(100);
			document.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }));
			await wait(100);
		}

		const hud = document.querySelector("[data-testid='runtime-hud-resources']");
		expect(hud).toBeTruthy();
	});

	it("zoom buttons work without crash", async () => {
		const buttons = Array.from(document.querySelectorAll("button"));
		const zoomIn = buttons.find((b) => b.title === "Zoom in");
		const zoomOut = buttons.find((b) => b.title === "Zoom out");

		if (zoomIn) {
			zoomIn.click();
			await wait(300);
		}
		if (zoomOut) {
			zoomOut.click();
			await wait(300);
		}

		const hud = document.querySelector("[data-testid='runtime-hud-resources']");
		expect(hud).toBeTruthy();
	});

	it("recenter button works without crash", async () => {
		const btn = document.querySelector("[data-testid='runtime-btn-recenter']");
		if (btn instanceof HTMLElement) {
			btn.click();
			await wait(500);
		}

		const hud = document.querySelector("[data-testid='runtime-hud-resources']");
		expect(hud).toBeTruthy();
	});

	it("scroll wheel events do not crash the game", async () => {
		const canvas = document.querySelector("canvas");
		expect(canvas).toBeTruthy();

		canvas!.dispatchEvent(
			new WheelEvent("wheel", {
				deltaY: -300,
				clientX: canvas!.width / 2,
				clientY: canvas!.height / 2,
				bubbles: true,
			}),
		);
		await wait(300);

		canvas!.dispatchEvent(
			new WheelEvent("wheel", {
				deltaY: 300,
				clientX: canvas!.width / 2,
				clientY: canvas!.height / 2,
				bubbles: true,
			}),
		);
		await wait(300);

		const hud = document.querySelector("[data-testid='runtime-hud-resources']");
		expect(hud).toBeTruthy();
	});
});

// ---------------------------------------------------------------------------
// SECTION 8: VISUAL QUALITY
// ---------------------------------------------------------------------------

describe("Game Screen: Visual Quality", { timeout: 60000 }, () => {
	it("canvas is rendered (not blank or zero-sized)", async () => {
		await navigateToApp();
		await waitForText("Otter Elite Force", 12000);
		await clickButtonByText("New Campaign");
		await waitForText("Mission Briefing", 10000);
		await clickButtonByText("Deploy");
		await waitForSelector("[data-testid='runtime-hud-resources']", 15000);
		await wait(3000);

		const canvas = document.querySelector("canvas");
		expect(canvas).toBeTruthy();
		expect(canvas!.width).toBeGreaterThan(100);
		expect(canvas!.height).toBeGreaterThan(100);

		// For WebGL canvas, we cannot easily sample pixels with getContext("2d").
		// But we can verify the canvas is properly sized and attached.
		const rect = canvas!.getBoundingClientRect();
		expect(rect.width).toBeGreaterThan(100);
		expect(rect.height).toBeGreaterThan(100);
	});

	it("no errors after 15 seconds of gameplay", async () => {
		const errors: string[] = [];
		const origError = console.error;
		console.error = (...args: unknown[]) => {
			const msg = args.map(String).join(" ");
			if (!msg.includes("favicon") && !msg.includes("WebGL") && !msg.includes("AudioContext")) {
				errors.push(msg);
			}
			origError.apply(console, args);
		};

		await navigateToApp();
		await waitForText("Otter Elite Force", 12000);
		await clickButtonByText("New Campaign");
		await waitForText("Mission Briefing", 10000);
		await clickButtonByText("Deploy");
		await waitForSelector("[data-testid='runtime-hud-resources']", 15000);

		await wait(15000);

		console.error = origError;
		expect(errors).toHaveLength(0);
	});
});
