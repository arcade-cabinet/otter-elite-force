/**
 * US-101: Per-Mission GOAP Behavioral/Steering Profiles
 *
 * Tests that each mission profile creates a PlaytesterBrain with
 * mission-appropriate evaluators that select the right goals under
 * representative game states.
 */

import { describe, expect, it } from "vitest";
import type { PlayerPerception } from "@/ai/playtester/perception";
import {
	BuildArmyGoal,
	BuildEconomyGoal,
	DefendBaseGoal,
	ScoutMapGoal,
} from "@/ai/playtester/goals";
import {
	createMissionPlaytesterBrain,
	MISSION_PROFILES,
	// Goals
	EscortConvoyGoal,
	CaptureZoneGoal,
	StealthMoveGoal,
	DestroyTargetGoal,
	FortifyBaseGoal,
	RetreatGoal,
	FlagCarryGoal,
	CautiousAdvanceGoal,
	VisitLocationsGoal,
	SiegeAssaultGoal,
	HeroDemolitionGoal,
	BossPhaseGoal,
	MoveToPositionGoal,
	SelectHeroGoal,
	// Evaluators
	EscortEvaluator,
	CaptureZoneEvaluator,
	StealthEvaluator,
	DestroyTargetsEvaluator,
	WeatherAwareDefenseEvaluator,
	FlagCarryEvaluator,
	SubmergedStealthEvaluator,
	FogSkirmishEvaluator,
	LiberationSweepEvaluator,
	FortifyHoldEvaluator,
	SiegeAssaultEvaluator,
	MultiBaseLogisticsEvaluator,
	HeroDemolitionEvaluator,
	EvacuationEvaluator,
	BossPhaseEvaluator,
} from "@/ai/playtester/missionProfiles";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePerception(overrides: Partial<PlayerPerception> = {}): PlayerPerception {
	return {
		viewport: { x: 0, y: 0, width: 800, height: 600 },
		exploredTiles: new Set<string>(),
		visibleTiles: new Set<string>(),
		resources: { fish: 200, timber: 200, salvage: 100 },
		population: { current: 4, max: 10 },
		selectedUnits: [],
		selectedBuildings: [],
		visibleFriendlyUnits: [],
		visibleEnemyUnits: [],
		visibleBuildings: [],
		visibleResources: [],
		minimapDots: [],
		gameTime: 0,
		mapCols: 30,
		mapRows: 30,
		...overrides,
	};
}

function makeMilitaryUnit(id: number, type = "mudfoot", x = 5, y = 5) {
	return {
		entityId: id,
		unitType: type,
		faction: "ura",
		tileX: x,
		tileY: y,
		hp: 80,
		maxHp: 80,
		armor: 2,
		damage: 12,
		range: 1,
		speed: 8,
		isGathering: false,
		hasOrders: false,
	};
}

function makeWorkerUnit(id: number, idle = true) {
	return {
		entityId: id,
		unitType: "river_rat",
		faction: "ura",
		tileX: 5,
		tileY: 5,
		hp: 40,
		maxHp: 40,
		armor: 0,
		damage: 5,
		range: 1,
		speed: 10,
		isGathering: !idle,
		hasOrders: false,
	};
}

function makeEnemyUnit(id: number, x = 10, y = 10) {
	return {
		entityId: id,
		unitType: "gator",
		faction: "scale_guard",
		tileX: x,
		tileY: y,
		hp: 120,
		maxHp: 120,
		armor: 4,
		damage: 18,
		range: 1,
		speed: 5,
		isGathering: false,
		hasOrders: false,
	};
}

function makeBarracks() {
	return {
		entityId: 100,
		unitType: "barracks",
		faction: "ura",
		tileX: 10,
		tileY: 10,
		hp: 350,
		maxHp: 350,
		isTraining: false,
		queueLength: 0,
	};
}

function makeCommandPost(x = 5, y = 5) {
	return {
		entityId: 101,
		unitType: "command_post",
		faction: "ura",
		tileX: x,
		tileY: y,
		hp: 600,
		maxHp: 600,
		isTraining: false,
		queueLength: 0,
	};
}

// ============================================================================
// REGISTRY
// ============================================================================

