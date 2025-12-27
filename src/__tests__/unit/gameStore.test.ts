/**
 * Comprehensive Game Store Unit Tests
 *
 * Tests all state management functionality including:
 * - Player stats and combat
 * - Mode transitions
 * - World generation and discovery
 * - Character management
 * - Economy and upgrades
 * - Save/Load persistence
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
	CHAR_PRICES,
	CHARACTERS,
	CHUNK_SIZE,
	UPGRADE_COSTS,
	useGameStore,
	WEAPONS,
} from "../../stores/gameStore";

describe("gameStore - Player Stats", () => {
	beforeEach(() => {
		const store = useGameStore.getState();
		store.resetStats();
		// Reset to clean state
		useGameStore.setState({
			health: 100,
			maxHealth: 100,
			kills: 0,
			mode: "MENU",
		});
	});

	it("should initialize with default values", () => {
		const state = useGameStore.getState();
		expect(state.mode).toBe("MENU");
		expect(state.health).toBe(100);
		expect(state.kills).toBe(0);
		expect(state.currentChunkId).toBe("0,0");
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

	it("should not exceed max health when healing", () => {
		const store = useGameStore.getState();
		store.heal(50);
		expect(useGameStore.getState().health).toBe(100);
	});

	it("should increment kills correctly", () => {
		const store = useGameStore.getState();
		store.addKill();
		store.addKill();
		store.addKill();
		expect(useGameStore.getState().kills).toBe(3);
	});

	it("should reset stats to initial values", () => {
		const store = useGameStore.getState();
		store.takeDamage(30);
		store.addKill();
		store.setMud(50);
		store.resetStats();

		const state = useGameStore.getState();
		expect(state.health).toBe(100);
		expect(state.kills).toBe(0);
		expect(state.mudAmount).toBe(0);
	});

	it("should set mud amount", () => {
		const store = useGameStore.getState();
		store.setMud(75);
		expect(useGameStore.getState().mudAmount).toBe(75);
	});

	it("should update player position", () => {
		const store = useGameStore.getState();
		store.setPlayerPos([10, 0, 20]);
		expect(useGameStore.getState().playerPos).toEqual([10, 0, 20]);
	});

	it("should track clam carrying state", () => {
		const store = useGameStore.getState();
		expect(store.isCarryingClam).toBe(false);
		store.setCarryingClam(true);
		expect(useGameStore.getState().isCarryingClam).toBe(true);
	});

	it("should track raft piloting state", () => {
		const store = useGameStore.getState();
		expect(store.isPilotingRaft).toBe(false);
		store.setPilotingRaft(true, "raft-1");
		expect(useGameStore.getState().isPilotingRaft).toBe(true);
		expect(useGameStore.getState().raftId).toBe("raft-1");
	});
});

describe("gameStore - Mode Management", () => {
	beforeEach(() => {
		useGameStore.setState({ mode: "MENU" });
	});

	it("should change mode correctly", () => {
		const store = useGameStore.getState();
		store.setMode("GAME");
		expect(useGameStore.getState().mode).toBe("GAME");
	});

	it("should support all game modes", () => {
		const modes = ["MENU", "CUTSCENE", "GAME", "GAMEOVER", "CANTEEN"] as const;

		for (const mode of modes) {
			useGameStore.getState().setMode(mode);
			expect(useGameStore.getState().mode).toBe(mode);
		}
	});

	it("should toggle build mode", () => {
		const store = useGameStore.getState();
		expect(store.isBuildMode).toBe(false);
		store.setBuildMode(true);
		expect(useGameStore.getState().isBuildMode).toBe(true);
	});

	it("should toggle zoom state", () => {
		const store = useGameStore.getState();
		expect(store.isZoomed).toBe(false);
		store.toggleZoom();
		expect(useGameStore.getState().isZoomed).toBe(true);
		store.toggleZoom();
		expect(useGameStore.getState().isZoomed).toBe(false);
	});
});

describe("gameStore - Difficulty System", () => {
	beforeEach(() => {
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				difficultyMode: "SUPPORT",
			},
		});
	});

	it("should only upgrade difficulty, never downgrade", () => {
		const store = useGameStore.getState();

		// Should upgrade from SUPPORT to TACTICAL
		store.setDifficulty("TACTICAL");
		expect(useGameStore.getState().saveData.difficultyMode).toBe("TACTICAL");

		// Should not downgrade from TACTICAL to SUPPORT
		store.setDifficulty("SUPPORT");
		expect(useGameStore.getState().saveData.difficultyMode).toBe("TACTICAL");

		// Should upgrade from TACTICAL to ELITE
		store.setDifficulty("ELITE");
		expect(useGameStore.getState().saveData.difficultyMode).toBe("ELITE");
	});
});

describe("gameStore - Character Management", () => {
	beforeEach(() => {
		useGameStore.setState({
			selectedCharacterId: "bubbles",
			saveData: {
				...useGameStore.getState().saveData,
				unlockedCharacters: ["bubbles"],
			},
		});
	});

	it("should have bubbles as default character", () => {
		expect(useGameStore.getState().selectedCharacterId).toBe("bubbles");
	});

	it("should select different characters", () => {
		const store = useGameStore.getState();
		store.selectCharacter("whiskers");
		expect(useGameStore.getState().selectedCharacterId).toBe("whiskers");
	});

	it("should unlock new characters", () => {
		const store = useGameStore.getState();
		store.unlockCharacter("splash");

		const state = useGameStore.getState();
		expect(state.saveData.unlockedCharacters).toContain("splash");
	});

	it("should not duplicate unlocked characters", () => {
		const store = useGameStore.getState();
		store.unlockCharacter("bubbles");
		store.unlockCharacter("bubbles");

		const state = useGameStore.getState();
		const bubblesCount = state.saveData.unlockedCharacters.filter((c) => c === "bubbles").length;
		expect(bubblesCount).toBe(1);
	});

	it("should rescue and unlock characters together", () => {
		const store = useGameStore.getState();
		store.rescueCharacter("whiskers");

		const state = useGameStore.getState();
		expect(state.saveData.unlockedCharacters).toContain("whiskers");
		expect(state.saveData.strategicObjectives.alliesRescued).toBe(1);
	});
});

describe("gameStore - Economy and Upgrades", () => {
	beforeEach(() => {
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				coins: 1000,
				upgrades: {
					speedBoost: 0,
					healthBoost: 0,
					damageBoost: 0,
					weaponLvl: {
						"service-pistol": 1,
						"fish-cannon": 1,
						"bubble-gun": 1,
					},
				},
			},
		});
	});

	it("should add coins correctly", () => {
		const store = useGameStore.getState();
		const initialCoins = store.saveData.coins;
		store.addCoins(500);
		expect(useGameStore.getState().saveData.coins).toBe(initialCoins + 500);
	});

	it("should spend coins when sufficient balance", () => {
		const store = useGameStore.getState();
		const result = store.spendCoins(200);
		expect(result).toBe(true);
		expect(useGameStore.getState().saveData.coins).toBe(800);
	});

	it("should not spend coins when insufficient balance", () => {
		const store = useGameStore.getState();
		const result = store.spendCoins(2000);
		expect(result).toBe(false);
		expect(useGameStore.getState().saveData.coins).toBe(1000);
	});

	it("should buy speed upgrade", () => {
		const store = useGameStore.getState();
		store.buyUpgrade("speed", UPGRADE_COSTS.speed);
		expect(useGameStore.getState().saveData.upgrades.speedBoost).toBe(1);
	});

	it("should buy health upgrade", () => {
		const store = useGameStore.getState();
		store.buyUpgrade("health", UPGRADE_COSTS.health);
		expect(useGameStore.getState().saveData.upgrades.healthBoost).toBe(1);
	});

	it("should buy damage upgrade", () => {
		const store = useGameStore.getState();
		store.buyUpgrade("damage", UPGRADE_COSTS.damage);
		expect(useGameStore.getState().saveData.upgrades.damageBoost).toBe(1);
	});

	it("should upgrade weapons", () => {
		const store = useGameStore.getState();
		store.upgradeWeapon("service-pistol", 100);
		expect(useGameStore.getState().saveData.upgrades.weaponLvl["service-pistol"]).toBe(2);
	});

	it("should unlock new weapons", () => {
		const store = useGameStore.getState();
		store.unlockWeapon("fish-cannon");
		expect(useGameStore.getState().saveData.unlockedWeapons).toContain("fish-cannon");
	});
});

describe("gameStore - XP and Ranking", () => {
	beforeEach(() => {
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				xp: 0,
				rank: 0,
			},
		});
	});

	it("should gain XP correctly", () => {
		const store = useGameStore.getState();
		store.gainXP(100);
		expect(useGameStore.getState().saveData.xp).toBe(100);
	});

	it("should rank up when XP threshold reached", () => {
		const store = useGameStore.getState();
		// Rank 0 requires 200 XP to rank up
		store.gainXP(200);
		expect(useGameStore.getState().saveData.rank).toBe(1);
	});

	it("should accumulate XP across multiple gains", () => {
		const store = useGameStore.getState();
		store.gainXP(50);
		store.gainXP(50);
		store.gainXP(50);
		expect(useGameStore.getState().saveData.xp).toBe(150);
	});
});

describe("gameStore - World Generation", () => {
	beforeEach(() => {
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				discoveredChunks: {},
			},
		});
	});

	it("should discover new chunks", () => {
		const store = useGameStore.getState();
		const chunk = store.discoverChunk(0, 0);

		expect(chunk).toBeDefined();
		expect(chunk.id).toBe("0,0");
		expect(chunk.x).toBe(0);
		expect(chunk.z).toBe(0);
	});

	it("should return same chunk data for same coordinates", () => {
		const store = useGameStore.getState();
		const chunk1 = store.discoverChunk(1, 1);
		const chunk2 = store.discoverChunk(1, 1);

		expect(chunk1.id).toBe(chunk2.id);
		expect(chunk1.seed).toBe(chunk2.seed);
	});

	it("should generate entities in chunks", () => {
		const store = useGameStore.getState();
		const chunk = store.discoverChunk(2, 2);

		expect(chunk.entities).toBeDefined();
		expect(Array.isArray(chunk.entities)).toBe(true);
		expect(chunk.entities.length).toBeGreaterThan(0);
	});

	it("should generate decorations in chunks", () => {
		const store = useGameStore.getState();
		const chunk = store.discoverChunk(3, 3);

		expect(chunk.decorations).toBeDefined();
		expect(Array.isArray(chunk.decorations)).toBe(true);
	});

	it("should get nearby chunks (3x3 grid)", () => {
		const store = useGameStore.getState();
		const nearby = store.getNearbyChunks(0, 0);

		expect(nearby.length).toBe(9);
	});

	it("should secure chunks", () => {
		const store = useGameStore.getState();
		store.discoverChunk(0, 0);
		store.secureChunk("0,0");

		expect(useGameStore.getState().saveData.discoveredChunks["0,0"].secured).toBe(true);
	});
});

describe("gameStore - Strategic Objectives", () => {
	beforeEach(() => {
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				spoilsOfWar: {
					creditsEarned: 0,
					clamsHarvested: 0,
					upgradesUnlocked: 0,
				},
				peacekeepingScore: 0,
			},
		});
	});

	it("should collect credits as spoils", () => {
		const store = useGameStore.getState();
		store.collectSpoils("credit");
		expect(useGameStore.getState().saveData.spoilsOfWar.creditsEarned).toBe(1);
	});

	it("should collect clams as spoils", () => {
		const store = useGameStore.getState();
		store.collectSpoils("clam");
		expect(useGameStore.getState().saveData.spoilsOfWar.clamsHarvested).toBe(1);
	});

	it("should complete peacekeeping objectives", () => {
		const store = useGameStore.getState();
		store.completeStrategic("peacekeeping");
		expect(useGameStore.getState().saveData.peacekeepingScore).toBe(10);
	});
});

describe("gameStore - Base Building", () => {
	beforeEach(() => {
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				isLZSecured: false,
				baseComponents: [],
			},
		});
	});

	it("should secure LZ", () => {
		const store = useGameStore.getState();
		store.secureLZ();
		expect(useGameStore.getState().saveData.isLZSecured).toBe(true);
	});

	it("should place base components", () => {
		const store = useGameStore.getState();
		store.placeComponent({
			type: "FLOOR",
			position: [0, 0, 0],
			rotation: [0, 0, 0],
		});

		const state = useGameStore.getState();
		expect(state.saveData.baseComponents.length).toBe(1);
		expect(state.saveData.baseComponents[0].type).toBe("FLOOR");
	});

	it("should remove base components", () => {
		const store = useGameStore.getState();
		store.placeComponent({
			type: "WALL",
			position: [0, 1, 0],
			rotation: [0, 0, 0],
		});

		const componentId = useGameStore.getState().saveData.baseComponents[0].id;
		store.removeComponent(componentId);

		expect(useGameStore.getState().saveData.baseComponents.length).toBe(0);
	});
});

describe("gameStore - Game Constants", () => {
	it("should have valid weapon definitions", () => {
		for (const [id, weapon] of Object.entries(WEAPONS)) {
			expect(weapon.id).toBe(id);
			expect(weapon.name).toBeDefined();
			expect(weapon.damage).toBeGreaterThan(0);
			expect(weapon.fireRate).toBeGreaterThan(0);
			expect(weapon.bulletSpeed).toBeGreaterThan(0);
		}
	});

	it("should have valid character definitions", () => {
		for (const [id, char] of Object.entries(CHARACTERS)) {
			expect(char.traits.id).toBe(id);
			expect(char.traits.name).toBeDefined();
			expect(char.traits.baseSpeed).toBeGreaterThan(0);
			expect(char.traits.baseHealth).toBeGreaterThan(0);
			expect(char.gear.weaponId).toBeDefined();
		}
	});

	it("should have correct CHUNK_SIZE", () => {
		expect(CHUNK_SIZE).toBe(100);
	});

	it("should have valid upgrade costs", () => {
		expect(UPGRADE_COSTS.speed).toBeGreaterThan(0);
		expect(UPGRADE_COSTS.health).toBeGreaterThan(0);
		expect(UPGRADE_COSTS.damage).toBeGreaterThan(0);
	});

	it("should have valid character prices", () => {
		expect(CHAR_PRICES.bubbles).toBe(0); // Starter character is free
		for (const [_id, price] of Object.entries(CHAR_PRICES)) {
			expect(price).toBeGreaterThanOrEqual(0);
		}
	});
});
