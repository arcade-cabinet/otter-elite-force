import { expect, test } from "@playwright/test";

/**
 * E2E Tests for Chunk Persistence
 *
 * Tests the "fixed-on-discovery" mandate where chunks are permanently
 * set once discovered and entity states persist across sessions.
 */

// Type declaration for window with game store
declare global {
	interface Window {
		__gameStore?: {
			getState: () => {
				discoverChunk: (x: number, z: number) => { entities: Array<{ id: string; hp?: number }> };
				saveGame: () => void;
				loadData: () => void;
				updateChunkEntity: (chunkId: string, entityId: string, updates: { hp?: number }) => void;
				secureChunk: (chunkId: string) => void;
				hibernateDistantChunks: (x: number, z: number, radius: number) => void;
				visitChunk: (chunkId: string) => void;
				saveData: {
					discoveredChunks: Record<
						string,
						{
							id: string;
							x: number;
							z: number;
							seed: number;
							terrainType: string;
							secured: boolean;
							territoryState?: string;
							lastVisited?: number;
							hibernated?: boolean;
							entities: Array<{ id: string; hp?: number }>;
							decorations: unknown[];
						}
					>;
				};
			};
		};
	}
}

test.describe("Chunk Persistence", () => {
	test.beforeEach(async ({ page }) => {
		// Clear localStorage to start fresh
		await page.goto("/");
		await page.evaluate(() => localStorage.clear());
		await page.reload();
	});

	test("should persist discovered chunks across sessions", async ({ page }) => {
		// Discover some chunks by navigating the game
		await page.evaluate(() => {
			const store = window.__gameStore;
			if (store) {
				// Discover a few chunks
				store.getState().discoverChunk(0, 0);
				store.getState().discoverChunk(1, 0);
				store.getState().discoverChunk(0, 1);

				// Save the game
				store.getState().saveGame();
			}
		});

		// Check that chunks are in localStorage
		const savedData = await page.evaluate(() => {
			const saved = localStorage.getItem("otter-elite-force-save");
			return saved ? JSON.parse(saved) : null;
		});

		expect(savedData).toBeTruthy();
		expect(savedData.discoveredChunks).toBeDefined();
		expect(Object.keys(savedData.discoveredChunks).length).toBeGreaterThanOrEqual(3);

		// Reload page to simulate new session
		await page.reload();

		// Verify chunks are still there
		const reloadedData = await page.evaluate(() => {
			const saved = localStorage.getItem("otter-elite-force-save");
			return saved ? JSON.parse(saved) : null;
		});

		expect(reloadedData.discoveredChunks["0,0"]).toBeDefined();
		expect(reloadedData.discoveredChunks["1,0"]).toBeDefined();
		expect(reloadedData.discoveredChunks["0,1"]).toBeDefined();
	});

	test("should preserve entity states in chunks", async ({ page }) => {
		await page.evaluate(() => {
			const store = window.__gameStore;
			if (store) {
				// Discover a chunk
				const chunk = store.getState().discoverChunk(2, 2);
				const firstEntity = chunk.entities[0];

				// Modify entity state
				if (firstEntity) {
					store.getState().updateChunkEntity("2,2", firstEntity.id, { hp: 5 });
				}

				store.getState().saveGame();
			}
		});

		// Reload page
		await page.reload();

		// Check entity state persisted
		const entityState = await page.evaluate(() => {
			const saved = localStorage.getItem("otter-elite-force-save");
			if (!saved) return null;
			const data = JSON.parse(saved);
			const chunk = data.discoveredChunks["2,2"];
			return chunk ? chunk.entities[0] : null;
		});

		expect(entityState).toBeTruthy();
		expect(entityState.hp).toBe(5);
	});

	test("should track territory state for chunks", async ({ page }) => {
		await page.evaluate(() => {
			const store = window.__gameStore;
			if (store) {
				// Discover and secure a chunk
				store.getState().discoverChunk(3, 3);
				store.getState().secureChunk("3,3");
			}
		});

		const chunkState = await page.evaluate(() => {
			const saved = localStorage.getItem("otter-elite-force-save");
			if (!saved) return null;
			const data = JSON.parse(saved);
			return data.discoveredChunks["3,3"];
		});

		expect(chunkState).toBeTruthy();
		expect(chunkState.territoryState).toBe("SECURED");
		expect(chunkState.secured).toBe(true);

		// Check for URA flag entity
		const hasFlag = chunkState.entities.some((e: { id: string }) => e.id.startsWith("flag-"));
		expect(hasFlag).toBe(true);
	});

	test("should support chunk hibernation", async ({ page }) => {
		await page.evaluate(() => {
			const store = window.__gameStore;
			if (store) {
				// Discover multiple chunks at different distances
				store.getState().discoverChunk(0, 0);
				store.getState().discoverChunk(1, 0);
				store.getState().discoverChunk(10, 10);

				// Hibernate distant chunks
				store.getState().hibernateDistantChunks(0, 0, 2);
			}
		});

		const hibernationState = await page.evaluate(() => {
			const store = window.__gameStore;
			if (!store) return null;
			const chunks = store.getState().saveData.discoveredChunks;
			return {
				near1: chunks["0,0"]?.hibernated,
				near2: chunks["1,0"]?.hibernated,
				far: chunks["10,10"]?.hibernated,
			};
		});

		expect(hibernationState).toBeTruthy();
		expect(hibernationState.near1).toBe(false);
		expect(hibernationState.near2).toBe(false);
		expect(hibernationState.far).toBe(true);
	});

	test("should track lastVisited timestamp", async ({ page }) => {
		const beforeTime = Date.now();

		await page.evaluate(() => {
			const store = window.__gameStore;
			if (store) {
				store.getState().discoverChunk(4, 4);
				store.getState().visitChunk("4,4");
			}
		});

		const visitTime = await page.evaluate(() => {
			const store = window.__gameStore;
			if (!store) return null;
			const chunk = store.getState().saveData.discoveredChunks["4,4"];
			return chunk?.lastVisited;
		});

		expect(visitTime).toBeTruthy();
		expect(visitTime).toBeGreaterThanOrEqual(beforeTime);
		expect(visitTime).toBeLessThanOrEqual(Date.now());
	});

	test("should maintain chunk data structure after migration", async ({ page }) => {
		// Simulate an old save without new fields
		await page.evaluate(() => {
			const oldSave = {
				version: 7,
				discoveredChunks: {
					"5,5": {
						id: "5,5",
						x: 5,
						z: 5,
						seed: 123,
						terrainType: "RIVER",
						secured: false,
						entities: [],
						decorations: [],
					},
				},
				// ... other required fields
				rank: 0,
				xp: 0,
				medals: 0,
				unlocked: 1,
				unlockedCharacters: ["bubbles"],
				unlockedWeapons: ["service-pistol"],
				coins: 0,
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
					weaponLvl: {},
				},
				isLZSecured: false,
				baseComponents: [],
				lastPlayerPosition: [0, 0, 0],
			};
			localStorage.setItem("otter-elite-force-save", JSON.stringify(oldSave));
		});

		// Reload to trigger migration
		await page.reload();

		// Load data and check migration
		await page.evaluate(() => {
			const store = window.__gameStore;
			if (store) {
				store.getState().loadData();
			}
		});

		const migratedChunk = await page.evaluate(() => {
			const store = window.__gameStore;
			if (!store) return null;
			return store.getState().saveData.discoveredChunks["5,5"];
		});

		expect(migratedChunk).toBeTruthy();
		expect(migratedChunk.territoryState).toBeDefined();
		expect(migratedChunk.lastVisited).toBeDefined();
		expect(migratedChunk.hibernated).toBeDefined();
	});

	test("should handle 50+ discovered chunks efficiently", async ({ page }) => {
		await page.evaluate(() => {
			const store = window.__gameStore;
			if (store) {
				// Discover 50+ chunks in a grid pattern
				for (let x = -5; x <= 5; x++) {
					for (let z = -5; z <= 5; z++) {
						store.getState().discoverChunk(x, z);
					}
				}
				store.getState().saveGame();
			}
		});

		const chunkCount = await page.evaluate(() => {
			const saved = localStorage.getItem("otter-elite-force-save");
			if (!saved) return 0;
			const data = JSON.parse(saved);
			return Object.keys(data.discoveredChunks || {}).length;
		});

		expect(chunkCount).toBeGreaterThanOrEqual(50);

		// Test hibernation performance with many chunks
		const hibernationTime = await page.evaluate(() => {
			const startTime = performance.now();
			const store = window.__gameStore;
			if (store) {
				store.getState().hibernateDistantChunks(0, 0, 3);
			}
			return performance.now() - startTime;
		});

		// Hibernation should be fast even with 50+ chunks
		expect(hibernationTime).toBeLessThan(100); // Less than 100ms
	});
});