describe("US-101: Mission GOAP Profiles — Registry", () => {
	it("defines profiles for all 16 missions", () => {
		const ids = Object.keys(MISSION_PROFILES);
		expect(ids).toHaveLength(16);
		for (let i = 1; i <= 16; i++) {
			expect(ids).toContain(`mission_${i}`);
		}
	});

	it("each profile has missionId, name, description, and buildBrain", () => {
		for (const profile of Object.values(MISSION_PROFILES)) {
			expect(profile.missionId).toBeTruthy();
			expect(profile.name).toBeTruthy();
			expect(profile.description).toBeTruthy();
			expect(typeof profile.buildBrain).toBe("function");
		}
	});

	it("createMissionPlaytesterBrain returns a brain for every mission", () => {
		for (let i = 1; i <= 16; i++) {
			const brain = createMissionPlaytesterBrain(`mission_${i}`);
			expect(brain.evaluators.length).toBeGreaterThanOrEqual(2);
		}
	});

	it("createMissionPlaytesterBrain falls back to balanced for unknown mission", () => {
		const brain = createMissionPlaytesterBrain("mission_unknown");
		expect(brain.evaluators).toHaveLength(5);
	});
});

// ============================================================================
// MISSION 1: Beachhead — basic gather/build/attack
// ============================================================================

describe("Mission 1: Beachhead", () => {
	it("prioritizes economy when idle workers exist", () => {
		const brain = createMissionPlaytesterBrain("mission_1");
		const perception = makePerception({
			visibleFriendlyUnits: [makeWorkerUnit(1)],
			visibleResources: [
				{ entityId: 10, resourceType: "fish", tileX: 8, tileY: 5, remaining: 100 },
			],
		});

		brain.arbitrate(perception);
		const current = brain.currentSubgoal();
		expect(current).toBeInstanceOf(BuildEconomyGoal);
	});

	it("switches to defend when base is under threat", () => {
		const brain = createMissionPlaytesterBrain("mission_1");
		const perception = makePerception({
			visibleBuildings: [makeCommandPost()],
			visibleEnemyUnits: [makeEnemyUnit(20, 7, 5)],
		});

		brain.arbitrate(perception);
		expect(brain.currentSubgoal()).toBeInstanceOf(DefendBaseGoal);
	});
});

// ============================================================================
// MISSION 2: Causeway — escort-protect
// ============================================================================

describe("Mission 2: The Causeway", () => {
	it("brain includes an EscortEvaluator", () => {
		const brain = createMissionPlaytesterBrain("mission_2");
		const hasEscort = brain.evaluators.some((e) => e instanceof EscortEvaluator);
		expect(hasEscort).toBe(true);
	});

	it("selects EscortConvoyGoal when supply wagons are visible", () => {
		const brain = createMissionPlaytesterBrain("mission_2");
		const perception = makePerception({
			visibleFriendlyUnits: [
				makeMilitaryUnit(1),
				makeMilitaryUnit(2),
				{
					...makeMilitaryUnit(3),
					unitType: "supply_wagon",
				},
			],
		});

		brain.arbitrate(perception);
		expect(brain.currentSubgoal()).toBeInstanceOf(EscortConvoyGoal);
	});
});

// ============================================================================
// MISSION 3: Firebase Delta — capture-zone
// ============================================================================

describe("Mission 3: Firebase Delta", () => {
	it("brain includes a CaptureZoneEvaluator", () => {
		const brain = createMissionPlaytesterBrain("mission_3");
		const hasCapture = brain.evaluators.some((e) => e instanceof CaptureZoneEvaluator);
		expect(hasCapture).toBe(true);
	});

	it("selects CaptureZoneGoal when military units are available", () => {
		const brain = createMissionPlaytesterBrain("mission_3");
		const perception = makePerception({
			visibleFriendlyUnits: [
				makeMilitaryUnit(1),
				makeMilitaryUnit(2),
				makeMilitaryUnit(3),
			],
			visibleBuildings: [makeBarracks()],
		});

		brain.arbitrate(perception);
		expect(brain.currentSubgoal()).toBeInstanceOf(CaptureZoneGoal);
	});
});

// ============================================================================
// MISSION 4: Prison Break — stealth avoidance
// ============================================================================

describe("Mission 4: Prison Break", () => {
	it("brain includes a StealthEvaluator", () => {
		const brain = createMissionPlaytesterBrain("mission_4");
		const hasStealth = brain.evaluators.some((e) => e instanceof StealthEvaluator);
		expect(hasStealth).toBe(true);
	});

	it("selects StealthMoveGoal when hero is present", () => {
		const brain = createMissionPlaytesterBrain("mission_4");
		const perception = makePerception({
			visibleFriendlyUnits: [
				{ ...makeMilitaryUnit(1, "sgt_bubbles"), unitType: "sgt_bubbles" },
			],
		});

		brain.arbitrate(perception);
		expect(brain.currentSubgoal()).toBeInstanceOf(StealthMoveGoal);
	});

	it("stealth evaluator returns 0 when hero is absent", () => {
		const evaluator = new StealthEvaluator("sgt_bubbles", 15, 9);
		const perception = makePerception();
		expect(evaluator.calculateDesirability(perception)).toBe(0);
	});
});

