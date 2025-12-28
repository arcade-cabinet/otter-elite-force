import type { Page } from "@playwright/test";

/**
 * Shared test helpers for E2E gameplay tests
 */

export const hasMcpSupport = process.env.PLAYWRIGHT_MCP === "true";

/**
 * Helper to wait for game to stabilize after transitions
 * Uses networkidle for deterministic waits
 */
export const waitForStable = async (page: Page, ms = 1500) => {
	await page.waitForLoadState("networkidle");
	if (ms > 0) {
		await page.waitForTimeout(ms);
	}
};

/**
 * Helper to inject game state for testing specific scenarios
 */
export const injectGameState = async (page: Page, stateOverrides: Record<string, unknown>) => {
	await page.evaluate((overrides) => {
		const key = "otter_v8";
		// Provide a full valid base state to pass validation
		const baseState = {
			version: 8,
			rank: 0,
			xp: 0,
			medals: 0,
			unlocked: 1,
			unlockedCharacters: ["bubbles"],
			unlockedWeapons: ["service-pistol"],
			coins: 0,
			discoveredChunks: {},
			territoryScore: 0,
			peacekeepingScore: 0,
			difficultyMode: "SUPPORT",
			isFallTriggered: false,
			strategicObjectives: {
				siphonsDismantled: 0,
				villagesLiberated: 0,
				gasStockpilesCaptured: 0,
				healersProtected: 0,
				alliesRescued: 0,
			},
			spoilsOfWar: {
				creditsEarned: 0,
				clamsHarvested: 0,
				upgradesUnlocked: 0,
			},
			upgrades: {
				speedBoost: 0,
				healthBoost: 0,
				damageBoost: 0,
				weaponLvl: { "service-pistol": 1 },
			},
			isLZSecured: false,
			baseComponents: [],
			lastPlayerPosition: [0, 0, 0],
		};

		// NOSONAR: localStorage is used to inject game state for E2E testing
		const existing = localStorage.getItem(key);
		const current = existing ? JSON.parse(existing) : baseState;

		// Deep merge helper for evaluate block
		const deepMerge = (
			target: Record<string, unknown>,
			source: Record<string, unknown>,
		): Record<string, unknown> => {
			for (const key of Object.keys(source)) {
				// Guard against prototype pollution
				if (key === "__proto__" || key === "constructor" || key === "prototype") {
					continue;
				}
				// Fixed: check typeof instead of falsy check to handle truthy primitives
				if (
					source[key] !== null &&
					typeof source[key] === "object" &&
					!Array.isArray(source[key])
				) {
					if (
						target[key] === null ||
						typeof target[key] !== "object" ||
						Array.isArray(target[key])
					) {
						target[key] = {};
					}
					deepMerge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
				} else {
					target[key] = source[key];
				}
			}
			return target;
		};

		const merged = deepMerge({ ...current }, overrides);
		// NOSONAR: localStorage is used to inject game state for E2E testing
		localStorage.setItem(key, JSON.stringify(merged));
	}, stateOverrides);
	await page.reload();
	await page.waitForLoadState("networkidle");
	await waitForStable(page);
};

/**
 * Helper to read save data without modification
 */
export const getSaveData = async (page: Page) => {
	return await page.evaluate(() => {
		// NOSONAR: localStorage is used to read game state for E2E testing verification
		const data = localStorage.getItem("otter_v8");
		return data ? JSON.parse(data) : {};
	});
};

/**
 * Helper to update specific save data fields with deep merge
 */
export const updateSaveData = async (page: Page, updates: Record<string, unknown>) => {
	await page.evaluate((updates) => {
		// Deep merge helper (same logic as injectGameState)
		const deepMerge = (
			target: Record<string, unknown>,
			source: Record<string, unknown>,
		): Record<string, unknown> => {
			for (const key of Object.keys(source)) {
				if (key === "__proto__" || key === "constructor" || key === "prototype") {
					continue;
				}
				if (
					source[key] !== null &&
					typeof source[key] === "object" &&
					!Array.isArray(source[key])
				) {
					if (
						target[key] === null ||
						typeof target[key] !== "object" ||
						Array.isArray(target[key])
					) {
						target[key] = {};
					}
					deepMerge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
				} else {
					target[key] = source[key];
				}
			}
			return target;
		};

		// NOSONAR: localStorage is used to update game state for E2E testing
		const data = JSON.parse(localStorage.getItem("otter_v8") || "{}");
		const merged = deepMerge(data, updates);
		localStorage.setItem("otter_v8", JSON.stringify(merged));
	}, updates);
};

/**
 * Helper to skip cutscene by clicking NEXT until BEGIN MISSION
 */
export const skipCutscene = async (page: Page) => {
	const nextBtn = page.locator("button.dialogue-next");
	await nextBtn.waitFor({ state: "visible", timeout: 10000 });

	let buttonText = await nextBtn.innerText();
	while (buttonText.includes("NEXT")) {
		const previousText = buttonText;
		await nextBtn.click({ force: true }); // force: true bypasses scroll issues
		// Wait for the button text to change or for the button to disappear
		await page.waitForFunction(
			(args) => {
				const btn = document.querySelector(args.selector);
				return !btn || btn.textContent !== args.previousText;
			},
			{ selector: "button.dialogue-next", previousText },
		);
		buttonText = (await nextBtn.innerText()) || "";
	}
	await nextBtn.click({ force: true }); // Final click on BEGIN MISSION
	await waitForStable(page, 2000); // Give time for game world to initialize
};

/**
 * Helper for robust button clicking with retry logic
 * Addresses flaky button click timeouts in Canteen UI
 */
export const robustClick = async (
	page: Page,
	selector: string,
	options?: { timeout?: number; force?: boolean },
) => {
	const timeout = options?.timeout ?? 15000;
	const locator = page.locator(selector);

	// Wait for element to be attached and visible
	await locator.waitFor({ state: "attached", timeout });
	await locator.waitFor({ state: "visible", timeout });

	// Wait for any animations to complete
	await page.waitForTimeout(500);

	// Try normal click first
	try {
		await locator.click({ timeout: 5000, force: options?.force });
		return;
	} catch (error) {
		// Fallback to force click if normal click fails
		console.log(`Normal click failed for ${selector}, trying force click. Error: ${error}`);
		await locator.click({ force: true, timeout: 5000 });
	}
};
