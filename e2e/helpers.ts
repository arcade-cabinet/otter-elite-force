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

		const existing = localStorage.getItem(key);
		const current = existing ? JSON.parse(existing) : baseState;

		// Deep merge helper for evaluate block
		const merge = (
			target: Record<string, unknown>,
			source: Record<string, unknown>,
		): Record<string, unknown> => {
			for (const key of Object.keys(source)) {
				// Guard against prototype pollution
				if (key === "__proto__" || key === "constructor" || key === "prototype") {
					continue;
				}
				if (source[key] instanceof Object && !Array.isArray(source[key])) {
					if (!target[key]) target[key] = {};
					merge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
				} else {
					target[key] = source[key];
				}
			}
			return target;
		};

		const merged = merge({ ...current }, overrides);
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
		const data = localStorage.getItem("otter_v8");
		return data ? JSON.parse(data) : {};
	});
};

/**
 * Helper to update specific save data fields
 */
export const updateSaveData = async (page: Page, updates: Record<string, unknown>) => {
	await page.evaluate((updates) => {
		const data = JSON.parse(localStorage.getItem("otter_v8") || "{}");
		Object.assign(data, updates);
		localStorage.setItem("otter_v8", JSON.stringify(data));
	}, updates);
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
	} catch (_error) {
		// Fallback to force click if normal click fails
		console.log(`Normal click failed for ${selector}, trying force click`);
		await locator.click({ force: true, timeout: 5000 });
	}
};