// ============================================================================
// MISSION 5: Siphon Valley — multi-objective destroy
// ============================================================================

describe("Mission 5: Siphon Valley", () => {
	it("brain includes a DestroyTargetsEvaluator", () => {
		const brain = createMissionPlaytesterBrain("mission_5");
		const hasDestroy = brain.evaluators.some((e) => e instanceof DestroyTargetsEvaluator);
		expect(hasDestroy).toBe(true);
	});

	it("selects DestroyTargetGoal when army and enemies exist", () => {
		const brain = createMissionPlaytesterBrain("mission_5");
		const perception = makePerception({
			visibleFriendlyUnits: [
				makeMilitaryUnit(1),
				makeMilitaryUnit(2),
				makeMilitaryUnit(3),
			],
			visibleEnemyUnits: [makeEnemyUnit(20)],
		});

		brain.arbitrate(perception);
		expect(brain.currentSubgoal()).toBeInstanceOf(DestroyTargetGoal);
	});
});

// ============================================================================
// MISSION 6: Monsoon Ambush — wave defense with weather
// ============================================================================

describe("Mission 6: Monsoon Ambush", () => {
	it("brain includes a WeatherAwareDefenseEvaluator", () => {
		const brain = createMissionPlaytesterBrain("mission_6");
		const hasWeather = brain.evaluators.some(
			(e) => e instanceof WeatherAwareDefenseEvaluator,
		);
		expect(hasWeather).toBe(true);
	});

	it("selects DefendBaseGoal when base is under threat", () => {
		const brain = createMissionPlaytesterBrain("mission_6");
		const perception = makePerception({
			visibleBuildings: [makeCommandPost()],
			visibleEnemyUnits: [makeEnemyUnit(20, 7, 5)],
		});

		brain.arbitrate(perception);
		expect(brain.currentSubgoal()).toBeInstanceOf(DefendBaseGoal);
	});
});

// ============================================================================
// MISSION 7: River Rats — CTF flag-carry
// ============================================================================

describe("Mission 7: River Rats", () => {
	it("brain includes a FlagCarryEvaluator", () => {
		const brain = createMissionPlaytesterBrain("mission_7");
		const hasFlag = brain.evaluators.some((e) => e instanceof FlagCarryEvaluator);
		expect(hasFlag).toBe(true);
	});

	it("selects FlagCarryGoal when military units available", () => {
		const brain = createMissionPlaytesterBrain("mission_7");
		const perception = makePerception({
			visibleFriendlyUnits: [
				makeMilitaryUnit(1),
				makeMilitaryUnit(2),
			],
		});

		brain.arbitrate(perception);
		expect(brain.currentSubgoal()).toBeInstanceOf(FlagCarryGoal);
	});
});

// ============================================================================
// MISSION 8: Underwater Cache — submerged stealth
// ============================================================================

describe("Mission 8: Underwater Cache", () => {
	it("brain includes a SubmergedStealthEvaluator", () => {
		const brain = createMissionPlaytesterBrain("mission_8");
		const hasSub = brain.evaluators.some(
			(e) => e instanceof SubmergedStealthEvaluator,
		);
		expect(hasSub).toBe(true);
	});

	it("selects StealthMoveGoal when divers are present", () => {
		const brain = createMissionPlaytesterBrain("mission_8");
		const perception = makePerception({
			visibleFriendlyUnits: [makeMilitaryUnit(1, "diver")],
		});

		brain.arbitrate(perception);
		expect(brain.currentSubgoal()).toBeInstanceOf(StealthMoveGoal);
	});
});

// ============================================================================
// MISSION 9: Dense Canopy — fog-of-war skirmish
// ============================================================================

describe("Mission 9: Dense Canopy", () => {
	it("brain includes a FogSkirmishEvaluator", () => {
		const brain = createMissionPlaytesterBrain("mission_9");
		const hasFog = brain.evaluators.some((e) => e instanceof FogSkirmishEvaluator);
		expect(hasFog).toBe(true);
	});

	it("selects CautiousAdvanceGoal when map is barely explored", () => {
		const brain = createMissionPlaytesterBrain("mission_9");
		const perception = makePerception({
			exploredTiles: new Set(["0,0", "1,0"]),
			mapCols: 30,
			mapRows: 30,
			visibleFriendlyUnits: [makeMilitaryUnit(1)],
		});

		brain.arbitrate(perception);
		expect(brain.currentSubgoal()).toBeInstanceOf(CautiousAdvanceGoal);
	});
});

