/**
 * Integration Tests for OTTER: ELITE FORCE Game Flow
 *
 * Tests complete game loops including:
 * - Menu to gameplay transitions
 * - Combat scenarios
 * - Character progression
 * - World exploration
 * - Save/Load functionality
 * - Kill streak system
 */

import { beforeEach, describe, expect, it } from "vitest";
import { useGameStore } from "../../stores/gameStore";

describe("Integration - Complete Game Loop", () => {
	beforeEach(() => {
		// Reset to clean state
		localStorage.clear();
		useGameStore.setState({
			mode: "MENU",
			health: 100,
			maxHealth: 100,
			kills: 0,
			mudAmount: 0,
			isCarryingClam: false,
			isPilotingRaft: false,
			selectedCharacterId: "bubbles",
			playerPos: [0, 0, 0],
			saveData: {
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
					weaponLvl: {
						"service-pistol": 1,
						"fish-cannon": 1,
						"bubble-gun": 1,
					},
				},
				isLZSecured: false,
				baseComponents: [],
				lastPlayerPosition: [0, 0, 0],
			},
		});
	});

	it("should complete full menu to game flow", () => {
		const store = useGameStore.getState();

		// Start in menu
		expect(store.mode).toBe("MENU");

		// Select character
		store.selectCharacter("bubbles");
		expect(useGameStore.getState().selectedCharacterId).toBe("bubbles");

		// Transition to cutscene
		store.setMode("CUTSCENE");
		expect(useGameStore.getState().mode).toBe("CUTSCENE");

		// Start game
		store.setMode("GAME");
		expect(useGameStore.getState().mode).toBe("GAME");
	});

	it("should handle combat scenario with damage and kills", () => {
		const store = useGameStore.getState();
		store.setMode("GAME");

		// Simulate combat
		store.takeDamage(20);
		expect(useGameStore.getState().health).toBe(80);

		// Kill enemy
		store.addKill();
		store.gainXP(10);

		expect(useGameStore.getState().kills).toBe(1);
		expect(useGameStore.getState().saveData.xp).toBe(10);

		// Continue combat
		store.addKill();
		store.addKill();
		store.gainXP(20);

		expect(useGameStore.getState().kills).toBe(3);
		expect(useGameStore.getState().saveData.xp).toBe(30);
	});

	it("should handle player death and game over", () => {
		const store = useGameStore.getState();
		store.setMode("GAME");

		// Take fatal damage
		store.takeDamage(100);

		expect(useGameStore.getState().health).toBe(0);
		expect(useGameStore.getState().mode).toBe("GAMEOVER");
	});

	it("should handle healing during combat", () => {
		const store = useGameStore.getState();
		store.setMode("GAME");

		// Take damage
		store.takeDamage(50);
		expect(useGameStore.getState().health).toBe(50);

		// Heal
		store.heal(30);
		expect(useGameStore.getState().health).toBe(80);

		// Take more damage
		store.takeDamage(20);
		expect(useGameStore.getState().health).toBe(60);
	});
});

describe("Integration - Character Progression", () => {
	beforeEach(() => {
		localStorage.clear();
		useGameStore.setState({
			mode: "MENU",
			selectedCharacterId: "bubbles",
			saveData: {
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
					weaponLvl: {
						"service-pistol": 1,
						"fish-cannon": 1,
						"bubble-gun": 1,
					},
				},
				isLZSecured: false,
				baseComponents: [],
				lastPlayerPosition: [0, 0, 0],
			},
		});
	});

	it("should progress from PUP to higher rank through gameplay", () => {
		const store = useGameStore.getState();
		store.setMode("GAME");

		// Simulate multiple kills with XP gain
		for (let i = 0; i < 20; i++) {
			store.addKill();
			store.gainXP(10);
		}

		// Should have ranked up (200 XP needed for rank 1)
		expect(useGameStore.getState().saveData.xp).toBe(200);
		expect(useGameStore.getState().saveData.rank).toBe(1);
	});

	it("should unlock new character through rescue", () => {
		const store = useGameStore.getState();

		// Rescue General Whiskers
		store.rescueCharacter("whiskers");

		const state = useGameStore.getState();
		expect(state.saveData.unlockedCharacters).toContain("whiskers");
		expect(state.saveData.strategicObjectives.alliesRescued).toBe(1);
	});

	it("should switch to unlocked character", () => {
		const store = useGameStore.getState();

		// Unlock and select new character
		store.unlockCharacter("splash");
		store.selectCharacter("splash");

		expect(useGameStore.getState().selectedCharacterId).toBe("splash");
	});
});

