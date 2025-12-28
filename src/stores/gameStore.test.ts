/**
 * Game Store Tests
 *
 * Comprehensive tests for the Zustand game store including:
 * - Basic state management
 * - Open world chunk persistence
 * - Difficulty mode escalation
 * - Territory control mechanics
 * - Character rescue system
 * - Base building
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGameStore } from "../stores/gameStore";

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] || null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		clear: vi.fn(() => {
			store = {};
		}),
	};
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("gameStore - Basic Operations", () => {
	beforeEach(() => {
		localStorageMock.clear();
		const store = useGameStore.getState();
		store.resetStats();
		// Reset save data to defaults
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				difficultyMode: "SUPPORT",
				discoveredChunks: {},
				territoryScore: 0,
				peacekeepingScore: 0,
				unlockedCharacters: ["bubbles"],
				isLZSecured: false,
				baseComponents: [],
			},
		});
	});

	it("should initialize with default values", () => {
		const state = useGameStore.getState();
		expect(state.mode).toBe("MENU");
		expect(state.hudReady).toBe(false);
		expect(state.health).toBe(100);
		expect(state.kills).toBe(0);
		expect(state.currentChunkId).toBe("0,0");
	});

	it("should update hudReady state", () => {
		const store = useGameStore.getState();
		store.setHudReady(true);
		expect(useGameStore.getState().hudReady).toBe(true);
		store.setHudReady(false);
		expect(useGameStore.getState().hudReady).toBe(false);
	});

	it("should update mode", () => {
		const store = useGameStore.getState();
		store.setMode("GAME");
		expect(useGameStore.getState().mode).toBe("GAME");
	});

	it("should support VICTORY mode", () => {
		const store = useGameStore.getState();
		store.setMode("VICTORY");
		expect(useGameStore.getState().mode).toBe("VICTORY");
	});

	it("should take damage correctly", () => {
		const store = useGameStore.getState();
		store.takeDamage(20);
		expect(useGameStore.getState().health).toBe(80);
	});

	it("should not go below zero health", () => {
		const store = useGameStore.getState();
		store.takeDamage(120);
		expect(useGameStore.getState().health).toBe(0);
	});

	it("should heal correctly", () => {
		const store = useGameStore.getState();
		store.takeDamage(50);
		store.heal(20);
		expect(useGameStore.getState().health).toBe(70);
	});

	it("should not exceed max health", () => {
		const store = useGameStore.getState();
		store.heal(50);
		expect(useGameStore.getState().health).toBe(100);
	});

	it("should increment kills", () => {
		const store = useGameStore.getState();
		store.addKill();
		expect(useGameStore.getState().kills).toBe(1);
	});
});

describe("gameStore - Open World Chunk Persistence", () => {
	beforeEach(() => {
		localStorageMock.clear();
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				discoveredChunks: {},
				territoryScore: 0,
			},
		});
	});

	it("should discover new chunk and store it", () => {
		const store = useGameStore.getState();
		const chunk = store.discoverChunk(5, 3);

		expect(chunk.id).toBe("5,3");
		expect(chunk.x).toBe(5);
		expect(chunk.z).toBe(3);

		// Chunk should be stored in discoveredChunks
		const savedChunks = useGameStore.getState().saveData.discoveredChunks;
		expect(savedChunks["5,3"]).toBeDefined();
	});

	it("should return same chunk data for same coordinates (fixed-on-discovery)", () => {
		const store = useGameStore.getState();

		// Discover chunk first time
		const chunk1 = store.discoverChunk(10, 10);
		const entityCount1 = chunk1.entities.length;

		// Discover same chunk again - should return identical data
		const chunk2 = store.discoverChunk(10, 10);
		const entityCount2 = chunk2.entities.length;

		expect(entityCount1).toBe(entityCount2);
		expect(chunk1.id).toBe(chunk2.id);
		expect(chunk1.seed).toBe(chunk2.seed);
	});

	it("should generate deterministic chunks based on coordinates", () => {
		const store = useGameStore.getState();

		// Clear any existing chunks
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				discoveredChunks: {},
			},
		});

		// Generate chunk at specific coords multiple times
		const chunkA1 = store.discoverChunk(7, 7);
		const chunkA2 = store.discoverChunk(7, 7);

		// Same coordinates should always produce the same seed (deterministic)
		expect(chunkA1.seed).toBe(chunkA2.seed);
		expect(typeof chunkA1.seed).toBe("number");
		expect(chunkA1.seed).toBeGreaterThanOrEqual(0);

		// Different coordinates should generally produce a different seed
		const chunkB = store.discoverChunk(8, 7);
		expect(chunkB.seed).not.toBe(chunkA1.seed);
	});

	it("should get nearby chunks (3x3 grid)", () => {
		const store = useGameStore.getState();
		const nearbyChunks = store.getNearbyChunks(0, 0);

		expect(nearbyChunks.length).toBe(9); // 3x3 grid
	});

	it("should place extraction point at LZ (0,0)", () => {
		const store = useGameStore.getState();
		const lzChunk = store.discoverChunk(0, 0);

		const hasExtraction = lzChunk.entities.some((e) => e.type === "EXTRACTION_POINT");
		expect(hasExtraction).toBe(true);
	});

	it("should place prison cage for Whiskers at (5,5)", () => {
		const store = useGameStore.getState();
		const prisonChunk = store.discoverChunk(5, 5);

		const hasPrison = prisonChunk.entities.some(
			(e) => e.type === "PRISON_CAGE" && e.objectiveId === "whiskers",
		);
		expect(hasPrison).toBe(true);
	});
});

describe("gameStore - Territory Control", () => {
	beforeEach(() => {
		localStorageMock.clear();
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				discoveredChunks: {},
				territoryScore: 0,
				peacekeepingScore: 0,
			},
		});
	});

	it("should secure chunk and increment territory score", () => {
		const store = useGameStore.getState();

		// First discover the chunk
		store.discoverChunk(3, 3);

		// Then secure it
		store.secureChunk("3,3");

		const state = useGameStore.getState();
		expect(state.saveData.territoryScore).toBe(1);
		expect(state.saveData.discoveredChunks["3,3"].secured).toBe(true);
	});

	it("should not re-secure already secured chunk", () => {
		const store = useGameStore.getState();

		store.discoverChunk(4, 4);
		store.secureChunk("4,4");

		const scoreAfterFirst = useGameStore.getState().saveData.territoryScore;

		// Try to secure again
		store.secureChunk("4,4");

		const scoreAfterSecond = useGameStore.getState().saveData.territoryScore;

		expect(scoreAfterFirst).toBe(scoreAfterSecond);
	});

	it("should award peacekeeping points for village liberation", () => {
		const store = useGameStore.getState();

		// Create a chunk with a village manually
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				discoveredChunks: {
					"1,1": {
						id: "1,1",
						x: 1,
						z: 1,
						seed: 123,
						terrainType: "RIVER",
						secured: false,
						entities: [{ id: "hut-1", type: "HUT", position: [0, 0, 0] }],
						decorations: [],
					},
				},
			},
		});

		store.secureChunk("1,1");

		expect(useGameStore.getState().saveData.peacekeepingScore).toBeGreaterThan(0);
	});
});

describe("gameStore - Difficulty Mode (Escalation Only)", () => {
	beforeEach(() => {
		localStorageMock.clear();
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				difficultyMode: "SUPPORT",
			},
		});
	});

	it("should start at SUPPORT difficulty", () => {
		const state = useGameStore.getState();
		expect(state.saveData.difficultyMode).toBe("SUPPORT");
	});

	it("should upgrade from SUPPORT to TACTICAL", () => {
		const store = useGameStore.getState();
		store.setDifficulty("TACTICAL");
		expect(useGameStore.getState().saveData.difficultyMode).toBe("TACTICAL");
	});

	it("should upgrade from TACTICAL to ELITE", () => {
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				difficultyMode: "TACTICAL",
			},
		});

		const store = useGameStore.getState();
		store.setDifficulty("ELITE");
		expect(useGameStore.getState().saveData.difficultyMode).toBe("ELITE");
	});

	it("should NOT downgrade from TACTICAL to SUPPORT", () => {
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				difficultyMode: "TACTICAL",
			},
		});

		const store = useGameStore.getState();
		store.setDifficulty("SUPPORT");

		// Should remain TACTICAL
		expect(useGameStore.getState().saveData.difficultyMode).toBe("TACTICAL");
	});

	it("should NOT downgrade from ELITE to TACTICAL", () => {
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				difficultyMode: "ELITE",
			},
		});

		const store = useGameStore.getState();
		store.setDifficulty("TACTICAL");

		// Should remain ELITE
		expect(useGameStore.getState().saveData.difficultyMode).toBe("ELITE");
	});
});

describe("gameStore - The Fall Mechanic (TACTICAL Mode)", () => {
	beforeEach(() => {
		localStorageMock.clear();
		useGameStore.setState({
			health: 100,
			saveData: {
				...useGameStore.getState().saveData,
				difficultyMode: "TACTICAL",
				isFallTriggered: false,
			},
		});
	});

	it("should trigger fall when health drops below 30%", () => {
		const store = useGameStore.getState();

		// Take damage to drop below 30%
		store.takeDamage(75); // 100 -> 25 health

		expect(useGameStore.getState().saveData.isFallTriggered).toBe(true);
	});

	it("should not trigger fall in SUPPORT mode", () => {
		useGameStore.setState({
			health: 100,
			saveData: {
				...useGameStore.getState().saveData,
				difficultyMode: "SUPPORT",
				isFallTriggered: false,
			},
		});

		const store = useGameStore.getState();
		store.takeDamage(75);

		expect(useGameStore.getState().saveData.isFallTriggered).toBe(false);
	});
});

describe("gameStore - Character Rescue System", () => {
	beforeEach(() => {
		localStorageMock.clear();
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				unlockedCharacters: ["bubbles"],
				strategicObjectives: {
					siphonsDismantled: 0,
					villagesLiberated: 0,
					gasStockpilesCaptured: 0,
					healersProtected: 0,
					alliesRescued: 0,
				},
			},
		});
	});

	it("should start with only bubbles unlocked", () => {
		const state = useGameStore.getState();
		expect(state.saveData.unlockedCharacters).toContain("bubbles");
		expect(state.saveData.unlockedCharacters).not.toContain("whiskers");
	});

	it("should rescue and unlock character", () => {
		const store = useGameStore.getState();
		store.rescueCharacter("whiskers");

		const state = useGameStore.getState();
		expect(state.saveData.unlockedCharacters).toContain("whiskers");
		expect(state.saveData.strategicObjectives.alliesRescued).toBe(1);
	});

	it("should not double-count rescue for already unlocked character", () => {
		const store = useGameStore.getState();

		store.rescueCharacter("whiskers");
		const rescueCount1 = useGameStore.getState().saveData.strategicObjectives.alliesRescued;

		store.rescueCharacter("whiskers"); // Try to rescue again
		const rescueCount2 = useGameStore.getState().saveData.strategicObjectives.alliesRescued;

		expect(rescueCount1).toBe(rescueCount2);
	});
});

describe("gameStore - Base Building at LZ", () => {
	beforeEach(() => {
		localStorageMock.clear();
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				isLZSecured: false,
				baseComponents: [],
			},
		});
	});

	it("should start with LZ not secured", () => {
		const state = useGameStore.getState();
		expect(state.saveData.isLZSecured).toBe(false);
	});

	it("should secure LZ", () => {
		const store = useGameStore.getState();
		store.secureLZ();
		expect(useGameStore.getState().saveData.isLZSecured).toBe(true);
	});

	it("should place base component", () => {
		const store = useGameStore.getState();

		store.placeComponent({
			type: "FLOOR",
			position: [0, 0, 0],
			rotation: [0, 0, 0],
		});

		const components = useGameStore.getState().saveData.baseComponents;
		expect(components.length).toBe(1);
		expect(components[0].type).toBe("FLOOR");
	});

	it("should remove base component", () => {
		const store = useGameStore.getState();

		store.placeComponent({
			type: "WALL",
			position: [5, 0, 0],
			rotation: [0, 0, 0],
		});

		const componentId = useGameStore.getState().saveData.baseComponents[0].id;

		store.removeComponent(componentId);

		expect(useGameStore.getState().saveData.baseComponents.length).toBe(0);
	});
});

describe("gameStore - Economy", () => {
	beforeEach(() => {
		localStorageMock.clear();
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				coins: 500,
			},
		});
	});

	it("should add coins", () => {
		const store = useGameStore.getState();
		store.addCoins(100);
		expect(useGameStore.getState().saveData.coins).toBe(600);
	});

	it("should spend coins when sufficient balance", () => {
		const store = useGameStore.getState();
		const success = store.spendCoins(200);

		expect(success).toBe(true);
		expect(useGameStore.getState().saveData.coins).toBe(300);
	});

	it("should not spend coins when insufficient balance", () => {
		const store = useGameStore.getState();
		const success = store.spendCoins(1000);

		expect(success).toBe(false);
		expect(useGameStore.getState().saveData.coins).toBe(500);
	});

	it("should buy upgrade", () => {
		const store = useGameStore.getState();
		store.buyUpgrade("speed", 200);

		expect(useGameStore.getState().saveData.upgrades.speedBoost).toBe(1);
		expect(useGameStore.getState().saveData.coins).toBe(300);
	});
});