// ============================================================================
// MISSION 10: Healer's Grove — liberation sweep
// ============================================================================

describe("Mission 10: Healer's Grove", () => {
	it("brain includes a LiberationSweepEvaluator", () => {
		const brain = createMissionPlaytesterBrain("mission_10");
		const hasLiberation = brain.evaluators.some(
			(e) => e instanceof LiberationSweepEvaluator,
		);
		expect(hasLiberation).toBe(true);
	});

	it("selects VisitLocationsGoal when army is available", () => {
		const brain = createMissionPlaytesterBrain("mission_10");
		const perception = makePerception({
			visibleFriendlyUnits: [
				makeMilitaryUnit(1),
				makeMilitaryUnit(2),
				makeMilitaryUnit(3),
			],
		});

		brain.arbitrate(perception);
		expect(brain.currentSubgoal()).toBeInstanceOf(VisitLocationsGoal);
	});
});

// ============================================================================
// MISSION 11: Entrenchment — 12-wave defense
// ============================================================================

describe("Mission 11: Entrenchment", () => {
	it("brain includes a FortifyHoldEvaluator", () => {
		const brain = createMissionPlaytesterBrain("mission_11");
		const hasFortify = brain.evaluators.some(
			(e) => e instanceof FortifyHoldEvaluator,
		);
		expect(hasFortify).toBe(true);
	});

	it("selects FortifyBaseGoal between waves (no enemies visible)", () => {
		const brain = createMissionPlaytesterBrain("mission_11");
		const perception = makePerception({
			visibleBuildings: [makeCommandPost()],
			resources: { fish: 300, timber: 300, salvage: 200 },
		});

		brain.arbitrate(perception);
		expect(brain.currentSubgoal()).toBeInstanceOf(FortifyBaseGoal);
	});
});

// ============================================================================
// MISSION 12: The Stronghold — siege assault
// ============================================================================

describe("Mission 12: The Stronghold", () => {
	it("brain includes a SiegeAssaultEvaluator", () => {
		const brain = createMissionPlaytesterBrain("mission_12");
		const hasSiege = brain.evaluators.some(
			(e) => e instanceof SiegeAssaultEvaluator,
		);
		expect(hasSiege).toBe(true);
	});

	it("selects SiegeAssaultGoal when army is large enough", () => {
		const brain = createMissionPlaytesterBrain("mission_12");
		const perception = makePerception({
			visibleFriendlyUnits: [
				makeMilitaryUnit(1),
				makeMilitaryUnit(2),
				makeMilitaryUnit(3),
				makeMilitaryUnit(4),
				makeMilitaryUnit(5),
				makeMilitaryUnit(6),
			],
			visibleBuildings: [makeBarracks()],
		});

		brain.arbitrate(perception);
		expect(brain.currentSubgoal()).toBeInstanceOf(SiegeAssaultGoal);
	});
});

// ============================================================================
// MISSION 13: Supply Lines — multi-base logistics
// ============================================================================

describe("Mission 13: Supply Lines", () => {
	it("brain includes a MultiBaseLogisticsEvaluator", () => {
		const brain = createMissionPlaytesterBrain("mission_13");
		const hasLogistics = brain.evaluators.some(
			(e) => e instanceof MultiBaseLogisticsEvaluator,
		);
		expect(hasLogistics).toBe(true);
	});

	it("selects BuildEconomyGoal when idle workers exist", () => {
		const brain = createMissionPlaytesterBrain("mission_13");
		const perception = makePerception({
			visibleFriendlyUnits: [makeWorkerUnit(1)],
			visibleResources: [
				{ entityId: 10, resourceType: "fish", tileX: 8, tileY: 5, remaining: 100 },
			],
		});

		brain.arbitrate(perception);
		expect(brain.currentSubgoal()).toBeInstanceOf(BuildEconomyGoal);
	});
});

// ============================================================================
// MISSION 14: Gas Depot — hero demolition
// ============================================================================

describe("Mission 14: Gas Depot", () => {
	it("brain includes a HeroDemolitionEvaluator", () => {
		const brain = createMissionPlaytesterBrain("mission_14");
		const hasDemo = brain.evaluators.some(
			(e) => e instanceof HeroDemolitionEvaluator,
		);
		expect(hasDemo).toBe(true);
	});

	it("selects HeroDemolitionGoal when sapper is present", () => {
		const brain = createMissionPlaytesterBrain("mission_14");
		const perception = makePerception({
			visibleFriendlyUnits: [makeMilitaryUnit(1, "sapper")],
		});

		brain.arbitrate(perception);
		expect(brain.currentSubgoal()).toBeInstanceOf(HeroDemolitionGoal);
	});
});

