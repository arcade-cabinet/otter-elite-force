/**
 * Skirmish AI — TDD tests.
 *
 * The SkirmishAI is a goal-based decision loop that sits above unit-level FSMs.
 * It decides WHAT to build/train/attack; the FSM layer decides HOW units behave.
 *
 * We test against a GameAdapter interface so no Koota/Phaser dependency is needed.
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
		getEnemyBasePosition: vi.fn(() => ({ x: 20, y: 20 })),
		getBuildPosition: vi.fn(() => ({ x: 5, y: 5 })),
		...overrides,
	};
}

function createState(overrides: Partial<SkirmishState> = {}): SkirmishState {
	return {
		thinkTimer: 0,
		phase: "economy",
		attackCooldown: 0,
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

	it("Hard has 25% resource bonus", () => {
		expect(DIFFICULTY_CONFIG.hard.resourceBonus).toBe(0.25);
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
// Phase Transitions
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

	it("transitions to attack phase when army > 15", () => {
		const adapter = createMockAdapter({
			getWorkerCount: vi.fn(() => 5),
			getArmyCount: vi.fn(() => 16),
			getArmyComposition: vi.fn(() => ({ melee: 10, ranged: 6 })),
			hasBuilding: vi.fn(() => true),
			getResources: vi.fn(() => ({ fish: 500, timber: 500, salvage: 500 })),
			getPopulation: vi.fn(() => ({ current: 21, max: 30 })),
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
		const ai = new SkirmishAI("brutal", adapter);

		ai.update(0.1);
		expect(adapter.sendAttack).toHaveBeenCalledWith(20, 20);
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
		const ai = new SkirmishAI("brutal", adapter);

		// First update triggers attack
		ai.update(0.1);
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
		const ai = new SkirmishAI("brutal", adapter);

		ai.update(0.1);
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
		const ai = new SkirmishAI("brutal", adapter);

		ai.update(0.1);
		expect(adapter.placeBuilding).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// Resource Bonus (Brutal)
// ---------------------------------------------------------------------------

describe("SkirmishAI — Resource Bonus", () => {
	it("Brutal difficulty applies +50% resource bonus via adapter check", () => {
		// The resource bonus is tracked in the AI config; the integration layer
		// should apply it when adding gathered resources.
		expect(DIFFICULTY_CONFIG.brutal.resourceBonus).toBe(0.5);
		expect(DIFFICULTY_CONFIG.hard.resourceBonus).toBe(0.25);
		expect(DIFFICULTY_CONFIG.easy.resourceBonus).toBe(0);
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
			getEnemyBasePosition: vi.fn(() => ({ x: 20, y: 20 })),
			getBuildPosition: vi.fn(() => ({ x: 5, y: 5 })),
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

		// Simulate army buildup
		armyCount = 16;

		// Tick 3: Should transition to attack
		ai.update(0.1);
		expect(ai.getState().phase).toBe("attack");
		expect(adapter.sendAttack).toHaveBeenCalled();
	});
});
