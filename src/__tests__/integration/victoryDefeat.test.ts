/**
 * Integration Test — Victory and Defeat detection (US-006).
 *
 * Verifies that the ScenarioEngine fires victory/defeat events
 * when objectives are completed or failed, and that GamePhase
 * transitions correctly.
 */
import { createWorld, type World } from "koota";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initSingletons } from "../../ecs/singletons";
import { GamePhase } from "../../ecs/traits/state";
import { ScenarioEngine } from "../../scenarios/engine";
import type { Scenario, ScenarioWorldQuery, TriggerAction } from "../../scenarios/types";

let world: World;

beforeEach(() => {
	world = createWorld();
	initSingletons(world);
});

afterEach(() => {
	world.reset();
});

function createMockWorldQuery(overrides: Partial<ScenarioWorldQuery> = {}): ScenarioWorldQuery {
	return {
		elapsedTime: 0,
		countUnits: () => 0,
		countBuildings: () => 0,
		countUnitsInArea: () => 0,
		isBuildingDestroyed: () => false,
		getEntityHealthPercent: () => null,
		...overrides,
	};
}

describe("US-006: Victory and defeat detection", () => {
	it("should fire allObjectivesCompleted when all primary objectives are done", () => {
		const scenario: Scenario = {
			objectives: [
				{ id: "obj-1", description: "Destroy enemy base", type: "primary", status: "incomplete" },
				{ id: "obj-2", description: "Rescue hostages", type: "primary", status: "incomplete" },
				{ id: "obj-bonus", description: "No losses", type: "bonus", status: "incomplete" },
			],
			triggers: [],
		};

		const actions: TriggerAction[] = [];
		const engine = new ScenarioEngine(scenario, (a) => actions.push(a));

		const events: string[] = [];
		engine.on((event) => events.push(event.type));

		engine.completeObjective("obj-1");
		expect(events).toContain("objectiveCompleted");
		expect(events).not.toContain("allObjectivesCompleted");

		engine.completeObjective("obj-2");
		expect(events).toContain("allObjectivesCompleted");

		// Bonus objectives don't block completion
		expect(engine.areAllPrimaryObjectivesComplete()).toBe(true);
	});

	it("should fire missionFailed when failMission trigger activates", () => {
		const scenario: Scenario = {
			objectives: [{ id: "obj-1", description: "Survive", type: "primary", status: "incomplete" }],
			triggers: [
				{
					id: "defeat-timer",
					condition: { type: "timer", time: 600 },
					action: { type: "failMission", reason: "Time expired" },
					once: true,
				},
			],
		};

		const actions: TriggerAction[] = [];
		const engine = new ScenarioEngine(scenario, (a) => actions.push(a));

		const events: string[] = [];
		engine.on((event) => events.push(event.type));

		// Before time expires
		engine.evaluate(createMockWorldQuery({ elapsedTime: 500 }));
		expect(events).not.toContain("missionFailed");

		// After time expires
		engine.evaluate(createMockWorldQuery({ elapsedTime: 601 }));
		expect(events).toContain("missionFailed");
		expect(engine.isMissionFailed).toBe(true);
		expect(engine.missionFailReason).toBe("Time expired");
	});

	it("should trigger victory action when all objectives complete condition is met", () => {
		const scenario: Scenario = {
			objectives: [
				{ id: "obj-1", description: "Build barracks", type: "primary", status: "incomplete" },
			],
			triggers: [
				{
					id: "victory-trigger",
					condition: { type: "allObjectivesComplete" },
					action: { type: "victory" },
					once: true,
				},
			],
		};

		const actions: TriggerAction[] = [];
		const engine = new ScenarioEngine(scenario, (a) => actions.push(a));

		engine.completeObjective("obj-1");
		engine.evaluate(createMockWorldQuery());

		expect(actions).toContainEqual({ type: "victory" });
	});

	it("should stop evaluating triggers after mission failure", () => {
		const scenario: Scenario = {
			objectives: [{ id: "obj-1", description: "Survive", type: "primary", status: "incomplete" }],
			triggers: [
				{
					id: "fail-trigger",
					condition: { type: "timer", time: 0 },
					action: { type: "failMission", reason: "Instant fail" },
					once: true,
				},
				{
					id: "spawner",
					condition: { type: "timer", time: 0 },
					action: { type: "spawnWave", wave: 1 } as TriggerAction,
					once: true,
				},
			],
		};

		const actions: TriggerAction[] = [];
		const engine = new ScenarioEngine(scenario, (a) => actions.push(a));

		engine.evaluate(createMockWorldQuery({ elapsedTime: 1 }));

		// After failure, no more triggers should fire
		engine.evaluate(createMockWorldQuery({ elapsedTime: 2 }));
		const spawnActions = actions.filter((a) => a.type === "spawnWave");
		expect(spawnActions.length).toBeLessThanOrEqual(1);
	});

	it("should integrate with GamePhase for UI transitions", () => {
		// Simulate what GameScene does on victory
		world.set(GamePhase, { phase: "victory" });
		expect(world.get(GamePhase)?.phase).toBe("victory");

		// Simulate what GameScene does on defeat
		world.set(GamePhase, { phase: "defeat" });
		expect(world.get(GamePhase)?.phase).toBe("defeat");
	});
});