// ============================================================================
// MISSION 15: Serpent's Lair — evacuation
// ============================================================================

describe("Mission 15: Serpent's Lair", () => {
	it("brain includes an EvacuationEvaluator", () => {
		const brain = createMissionPlaytesterBrain("mission_15");
		const hasEvac = brain.evaluators.some(
			(e) => e instanceof EvacuationEvaluator,
		);
		expect(hasEvac).toBe(true);
	});

	it("selects RetreatGoal when sludge timer is high", () => {
		const brain = createMissionPlaytesterBrain("mission_15");
		const perception = makePerception({
			gameTime: 400,
			visibleFriendlyUnits: [makeMilitaryUnit(1)],
		});

		brain.arbitrate(perception);
		expect(brain.currentSubgoal()).toBeInstanceOf(RetreatGoal);
	});

	it("evacuation evaluator urgency increases with time", () => {
		const evaluator = new EvacuationEvaluator(5, 5);
		const early = makePerception({ gameTime: 60 });
		const mid = makePerception({ gameTime: 200 });
		const late = makePerception({ gameTime: 400 });

		expect(evaluator.calculateDesirability(early)).toBe(0.4);
		expect(evaluator.calculateDesirability(mid)).toBe(0.8);
		expect(evaluator.calculateDesirability(late)).toBe(1.0);
	});
});

// ============================================================================
// MISSION 16: The Reckoning — 3-phase boss
// ============================================================================

describe("Mission 16: The Reckoning", () => {
	it("brain includes a BossPhaseEvaluator", () => {
		const brain = createMissionPlaytesterBrain("mission_16");
		const hasBoss = brain.evaluators.some(
			(e) => e instanceof BossPhaseEvaluator,
		);
		expect(hasBoss).toBe(true);
	});

	it("selects BossPhaseGoal when enemies are visible", () => {
		const brain = createMissionPlaytesterBrain("mission_16");
		const perception = makePerception({
			visibleFriendlyUnits: [
				makeMilitaryUnit(1),
				makeMilitaryUnit(2),
				makeMilitaryUnit(3),
			],
			visibleEnemyUnits: [makeEnemyUnit(20)],
			visibleBuildings: [makeBarracks()],
		});

		brain.arbitrate(perception);
		expect(brain.currentSubgoal()).toBeInstanceOf(BossPhaseGoal);
	});
});

// ============================================================================
// MISSION-SPECIFIC GOAL UNIT TESTS
// ============================================================================

describe("Mission-specific leaf goals", () => {
	it("MoveToPositionGoal produces rightClick at target tile", () => {
		const goal = new MoveToPositionGoal(10, 15);
		goal.activateIfInactive(makePerception());
		const actions = goal.execute(makePerception());
		expect(actions).toHaveLength(1);
		expect(actions[0].type).toBe("rightClick");
		expect(goal.completed()).toBe(true);
	});

	it("SelectHeroGoal produces click on hero unit", () => {
		const goal = new SelectHeroGoal("sgt_bubbles");
		const perception = makePerception({
			visibleFriendlyUnits: [
				{ ...makeMilitaryUnit(1, "sgt_bubbles"), unitType: "sgt_bubbles" },
			],
		});
		goal.activateIfInactive(perception);
		const actions = goal.execute(perception);
		expect(actions).toHaveLength(1);
		expect(actions[0].type).toBe("click");
		expect(goal.completed()).toBe(true);
	});

	it("SelectHeroGoal fails when hero not found", () => {
		const goal = new SelectHeroGoal("sgt_bubbles");
		const perception = makePerception();
		goal.activateIfInactive(perception);
		const actions = goal.execute(perception);
		expect(actions).toHaveLength(0);
		expect(goal.failed()).toBe(true);
	});
});

// ============================================================================
// CROSS-MISSION UNIQUENESS
// ============================================================================

describe("Cross-mission profile uniqueness", () => {
	it("each mission produces a brain with a unique evaluator composition", () => {
		const signatures = new Map<string, string>();
		for (let i = 1; i <= 16; i++) {
			const brain = createMissionPlaytesterBrain(`mission_${i}`);
			const sig = brain.evaluators
				.map((e) => `${e.constructor.name}:${e.characterBias.toFixed(2)}`)
				.sort()
				.join("|");
			signatures.set(`mission_${i}`, sig);
		}
		// All 16 should be unique
		const uniqueSigs = new Set(signatures.values());
		expect(uniqueSigs.size).toBe(16);
	});
});
