import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGameStore } from "../stores/gameStore";

describe("gameStore", () => {
	beforeEach(() => {
		// Mock localStorage
		const localStorageMock = (() => {
			let store: Record<string, string> = {};
			return {
				getItem: (key: string) => store[key] || null,
				setItem: (key: string, value: string) => {
					store[key] = value.toString();
				},
				removeItem: (key: string) => {
					delete store[key];
				},
				clear: () => {
					store = {};
				},
			};
		})();
		Object.defineProperty(window, "localStorage", {
			value: localStorageMock,
		});

		const store = useGameStore.getState();
		store.resetData();
	});

	it("should initialize with default values", () => {
		const state = useGameStore.getState();
		expect(state.mode).toBe("MENU");
		expect(state.health).toBe(100);
		expect(state.kills).toBe(0);
	});

	it("should update mode", () => {
		const store = useGameStore.getState();
		store.setMode("GAME");
		expect(useGameStore.getState().mode).toBe("GAME");
	});

	it("should take damage correctly", () => {
		const store = useGameStore.getState();
		store.takeDamage(20);
		expect(useGameStore.getState().health).toBe(80);
	});

	it("should handle death in ELITE mode (permadeath)", () => {
		const store = useGameStore.getState();
		store.setDifficulty("ELITE");
		store.addCoins(100);
		expect(useGameStore.getState().saveData.coins).toBe(100);

		store.takeDamage(100);
		expect(useGameStore.getState().health).toBe(100); // Reset to 100
		expect(useGameStore.getState().saveData.coins).toBe(0); // Reset coins
	});

	it("should trigger fall in TACTICAL mode when health is low", () => {
		const store = useGameStore.getState();
		store.setDifficulty("TACTICAL");
		store.takeDamage(75); // 100 - 75 = 25 (< 30)
		expect(useGameStore.getState().isFallTriggered).toBe(true);
	});

	it("should generate deterministic chunks from seed", () => {
		const store = useGameStore.getState();
		const chunk1 = store.discoverChunk(5, 5);
		const chunk2 = store.discoverChunk(5, 5);
		expect(chunk1.seed).toBe(chunk2.seed);
		expect(chunk1.id).toBe("5,5");
	});

	it("should spawn prison cage at coordinate (5,5)", () => {
		const store = useGameStore.getState();
		const chunk = store.discoverChunk(5, 5);
		expect(chunk.entities.some((e) => e.type === "PRISON_CAGE")).toBe(true);
	});

	it("should manage economy and upgrades", () => {
		const store = useGameStore.getState();
		store.addCoins(500);
		expect(useGameStore.getState().saveData.coins).toBe(500);

		store.buyUpgrade("speed", 200);
		expect(useGameStore.getState().saveData.coins).toBe(300);
		expect(useGameStore.getState().saveData.upgrades.speedBoost).toBe(1);
	});

	it("should respect max level caps for upgrades", () => {
		const store = useGameStore.getState();
		store.addCoins(5000);

		for (let i = 0; i < 15; i++) {
			store.buyUpgrade("speed", 100);
		}

		expect(useGameStore.getState().saveData.upgrades.speedBoost).toBe(10);
	});

	it("should save and load progress", () => {
		const store = useGameStore.getState();
		store.addCoins(123);
		store.saveGame();

		// New store instance simulation
		store.resetStats();
		expect(useGameStore.getState().saveData.coins).toBe(123); // Still 123 in saveData

		// Actually simulate a fresh load
		const anotherStore = useGameStore.getState();
		anotherStore.loadData();
		expect(anotherStore.saveData.coins).toBe(123);
	});

	it("should handle strategic objectives and territory scoring", () => {
		const store = useGameStore.getState();
		const chunk = store.discoverChunk(1, 1);
		// Force a hut in the chunk for testing
		chunk.entities.push({ id: "test-hut", type: "HUT", position: [0, 0, 0] });

		store.secureChunk("1,1");
		expect(useGameStore.getState().saveData.territoryScore).toBe(1);
		expect(useGameStore.getState().saveData.peacekeepingScore).toBe(10);
		expect(useGameStore.getState().saveData.strategicObjectives.villagesLiberated).toBe(1);
	});
});