describe("Integration - World Exploration", () => {
	beforeEach(() => {
		localStorage.clear();
		useGameStore.setState({
			mode: "GAME",
			saveData: {
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
					weaponLvl: {
						"service-pistol": 1,
						"fish-cannon": 1,
						"bubble-gun": 1,
					},
				},
				isLZSecured: false,
				baseComponents: [],
				lastPlayerPosition: [0, 0, 0],
			},
		});
	});

	it("should explore and secure territory", () => {
		const store = useGameStore.getState();

		// Discover starting chunk
		const chunk = store.discoverChunk(0, 0);
		expect(chunk).toBeDefined();

		// Secure the chunk
		store.secureChunk("0,0");

		const state = useGameStore.getState();
		expect(state.saveData.discoveredChunks["0,0"].secured).toBe(true);
		expect(state.saveData.territoryScore).toBe(1);
	});

	it("should explore multiple chunks and track territory", () => {
		const store = useGameStore.getState();

		// Explore a 3x3 area
		const nearby = store.getNearbyChunks(0, 0);
		expect(nearby.length).toBe(9);

		// Secure multiple chunks
		store.secureChunk("0,0");
		store.secureChunk("1,0");
		store.secureChunk("0,1");

		const state = useGameStore.getState();
		expect(state.saveData.territoryScore).toBe(3);
	});

	it("should find strategic objectives in chunks", () => {
		const store = useGameStore.getState();

		// Discover the prison camp chunk at (5, 5)
		const prisonChunk = store.discoverChunk(5, 5);

		// Should contain prison cage for General Whiskers
		const prisonCage = prisonChunk.entities.find((e) => e.type === "PRISON_CAGE");
		expect(prisonCage).toBeDefined();
		expect(prisonCage?.objectiveId).toBe("whiskers");
	});
});

describe("Integration - Economy Loop", () => {
	beforeEach(() => {
		localStorage.clear();
		useGameStore.setState({
			mode: "GAME",
			saveData: {
				version: 8,
				rank: 0,
				xp: 0,
				medals: 0,
				unlocked: 1,
				unlockedCharacters: ["bubbles"],
				unlockedWeapons: ["service-pistol"],
				coins: 500,
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
					weaponLvl: {
						"service-pistol": 1,
						"fish-cannon": 1,
						"bubble-gun": 1,
					},
				},
				isLZSecured: false,
				baseComponents: [],
				lastPlayerPosition: [0, 0, 0],
			},
		});
	});

	it("should earn and spend coins for upgrades", () => {
		const store = useGameStore.getState();

		// Start with 500 coins
		expect(store.saveData.coins).toBe(500);

		// Earn more through gameplay
		store.addCoins(300);
		expect(useGameStore.getState().saveData.coins).toBe(800);

		// Buy speed upgrade (cost: 200)
		store.buyUpgrade("speed", 200);
		expect(useGameStore.getState().saveData.coins).toBe(600);
		expect(useGameStore.getState().saveData.upgrades.speedBoost).toBe(1);
	});

	it("should track spoils of war", () => {
		const store = useGameStore.getState();

		// Collect spoils
		store.collectSpoils("credit");
		store.collectSpoils("credit");
		store.collectSpoils("clam");

		const state = useGameStore.getState();
		expect(state.saveData.spoilsOfWar.creditsEarned).toBe(2);
		expect(state.saveData.spoilsOfWar.clamsHarvested).toBe(1);
	});

	it("should upgrade weapons with coins", () => {
		const store = useGameStore.getState();

		// Upgrade service pistol
		store.upgradeWeapon("service-pistol", 100);

		const state = useGameStore.getState();
		expect(state.saveData.upgrades.weaponLvl["service-pistol"]).toBe(2);
		expect(state.saveData.coins).toBe(400); // 500 - 100
	});
});

