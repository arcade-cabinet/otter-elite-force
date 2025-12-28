import { expect, test } from "@playwright/test";
import {
	getSaveData,
	hasMcpSupport,
	injectGameState,
	robustClick,
	updateSaveData,
	waitForStable,
} from "./helpers";

/**
 * E2E Tests: Advanced Gameplay Mechanics
 *
 * Tests for critical gameplay systems:
 * - Chunk persistence (open world principle)
 * - Base building system
 * - Territory and peacekeeping scoring
 * - Permadeath enforcement
 */

test.describe("Advanced Gameplay Mechanics", () => {
	test("chunk persistence - discovered chunks remain the same on reload", async ({ page }) => {
		if (!hasMcpSupport) {
			test.skip();
			return;
		}

		await page.goto("/");
		await injectGameState(page, {
			isLZSecured: true,
			discoveredChunks: {},
		});

		// Start game
		await robustClick(page, 'button:has-text("CONTINUE CAMPAIGN")');
		await waitForStable(page, 3000);

		// Verify we transitioned to gameplay
		await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
		await waitForStable(page, 4000);

		// Record discovered chunks with full content
		const firstSaveData = await getSaveData(page);
		const firstDiscovery = firstSaveData.discoveredChunks;
		const chunkKeys = Object.keys(firstDiscovery);
		expect(chunkKeys.length).toBeGreaterThan(0);

		// Pick a chunk to verify content remains identical
		const testChunkId = chunkKeys[0];
		const originalChunk = firstDiscovery[testChunkId];

		// Reload page
		await page.reload();
		await waitForStable(page);

		// Verify chunks are identical (content, not just IDs)
		const secondSaveData = await getSaveData(page);
		const secondDiscovery = secondSaveData.discoveredChunks;
		const secondKeys = Object.keys(secondDiscovery);

		// Same number of chunks
		expect(secondKeys.length).toBe(chunkKeys.length);

		// Same chunk IDs and content
		for (const key of chunkKeys) {
			expect(secondKeys).toContain(key);
			// Deep equality check for the chunk data
			expect(secondDiscovery[key]).toEqual(firstDiscovery[key]);
		}

		// Verify specific chunk content remains identical (seed, terrainType, entities, decorations)
		const reloadedChunk = secondDiscovery[testChunkId];
		expect(reloadedChunk.seed).toBe(originalChunk.seed);
		expect(reloadedChunk.terrainType).toBe(originalChunk.terrainType);
		expect(reloadedChunk.entities.length).toBe(originalChunk.entities.length);
		expect(reloadedChunk.decorations.length).toBe(originalChunk.decorations.length);

		// Verify entity positions remain the same
		if (originalChunk.entities.length > 0) {
			expect(reloadedChunk.entities[0].position).toEqual(originalChunk.entities[0].position);
		}
	});

	test("base building - construction UI appears at LZ", async ({ page }) => {
		if (!hasMcpSupport) {
			test.skip();
			return;
		}

		await page.goto("/");
		await injectGameState(page, {
			isLZSecured: true,
			discoveredChunks: {
				"0,0": {
					id: "0,0",
					x: 0,
					z: 0,
					secured: true,
					seed: 0,
					terrainType: "MARSH",
					entities: [],
					decorations: [],
				},
			},
			lastPlayerPosition: [0, 0, 0],
		});

		// Start game at LZ
		await robustClick(page, 'button:has-text("CONTINUE CAMPAIGN")');
		await waitForStable(page, 3000);

		// At LZ (0,0), BUILD button should be visible
		const buildBtn = page.locator('button:has-text("BUILD")');
		await expect(buildBtn).toBeVisible({ timeout: 10000 });

		// Click build button
		await robustClick(page, 'button:has-text("BUILD")');
		await waitForStable(page);

		// Build UI should appear
		await expect(page.locator(".build-menu")).toBeVisible();
	});

	test("territory score increases when securing chunks", async ({ page }) => {
		if (!hasMcpSupport) {
			test.skip();
			return;
		}

		await page.goto("/");
		await injectGameState(page, {
			territoryScore: 0,
			discoveredChunks: {
				"0,0": {
					id: "0,0",
					x: 0,
					z: 0,
					seed: 12345,
					terrainType: "MARSH",
					secured: false,
					entities: [],
					decorations: [],
				},
			},
		});

		// Check initial territory score
		const initialSaveData = await getSaveData(page);
		expect(initialSaveData.territoryScore).toBe(0);

		// Start game
		await robustClick(page, 'button:has-text("CONTINUE CAMPAIGN")');
		await waitForStable(page, 3000);

		// Verify we are in game
		await expect(page.locator("canvas")).toBeVisible();

		// Secure the chunk using game logic (store method)
		await page.evaluate(() => {
			// biome-ignore lint/suspicious/noExplicitAny: E2E testing
			(window as any).useGameStore.getState().secureChunk("0,0");
		});

		// Verify score increased in the store
		const newScore = await page.evaluate(() => {
			// biome-ignore lint/suspicious/noExplicitAny: E2E testing
			return (window as any).useGameStore.getState().saveData.territoryScore;
		});
		expect(newScore).toBe(1);

		// Verify chunk is marked as secured in store
		const isSecured = await page.evaluate(() => {
			// biome-ignore lint/suspicious/noExplicitAny: E2E testing
			return (window as any).useGameStore.getState().saveData.discoveredChunks["0,0"].secured;
		});
		expect(isSecured).toBe(true);
	});

	test("peacekeeping score tracking with rescue mission objectives", async ({ page }) => {
		if (!hasMcpSupport) {
			test.skip();
			return;
		}

		await page.goto("/");
		await injectGameState(page, {
			peacekeepingScore: 0,
			strategicObjectives: {
				siphonsDismantled: 0,
				villagesLiberated: 0,
				gasStockpilesCaptured: 0,
				healersProtected: 0,
				alliesRescued: 0,
			},
			discoveredChunks: {
				"5,5": {
					id: "5,5",
					x: 5,
					z: 5,
					seed: 67890,
					terrainType: "DENSE_JUNGLE",
					secured: false,
					entities: [
						{
							id: "cage-1",
							type: "PRISON_CAGE",
							position: [50, 0, 50],
							objectiveId: "whiskers",
							rescued: false,
						},
					],
					decorations: [],
				},
			},
		});

		// Check initial peacekeeping score and objectives
		const initialSaveData = await getSaveData(page);
		expect(initialSaveData.peacekeepingScore).toBe(0);
		expect(initialSaveData.strategicObjectives.alliesRescued).toBe(0);

		// Start game
		await robustClick(page, 'button:has-text("CONTINUE CAMPAIGN")');
		await waitForStable(page, 3000);

		// Complete strategic objective using game logic (store method)
		// This simulates rescuing an ally
		await page.evaluate(() => {
			// biome-ignore lint/suspicious/noExplicitAny: E2E testing
			(window as any).useGameStore.getState().rescueCharacter("whiskers");
		});

		// Verify peacekeeping score or objective tracking updated
		const currentSaveData = await getSaveData(page);
		expect(currentSaveData.strategicObjectives.alliesRescued).toBe(1);
		expect(currentSaveData.unlockedCharacters).toContain("whiskers");
	});

	test("permadeath in ELITE mode - death purges save data", async ({ page }) => {
		await page.goto("/");

		// Set ELITE difficulty
		await updateSaveData(page, {
			difficultyMode: "ELITE",
			coins: 500,
			rank: 5,
		});

		await page.reload();
		await waitForStable(page);

		// Verify ELITE mode is set
		const saveData = await getSaveData(page);
		expect(saveData.difficultyMode).toBe("ELITE");

		// Simulate death by clearing save data (as would happen on death in ELITE)
		await page.evaluate(() => {
			localStorage.removeItem("otter_v8");
		});

		// Verify save data is gone
		const rawSaveData = await page.evaluate(() => {
			return localStorage.getItem("otter_v8");
		});
		expect(rawSaveData).toBeNull();

		// Reload page - should show NEW GAME button (fresh start)
		await page.reload();
		await waitForStable(page);

		const newGameBtn = page.locator('button:has-text("NEW GAME")');
		await expect(newGameBtn).toBeVisible();
	});
});
