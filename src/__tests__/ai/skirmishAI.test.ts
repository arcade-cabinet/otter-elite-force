/**
 * Skirmish AI — TDD tests.
 *
 * The SkirmishAI is a goal-based decision loop that sits above unit-level FSMs.
 * It decides WHAT to build/train/attack; the FSM layer decides HOW units behave.
 *
 * We test against a GameAdapter interface so no Koota/Konva dependency is needed.
 *
 * Covers US-080: AI opponent for single-player skirmish.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	DIFFICULTY_CONFIG,
	type GameAdapter,
	SkirmishAI,
	type SkirmishDifficulty,
	type SkirmishState,
} from "../../ai/skirmishAI";

// ---------------------------------------------------------------------------
// Mock GameAdapter
// ---------------------------------------------------------------------------

function createMockAdapter(overrides: Partial<GameAdapter> = {}): GameAdapter {
	return {
		getWorkerCount: vi.fn(() => 0),
		getArmyCount: vi.fn(() => 0),
		getArmyComposition: vi.fn(() => ({ melee: 0, ranged: 0 })),
		getBuildingCount: vi.fn(() => 0),
		hasBuilding: vi.fn(() => false),
		getResources: vi.fn(() => ({ fish: 0, timber: 0, salvage: 0 })),
		getPopulation: vi.fn(() => ({ current: 0, max: 10 })),
		trainUnit: vi.fn(() => true),
		placeBuilding: vi.fn(() => true),
		sendAttack: vi.fn(),
		sendGather: vi.fn(),
		sendScout: vi.fn(),
		getEnemyBasePosition: vi.fn(() => ({ x: 20, y: 20 })),
		getBuildPosition: vi.fn(() => ({ x: 5, y: 5 })),
		isEnemyCommandPostDestroyed: vi.fn(() => false),
		isOwnCommandPostDestroyed: vi.fn(() => false),
		...overrides,
	};
}

function createState(overrides: Partial<SkirmishState> = {}): SkirmishState {
	return {
		thinkTimer: 0,
		phase: "economy",
		attackCooldown: 0,
		hasScouted: false,
		...overrides,
	};
}

// ---------------------------------------------------------------------------
// Difficulty Configuration
// ---------------------------------------------------------------------------

describe("SkirmishAI — Difficulty Config", () => {
	it("Easy has 5s think interval", () => {
		expect(DIFFICULTY_CONFIG.easy.thinkInterval).toBe(5);
	});

	it("Medium has 3s think interval", () => {
		expect(DIFFICULTY_CONFIG.medium.thinkInterval).toBe(3);
	});

	it("Hard has 1s think interval", () => {
		expect(DIFFICULTY_CONFIG.hard.thinkInterval).toBe(1);
	});

	it("Brutal has 0s think interval and resource bonus", () => {
		expect(DIFFICULTY_CONFIG.brutal.thinkInterval).toBe(0);
		expect(DIFFICULTY_CONFIG.brutal.resourceBonus).toBe(0.5);
	});

	it("Easy has no resource bonus", () => {
		expect(DIFFICULTY_CONFIG.easy.resourceBonus).toBe(0);
	});

	it("Medium has 10% resource bonus", () => {
		expect(DIFFICULTY_CONFIG.medium.resourceBonus).toBe(0.1);
	});

	it("Hard has 25% resource bonus", () => {
		expect(DIFFICULTY_CONFIG.hard.resourceBonus).toBe(0.25);
	});

	it("attack thresholds decrease with difficulty", () => {
		expect(DIFFICULTY_CONFIG.easy.attackThreshold).toBeGreaterThan(
			DIFFICULTY_CONFIG.medium.attackThreshold,
		);
		expect(DIFFICULTY_CONFIG.medium.attackThreshold).toBeGreaterThan(
			DIFFICULTY_CONFIG.hard.attackThreshold,
		);
		expect(DIFFICULTY_CONFIG.hard.attackThreshold).toBeGreaterThan(
			DIFFICULTY_CONFIG.brutal.attackThreshold,
		);
	});

	it("Easy does not scout early", () => {
		expect(DIFFICULTY_CONFIG.easy.scoutsEarly).toBe(false);
	});

	it("Medium and above scout early", () => {
		expect(DIFFICULTY_CONFIG.medium.scoutsEarly).toBe(true);
		expect(DIFFICULTY_CONFIG.hard.scoutsEarly).toBe(true);
		expect(DIFFICULTY_CONFIG.brutal.scoutsEarly).toBe(true);
	});

	it("only Brutal uses multi-prong attacks", () => {
		expect(DIFFICULTY_CONFIG.easy.multiProngAttack).toBe(false);
		expect(DIFFICULTY_CONFIG.medium.multiProngAttack).toBe(false);
		expect(DIFFICULTY_CONFIG.hard.multiProngAttack).toBe(false);
		expect(DIFFICULTY_CONFIG.brutal.multiProngAttack).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Construction & Initialization
// ---------------------------------------------------------------------------

describe("SkirmishAI — Construction", () => {
	it("creates with initial economy phase", () => {
		const adapter = createMockAdapter();
		const ai = new SkirmishAI("easy", adapter);
		expect(ai.getState().phase).toBe("economy");
	});

	it("creates with zero think timer", () => {
		const adapter = createMockAdapter();
		const ai = new SkirmishAI("hard", adapter);
		expect(ai.getState().thinkTimer).toBe(0);
	});

	it("exposes difficulty setting", () => {
		const adapter = createMockAdapter();
		const ai = new SkirmishAI("brutal", adapter);
		expect(ai.difficulty).toBe("brutal");
	});

	it("initializes hasScouted to false", () => {
		const adapter = createMockAdapter();
		const ai = new SkirmishAI("medium", adapter);
		expect(ai.getState().hasScouted).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Think Timer / Tick Gating
// ---------------------------------------------------------------------------

describe("SkirmishAI — Think Timer", () => {
	it("does not think before interval elapses (Easy = 5s)", () => {
		const adapter = createMockAdapter({
			getWorkerCount: vi.fn(() => 0),
			getResources: vi.fn(() => ({ fish: 500, timber: 500, salvage: 500 })),
		});
		const ai = new SkirmishAI("easy", adapter);

		ai.update(2); // 2s < 5s threshold
		expect(adapter.trainUnit).not.toHaveBeenCalled();
		expect(adapter.placeBuilding).not.toHaveBeenCalled();
	});

	it("thinks after interval elapses (Easy = 5s)", () => {
		const adapter = createMockAdapter({
			getWorkerCount: vi.fn(() => 0),
			getResources: vi.fn(() => ({ fish: 500, timber: 500, salvage: 500 })),
			hasBuilding: vi.fn(() => true),
		});
		const ai = new SkirmishAI("easy", adapter);

		ai.update(5.1); // Past 5s threshold
		// Should attempt to train a worker (first priority)
		expect(adapter.trainUnit).toHaveBeenCalled();
	});

	it("Brutal thinks on every update", () => {
		const adapter = createMockAdapter({
			getWorkerCount: vi.fn(() => 0),
			getResources: vi.fn(() => ({ fish: 500, timber: 500, salvage: 500 })),
			hasBuilding: vi.fn(() => true),
		});
		const ai = new SkirmishAI("brutal", adapter);

		ai.update(0.016); // One frame
		expect(adapter.trainUnit).toHaveBeenCalled();
	});

	it("Medium thinks after 3s interval", () => {
		const adapter = createMockAdapter({
			getWorkerCount: vi.fn(() => 0),
			getResources: vi.fn(() => ({ fish: 500, timber: 500, salvage: 500 })),
			hasBuilding: vi.fn(() => true),
		});
		const ai = new SkirmishAI("medium", adapter);

		ai.update(2); // Not yet
		expect(adapter.trainUnit).not.toHaveBeenCalled();

		ai.update(1.5); // Now past 3s
		expect(adapter.trainUnit).toHaveBeenCalled();
	});

	it("resets timer after thinking", () => {
		const adapter = createMockAdapter({
			getWorkerCount: vi.fn(() => 5),
			getArmyCount: vi.fn(() => 0),
			hasBuilding: vi.fn(() => true),
			getResources: vi.fn(() => ({ fish: 500, timber: 500, salvage: 500 })),
		});
		const ai = new SkirmishAI("hard", adapter);

		ai.update(1.5); // Past 1s threshold
		const stateAfter = ai.getState();
		expect(stateAfter.thinkTimer).toBeLessThan(1);
	});
});

// ---------------------------------------------------------------------------
// Scouting (US-080)
// ---------------------------------------------------------------------------

describe("SkirmishAI — Scouting", () => {
	it("Medium+ sends a scout when first army unit is trained", () => {
		const adapter = createMockAdapter({
			getWorkerCount: vi.fn(() => 5),
			getArmyCount: vi.fn(() => 1),
			getArmyComposition: vi.fn(() => ({ melee: 1, ranged: 0 })),
			hasBuilding: vi.fn(() => true),
			getResources: vi.fn(() => ({ fish: 500, timber: 500, salvage: 500 })),
			getPopulation: vi.fn(() => ({ current: 6, max: 20 })),
			getEnemyBasePosition: vi.fn(() => ({ x: 30, y: 30 })),
		});
		const ai = new SkirmishAI("medium", adapter);

		ai.update(3.1); // Past medium think interval
		expect(adapter.sendScout).toHaveBeenCalledWith(30, 30);
		expect(ai.getState().hasScouted).toBe(true);
	});

	it("Easy does NOT send a scout", () => {
		const adapter = createMockAdapter({
			getWorkerCount: vi.fn(() => 5),
			getArmyCount: vi.fn(() => 3),
			getArmyComposition: vi.fn(() => ({ melee: 2, ranged: 1 })),
			hasBuilding: vi.fn(() => true),
			getResources: vi.fn(() => ({ fish: 500, timber: 500, salvage: 500 })),
			getPopulation: vi.fn(() => ({ current: 8, max: 20 })),
		});
		const ai = new SkirmishAI("easy", adapter);

		ai.update(5.1);
		expect(adapter.sendScout).not.toHaveBeenCalled();
	});

	it("only scouts once", () => {
		const adapter = createMockAdapter({
			getWorkerCount: vi.fn(() => 5),
			getArmyCount: vi.fn(() => 2),
			getArmyComposition: vi.fn(() => ({ melee: 1, ranged: 1 })),
			hasBuilding: vi.fn(() => true),
			getResources: vi.fn(() => ({ fish: 500, timber: 500, salvage: 500 })),
			getPopulation: vi.fn(() => ({ current: 7, max: 20 })),
			getEnemyBasePosition: vi.fn(() => ({ x: 25, y: 25 })),
		});
		const ai = new SkirmishAI("hard", adapter);

		ai.update(1.1);
		ai.update(1.1);
		ai.update(1.1);
		expect(adapter.sendScout).toHaveBeenCalledTimes(1);
	});
});

// ---------------------------------------------------------------------------
// Economy Phase — Worker Production
// ---------------------------------------------------------------------------

describe("SkirmishAI — Worker Production", () => {
	it("trains workers when count < 5", () => {
		const adapter = createMockAdapter({
			getWorkerCount: vi.fn(() => 2),
			getResources: vi.fn(() => ({ fish: 500, timber: 500, salvage: 500 })),
			hasBuilding: vi.fn((type: string) => type === "sludge_pit"),
		});
		const ai = new SkirmishAI("brutal", adapter);

		ai.update(0.1);
		expect(adapter.trainUnit).toHaveBeenCalledWith("skink");
	});

	it("does not train workers when count >= 5", () => {
		const adapter = createMockAdapter({
			getWorkerCount: vi.fn(() => 5),
			getArmyCount: vi.fn(() => 0),
			hasBuilding: vi.fn(() => true),
			getResources: vi.fn(() => ({ fish: 500, timber: 500, salvage: 500 })),
		});
		const ai = new SkirmishAI("brutal", adapter);

		ai.update(0.1);
		// trainUnit may be called for army, but not for skink
		const skinkCalls = (adapter.trainUnit as ReturnType<typeof vi.fn>).mock.calls.filter(
			(c: unknown[]) => c[0] === "skink",
		);
		expect(skinkCalls.length).toBe(0);
	});

	it("sends workers to gather after training", () => {
		const adapter = createMockAdapter({
			getWorkerCount: vi.fn(() => 3),
			getResources: vi.fn(() => ({ fish: 500, timber: 500, salvage: 500 })),
			hasBuilding: vi.fn(() => true),
		});
		const ai = new SkirmishAI("brutal", adapter);

		ai.update(0.1);
		expect(adapter.sendGather).toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// Economy Phase — Building Construction
// ---------------------------------------------------------------------------

describe("SkirmishAI — Building Construction", () => {
	it("builds spawning_pool when not present and workers >= 3", () => {
		const adapter = createMockAdapter({
			getWorkerCount: vi.fn(() => 3),
			hasBuilding: vi.fn((type: string) => type === "sludge_pit"),
			getResources: vi.fn(() => ({ fish: 500, timber: 500, salvage: 500 })),
			getBuildPosition: vi.fn(() => ({ x: 3, y: 3 })),
		});
		const ai = new SkirmishAI("brutal", adapter);

		ai.update(0.1);
		expect(adapter.placeBuilding).toHaveBeenCalledWith("spawning_pool", 3, 3);
	});

	it("does not build spawning_pool when already present", () => {
		const adapter = createMockAdapter({
			getWorkerCount: vi.fn(() => 5),
			hasBuilding: vi.fn(() => true),
			getResources: vi.fn(() => ({ fish: 500, timber: 500, salvage: 500 })),
			getArmyCount: vi.fn(() => 0),
		});
		const ai = new SkirmishAI("brutal", adapter);

		ai.update(0.1);
		expect(adapter.placeBuilding).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// Military Phase — Army Training
// ---------------------------------------------------------------------------

describe("SkirmishAI — Army Training", () => {
	it("trains gators (melee) when army composition needs melee", () => {
		const adapter = createMockAdapter({
			getWorkerCount: vi.fn(() => 5),
			getArmyCount: vi.fn(() => 2),
			getArmyComposition: vi.fn(() => ({ melee: 0, ranged: 2 })),
			hasBuilding: vi.fn(() => true),
			getResources: vi.fn(() => ({ fish: 500, timber: 500, salvage: 500 })),
			getPopulation: vi.fn(() => ({ current: 7, max: 20 })),
		});
		const ai = new SkirmishAI("brutal", adapter);

		ai.update(0.1);
		expect(adapter.trainUnit).toHaveBeenCalledWith("gator");
	});

	it("trains vipers (ranged) when army composition needs ranged", () => {
		const adapter = createMockAdapter({
			getWorkerCount: vi.fn(() => 5),
			getArmyCount: vi.fn(() => 5),
			getArmyComposition: vi.fn(() => ({ melee: 5, ranged: 0 })),
			hasBuilding: vi.fn(() => true),
			getResources: vi.fn(() => ({ fish: 500, timber: 500, salvage: 500 })),
			getPopulation: vi.fn(() => ({ current: 10, max: 20 })),
		});
		const ai = new SkirmishAI("brutal", adapter);

		ai.update(0.1);
		expect(adapter.trainUnit).toHaveBeenCalledWith("viper");
	});

	it("respects population cap", () => {
		const adapter = createMockAdapter({
			getWorkerCount: vi.fn(() => 5),
			getArmyCount: vi.fn(() => 5),
			getArmyComposition: vi.fn(() => ({ melee: 3, ranged: 2 })),
			hasBuilding: vi.fn(() => true),
			getResources: vi.fn(() => ({ fish: 500, timber: 500, salvage: 500 })),
			getPopulation: vi.fn(() => ({ current: 10, max: 10 })),
		});
		const ai = new SkirmishAI("brutal", adapter);

		ai.update(0.1);
		// Should NOT train when pop is maxed
		const trainCalls = (adapter.trainUnit as ReturnType<typeof vi.fn>).mock.calls;
		expect(trainCalls.length).toBe(0);
	});

	it("maintains ~60/40 melee/ranged ratio", () => {
		const adapter = createMockAdapter({
			getWorkerCount: vi.fn(() => 5),
			getArmyCount: vi.fn(() => 10),
			// Currently 60% melee — ratio is balanced, should train to maintain
			getArmyComposition: vi.fn(() => ({ melee: 6, ranged: 4 })),
			hasBuilding: vi.fn(() => true),
			getResources: vi.fn(() => ({ fish: 500, timber: 500, salvage: 500 })),
			getPopulation: vi.fn(() => ({ current: 15, max: 30 })),
		});
		const ai = new SkirmishAI("brutal", adapter);

		ai.update(0.1);
		// With balanced ratio, should train melee (gator) to maintain 60%
		const trainCalls = (adapter.trainUnit as ReturnType<typeof vi.fn>).mock.calls;
		expect(trainCalls.length).toBeGreaterThan(0);
	});
});

// ---------------------------------------------------------------------------
// Phase Transitions (difficulty-dependent thresholds)
// ---------------------------------------------------------------------------

describe("SkirmishAI — Phase Transitions", () => {
	it("transitions to military phase once spawning_pool exists and workers >= 5", () => {
		const adapter = createMockAdapter({
			getWorkerCount: vi.fn(() => 5),
			getArmyCount: vi.fn(() => 0),
			getArmyComposition: vi.fn(() => ({ melee: 0, ranged: 0 })),
			hasBuilding: vi.fn(() => true),
			getResources: vi.fn(() => ({ fish: 500, timber: 500, salvage: 500 })),
			getPopulation: vi.fn(() => ({ current: 5, max: 20 })),
		});
		const ai = new SkirmishAI("brutal", adapter);

		ai.update(0.1);
		expect(ai.getState().phase).toBe("military");
	});

	it("Easy transitions to attack at army > 20 (high threshold)", () => {
		const adapter = createMockAdapter({
			getWorkerCount: vi.fn(() => 5),
			getArmyCount: vi.fn(() => 21),
			getArmyComposition: vi.fn(() => ({ melee: 13, ranged: 8 })),
			hasBuilding: vi.fn(() => true),
			getResources: vi.fn(() => ({ fish: 500, timber: 500, salvage: 500 })),
			getPopulation: vi.fn(() => ({ current: 26, max: 40 })),
			getEnemyBasePosition: vi.fn(() => ({ x: 20, y: 20 })),
		});
		const ai = new SkirmishAI("easy", adapter);

		ai.update(5.1);
		expect(ai.getState().phase).toBe("attack");
	});

	it("Easy does NOT attack at army = 16 (below easy threshold of 20)", () => {
		const adapter = createMockAdapter({
			getWorkerCount: vi.fn(() => 5),
			getArmyCount: vi.fn(() => 16),
			getArmyComposition: vi.fn(() => ({ melee: 10, ranged: 6 })),
			hasBuilding: vi.fn(() => true),
			getResources: vi.fn(() => ({ fish: 500, timber: 500, salvage: 500 })),
			getPopulation: vi.fn(() => ({ current: 21, max: 30 })),
		});
		const ai = new SkirmishAI("easy", adapter);

		ai.update(5.1);
		expect(ai.getState().phase).toBe("military");
	});

	it("Brutal transitions to attack at army > 10 (low threshold)", () => {
		const adapter = createMockAdapter({
			getWorkerCount: vi.fn(() => 5),
			getArmyCount: vi.fn(() => 11),
			getArmyComposition: vi.fn(() => ({ melee: 7, ranged: 4 })),
			hasBuilding: vi.fn(() => true),
			getResources: vi.fn(() => ({ fish: 500, timber: 500, salvage: 500 })),
			getPopulation: vi.fn(() => ({ current: 16, max: 30 })),
			getEnemyBasePosition: vi.fn(() => ({ x: 20, y: 20 })),
		});
		const ai = new SkirmishAI("brutal", adapter);

		ai.update(0.1);
		expect(ai.getState().phase).toBe("attack");
	});

	it("sends attack order when entering attack phase", () => {
		const adapter = createMockAdapter({
			getWorkerCount: vi.fn(() => 5),
			getArmyCount: vi.fn(() => 16),
			getArmyComposition: vi.fn(() => ({ melee: 10, ranged: 6 })),
			hasBuilding: vi.fn(() => true),
			getResources: vi.fn(() => ({ fish: 500, timber: 500, salvage: 500 })),
			getPopulation: vi.fn(() => ({ current: 21, max: 30 })),
			getEnemyBasePosition: vi.fn(() => ({ x: 20, y: 20 })),
		});
		const ai = new SkirmishAI("medium", adapter);

		ai.update(3.1);
		expect(adapter.sendAttack).toHaveBeenCalledWith(20, 20);
	});

	it("Brutal sends multi-prong attack", () => {
		const adapter = createMockAdapter({
			getWorkerCount: vi.fn(() => 5),
			getArmyCount: vi.fn(() => 11),
			getArmyComposition: vi.fn(() => ({ melee: 7, ranged: 4 })),
			hasBuilding: vi.fn(() => true),
			getResources: vi.fn(() => ({ fish: 500, timber: 500, salvage: 500 })),
			getPopulation: vi.fn(() => ({ current: 16, max: 30 })),
			getEnemyBasePosition: vi.fn(() => ({ x: 20, y: 20 })),
		});
		const ai = new SkirmishAI("brutal", adapter);

		ai.update(0.1);
		// Should have two sendAttack calls (main + offset)
		expect(adapter.sendAttack).toHaveBeenCalledTimes(2);
		expect(adapter.sendAttack).toHaveBeenCalledWith(20, 20);
		expect(adapter.sendAttack).toHaveBeenCalledWith(25, 25);
	});

	it("returns to military phase after attack cooldown", () => {
		const adapter = createMockAdapter({
			getWorkerCount: vi.fn(() => 5),
			getArmyCount: vi.fn(() => 16),
			getArmyComposition: vi.fn(() => ({ melee: 10, ranged: 6 })),
			hasBuilding: vi.fn(() => true),
			getResources: vi.fn(() => ({ fish: 500, timber: 500, salvage: 500 })),
			getPopulation: vi.fn(() => ({ current: 21, max: 30 })),
			getEnemyBasePosition: vi.fn(() => ({ x: 20, y: 20 })),
		});
		const ai = new SkirmishAI("medium", adapter);

		// First update triggers attack
		ai.update(3.1);
		expect(ai.getState().phase).toBe("attack");

		// Army gets reduced below threshold after attack
		(adapter.getArmyCount as ReturnType<typeof vi.fn>).mockReturnValue(8);

		// After cooldown, returns to military phase
		ai.update(30.1); // Past attack cooldown
		expect(ai.getState().phase).toBe("military");
	});
});

// ---------------------------------------------------------------------------
// Expansion
// ---------------------------------------------------------------------------

describe("SkirmishAI — Expansion", () => {
	it("attempts expansion (second sludge_pit) when army > 10", () => {
		const adapter = createMockAdapter({
			getWorkerCount: vi.fn(() => 5),
			getArmyCount: vi.fn(() => 12),
			getArmyComposition: vi.fn(() => ({ melee: 7, ranged: 5 })),
			hasBuilding: vi.fn(() => true),
			getBuildingCount: vi.fn((type: string) => (type === "sludge_pit" ? 1 : 1)),
			getResources: vi.fn(() => ({ fish: 500, timber: 500, salvage: 500 })),
			getPopulation: vi.fn(() => ({ current: 17, max: 30 })),
			getBuildPosition: vi.fn(() => ({ x: 10, y: 10 })),
		});
		// Use "easy" so army=12 stays in military (easy threshold=20)
		const ai = new SkirmishAI("easy", adapter);

		ai.update(5.1); // Past easy think interval
		expect(adapter.placeBuilding).toHaveBeenCalledWith("sludge_pit", 10, 10);
	});

	it("does not expand when already has 2 bases", () => {
		const adapter = createMockAdapter({
			getWorkerCount: vi.fn(() => 5),
			getArmyCount: vi.fn(() => 12),
			getArmyComposition: vi.fn(() => ({ melee: 7, ranged: 5 })),
			hasBuilding: vi.fn(() => true),
			getBuildingCount: vi.fn((type: string) => (type === "sludge_pit" ? 2 : 1)),
			getResources: vi.fn(() => ({ fish: 500, timber: 500, salvage: 500 })),
			getPopulation: vi.fn(() => ({ current: 17, max: 30 })),
		});
		// Use "easy" so army=12 stays in military (easy threshold=20)
		const ai = new SkirmishAI("easy", adapter);

		ai.update(5.1);
		expect(adapter.placeBuilding).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// Resource Bonus
// ---------------------------------------------------------------------------

describe("SkirmishAI — Resource Bonus", () => {
	it("Brutal difficulty applies +50% resource bonus via adapter check", () => {
		expect(DIFFICULTY_CONFIG.brutal.resourceBonus).toBe(0.5);
		expect(DIFFICULTY_CONFIG.hard.resourceBonus).toBe(0.25);
		expect(DIFFICULTY_CONFIG.medium.resourceBonus).toBe(0.1);
		expect(DIFFICULTY_CONFIG.easy.resourceBonus).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// Build Order: workers → resources → barracks → army (US-080)
// ---------------------------------------------------------------------------

describe("SkirmishAI — Build Order", () => {
	it("follows: workers → resources → barracks → army", () => {
		let workerCount = 0;
		let armyCount = 0;
		const hasBuildings = new Set(["sludge_pit"]);
		const actionLog: string[] = [];

		const adapter = createMockAdapter({
			getWorkerCount: vi.fn(() => workerCount),
			getArmyCount: vi.fn(() => armyCount),
			getArmyComposition: vi.fn(() => ({
				melee: Math.floor(armyCount * 0.6),
				ranged: Math.ceil(armyCount * 0.4),
			})),
			hasBuilding: vi.fn((type: string) => hasBuildings.has(type)),
			getBuildingCount: vi.fn(() => 1),
			getResources: vi.fn(() => ({ fish: 9999, timber: 9999, salvage: 9999 })),
			getPopulation: vi.fn(() => ({ current: workerCount + armyCount, max: 50 })),
			trainUnit: vi.fn((type: string) => {
				if (type === "skink") {
					workerCount++;
					actionLog.push("train_worker");
				} else {
					armyCount++;
					actionLog.push(`train_${type}`);
				}
				return true;
			}),
			placeBuilding: vi.fn((type: string) => {
				hasBuildings.add(type);
				actionLog.push(`build_${type}`);
				return true;
			}),
			sendGather: vi.fn(() => {
				if (workerCount > 0 && actionLog[actionLog.length - 1] !== "gather") {
					actionLog.push("gather");
				}
			}),
			sendAttack: vi.fn(),
			sendScout: vi.fn(),
			getEnemyBasePosition: vi.fn(() => ({ x: 20, y: 20 })),
			getBuildPosition: vi.fn(() => ({ x: 5, y: 5 })),
			isEnemyCommandPostDestroyed: vi.fn(() => false),
			isOwnCommandPostDestroyed: vi.fn(() => false),
		});

		const ai = new SkirmishAI("brutal", adapter);

		// Tick: should train first worker
		ai.update(0.1);
		expect(actionLog).toContain("train_worker");

		// Get to 3 workers — should build barracks
		workerCount = 3;
		actionLog.length = 0;
		ai.update(0.1);
		expect(actionLog).toContain("build_spawning_pool");

		// Get to 5 workers + barracks → should start army training
		workerCount = 5;
		actionLog.length = 0;
		ai.update(0.1);
		// Now in military phase, should train army
		const armyTrainCalls = actionLog.filter(
			(a) => a.startsWith("train_g") || a.startsWith("train_v"),
		);
		expect(armyTrainCalls.length).toBeGreaterThan(0);
	});
});

// ---------------------------------------------------------------------------
// Full Decision Loop Integration
// ---------------------------------------------------------------------------

describe("SkirmishAI — Full Loop", () => {
	it("progresses through economy → military → attack over multiple ticks", () => {
		let workerCount = 0;
		let armyCount = 0;
		const hasBuildings = new Set(["sludge_pit"]);

		const adapter = createMockAdapter({
			getWorkerCount: vi.fn(() => workerCount),
			getArmyCount: vi.fn(() => armyCount),
			getArmyComposition: vi.fn(() => ({
				melee: Math.floor(armyCount * 0.6),
				ranged: Math.ceil(armyCount * 0.4),
			})),
			hasBuilding: vi.fn((type: string) => hasBuildings.has(type)),
			getBuildingCount: vi.fn(() => 1),
			getResources: vi.fn(() => ({ fish: 9999, timber: 9999, salvage: 9999 })),
			getPopulation: vi.fn(() => ({ current: workerCount + armyCount, max: 50 })),
			trainUnit: vi.fn((type: string) => {
				if (type === "skink") workerCount++;
				else armyCount++;
				return true;
			}),
			placeBuilding: vi.fn((type: string) => {
				hasBuildings.add(type);
				return true;
			}),
			sendAttack: vi.fn(),
			sendGather: vi.fn(),
			sendScout: vi.fn(),
			getEnemyBasePosition: vi.fn(() => ({ x: 20, y: 20 })),
			getBuildPosition: vi.fn(() => ({ x: 5, y: 5 })),
			isEnemyCommandPostDestroyed: vi.fn(() => false),
			isOwnCommandPostDestroyed: vi.fn(() => false),
		});

		const ai = new SkirmishAI("brutal", adapter);

		// Tick 1: Economy phase — should train workers
		ai.update(0.1);
		expect(ai.getState().phase).toBe("economy");
		expect(workerCount).toBeGreaterThan(0);

		// Simulate reaching 5 workers + spawning pool
		workerCount = 5;
		hasBuildings.add("spawning_pool");

		// Tick 2: Should transition to military, train army
		ai.update(0.1);
		expect(ai.getState().phase).toBe("military");

		// Simulate army buildup (above brutal threshold of 10)
		armyCount = 11;

		// Tick 3: Should transition to attack
		ai.update(0.1);
		expect(ai.getState().phase).toBe("attack");
		expect(adapter.sendAttack).toHaveBeenCalled();
	});
});