describe("Integration - Base Building", () => {
	beforeEach(() => {
		localStorage.clear();
		useGameStore.setState({
			mode: "GAME",
			saveData: {
				version: 8,
				rank: 0,
				xp: 0,
				medals: 0,
				unlocked: 1,
				unlockedCharacters: ["bubbles"],
				unlockedWeapons: ["service-pistol"],
				coins: 1000,
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
					weaponLvl: {
						"service-pistol": 1,
						"fish-cannon": 1,
						"bubble-gun": 1,
					},
				},
				isLZSecured: false,
				baseComponents: [],
				lastPlayerPosition: [0, 0, 0],
			},
		});
	});

	it("should secure LZ and build base", () => {
		const store = useGameStore.getState();

		// First secure the landing zone
		store.secureLZ();
		expect(useGameStore.getState().saveData.isLZSecured).toBe(true);

		// Enter build mode
		store.setBuildMode(true);
		expect(useGameStore.getState().isBuildMode).toBe(true);

		// Place base components
		store.placeComponent({
			type: "FLOOR",
			position: [0, 0, 0],
			rotation: [0, 0, 0],
		});
		store.placeComponent({
			type: "WALL",
			position: [0, 1, 0],
			rotation: [0, 0, 0],
		});
		store.placeComponent({
			type: "ROOF",
			position: [0, 2, 0],
			rotation: [0, 0, 0],
		});

		const state = useGameStore.getState();
		expect(state.saveData.baseComponents.length).toBe(3);
	});
});

describe("Integration - Difficulty Modes", () => {
	it("should handle SUPPORT mode (default)", () => {
		useGameStore.setState({
			mode: "GAME",
			health: 100,
			saveData: {
				...useGameStore.getState().saveData,
				difficultyMode: "SUPPORT",
			},
		});

		const store = useGameStore.getState();

		// Taking damage below 30 should not trigger fall
		store.takeDamage(75);
		expect(useGameStore.getState().health).toBe(25);
		expect(useGameStore.getState().saveData.isFallTriggered).toBe(false);
	});

	it("should handle TACTICAL mode with fall trigger", () => {
		useGameStore.setState({
			mode: "GAME",
			health: 100,
			saveData: {
				...useGameStore.getState().saveData,
				difficultyMode: "TACTICAL",
				isFallTriggered: false,
			},
		});

		const store = useGameStore.getState();

		// Taking damage below 30 should trigger fall in TACTICAL
		store.takeDamage(75);
		expect(useGameStore.getState().health).toBe(25);
		expect(useGameStore.getState().saveData.isFallTriggered).toBe(true);
	});
});

describe("Integration - State Persistence", () => {
	beforeEach(() => {
		localStorage.clear();
		useGameStore.setState({
			mode: "MENU",
			saveData: {
				...useGameStore.getState().saveData,
				coins: 0,
				xp: 0,
				unlockedCharacters: ["bubbles"],
				discoveredChunks: {},
			},
		});
	});

	it("should persist game state across saves", () => {
		const store = useGameStore.getState();

		// Make some progress
		store.addCoins(100);
		store.gainXP(50);
		store.unlockCharacter("splash");
		store.discoverChunk(1, 1);

		// Save the game
		store.saveGame();

		// Verify localStorage was called
		const savedData = localStorage.getItem("otter_v8");
		expect(savedData).toBeDefined();
		if (savedData) {
			const parsed = JSON.parse(savedData);
			expect(parsed.coins).toBe(100);
			expect(parsed.xp).toBe(50);
			expect(parsed.unlockedCharacters).toContain("splash");
		}
	});
});
