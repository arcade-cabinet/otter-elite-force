import { beforeEach, describe, expect, it, vi } from "vitest";
import { ScenarioEngine, type ScenarioWorldQuery } from "../../scenarios/engine";
import type { Objective, Scenario, ScenarioTrigger } from "../../scenarios/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockWorldQuery(overrides: Partial<ScenarioWorldQuery> = {}): ScenarioWorldQuery {
	return {
		elapsedTime: 0,
		countUnits: vi.fn(() => 0),
		countBuildings: vi.fn(() => 0),
		countUnitsInArea: vi.fn(() => 0),
		isBuildingDestroyed: vi.fn(() => false),
		getEntityHealthPercent: vi.fn(() => 100),
		...overrides,
	};
}

function createObjective(overrides: Partial<Objective> = {}): Objective {
	return {
		id: "obj-1",
		description: "Test objective",
		type: "primary",
		status: "active",
		...overrides,
	};
}

function createTrigger(overrides: Partial<ScenarioTrigger> = {}): ScenarioTrigger {
	return {
		id: "trigger-1",
		condition: { type: "timer", time: 10 },
		action: {
			type: "spawnUnits",
			unitType: "gator",
			count: 3,
			faction: "scale_guard",
			position: { x: 5, y: 5 },
		},
		once: true,
		...overrides,
	};
}

function createScenario(overrides: Partial<Scenario> = {}): Scenario {
	return {
		id: "test-scenario",
		chapter: 1,
		mission: 1,
		name: "Test Mission",
		briefing: {
			title: "Test Briefing",
			lines: [],
			objectives: [],
		},
		startConditions: {},
		objectives: [createObjective()],
		triggers: [createTrigger()],
		...overrides,
	};
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ScenarioEngine", () => {
	let actionHandler: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		actionHandler = vi.fn();
	});

	describe("Timer trigger", () => {
		it("should not fire before time threshold", () => {
			const engine = new ScenarioEngine(createScenario(), actionHandler);
			const world = createMockWorldQuery({ elapsedTime: 5 });

			engine.evaluate(world);

			expect(actionHandler).not.toHaveBeenCalled();
		});

		it("should fire when time threshold is reached", () => {
			const engine = new ScenarioEngine(createScenario(), actionHandler);
			const world = createMockWorldQuery({ elapsedTime: 10 });

			engine.evaluate(world);

			expect(actionHandler).toHaveBeenCalledTimes(1);
			expect(actionHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "spawnUnits",
					unitType: "gator",
					count: 3,
				}),
			);
		});

		it("should fire when time exceeds threshold", () => {
			const engine = new ScenarioEngine(createScenario(), actionHandler);
			const world = createMockWorldQuery({ elapsedTime: 15 });

			engine.evaluate(world);

			expect(actionHandler).toHaveBeenCalledTimes(1);
		});

		it("should not fire a once-trigger more than once", () => {
			const engine = new ScenarioEngine(createScenario(), actionHandler);
			const world = createMockWorldQuery({ elapsedTime: 10 });

			engine.evaluate(world);
			engine.evaluate(world);

			expect(actionHandler).toHaveBeenCalledTimes(1);
		});

		it("should fire repeating triggers multiple times", () => {
			const scenario = createScenario({
				triggers: [createTrigger({ once: false })],
			});
			const engine = new ScenarioEngine(scenario, actionHandler);
			const world = createMockWorldQuery({ elapsedTime: 10 });

			engine.evaluate(world);
			engine.evaluate(world);

			expect(actionHandler).toHaveBeenCalledTimes(2);
		});
	});

	describe("UnitCount trigger", () => {
		it("should fire when unit count meets gte threshold", () => {
			const scenario = createScenario({
				triggers: [
					createTrigger({
						condition: {
							type: "unitCount",
							faction: "ura",
							unitType: "mudfoot",
							operator: "gte",
							count: 4,
						},
					}),
				],
			});
			const engine = new ScenarioEngine(scenario, actionHandler);
			const world = createMockWorldQuery({
				countUnits: vi.fn(() => 4),
			});

			engine.evaluate(world);

			expect(actionHandler).toHaveBeenCalledTimes(1);
			expect(world.countUnits).toHaveBeenCalledWith("ura", "mudfoot");
		});

		it("should not fire when unit count is below gte threshold", () => {
			const scenario = createScenario({
				triggers: [
					createTrigger({
						condition: {
							type: "unitCount",
							faction: "ura",
							operator: "gte",
							count: 4,
						},
					}),
				],
			});
			const engine = new ScenarioEngine(scenario, actionHandler);
			const world = createMockWorldQuery({
				countUnits: vi.fn(() => 3),
			});

			engine.evaluate(world);

			expect(actionHandler).not.toHaveBeenCalled();
		});

		it("should fire when unit count meets lte threshold", () => {
			const scenario = createScenario({
				triggers: [
					createTrigger({
						condition: {
							type: "unitCount",
							faction: "scale_guard",
							operator: "lte",
							count: 0,
						},
					}),
				],
			});
			const engine = new ScenarioEngine(scenario, actionHandler);
			const world = createMockWorldQuery({ countUnits: vi.fn(() => 0) });

			engine.evaluate(world);

			expect(actionHandler).toHaveBeenCalledTimes(1);
		});

		it("should fire when unit count matches eq threshold", () => {
			const scenario = createScenario({
				triggers: [
					createTrigger({
						condition: {
							type: "unitCount",
							faction: "ura",
							operator: "eq",
							count: 5,
						},
					}),
				],
			});
			const engine = new ScenarioEngine(scenario, actionHandler);
			const world = createMockWorldQuery({ countUnits: vi.fn(() => 5) });

			engine.evaluate(world);

			expect(actionHandler).toHaveBeenCalledTimes(1);
		});
	});

	describe("AreaEntered trigger", () => {
		it("should fire when units enter the area", () => {
			const area = { x: 10, y: 10, width: 5, height: 5 };
			const scenario = createScenario({
				triggers: [
					createTrigger({
						condition: {
							type: "areaEntered",
							faction: "ura",
							area,
						},
					}),
				],
			});
			const engine = new ScenarioEngine(scenario, actionHandler);
			const world = createMockWorldQuery({
				countUnitsInArea: vi.fn(() => 1),
			});

			engine.evaluate(world);

			expect(actionHandler).toHaveBeenCalledTimes(1);
			expect(world.countUnitsInArea).toHaveBeenCalledWith("ura", area, undefined);
		});

		it("should not fire when not enough units in area", () => {
			const scenario = createScenario({
				triggers: [
					createTrigger({
						condition: {
							type: "areaEntered",
							faction: "ura",
							area: { x: 0, y: 0, width: 5, height: 5 },
							minUnits: 3,
						},
					}),
				],
			});
			const engine = new ScenarioEngine(scenario, actionHandler);
			const world = createMockWorldQuery({
				countUnitsInArea: vi.fn(() => 2),
			});

			engine.evaluate(world);

			expect(actionHandler).not.toHaveBeenCalled();
		});
	});

		describe("BuildingCount trigger", () => {
			it("should fire when building count meets threshold", () => {
				const scenario = createScenario({
					triggers: [
						createTrigger({
							condition: {
								type: "buildingCount",
								faction: "ura",
								buildingType: "dock",
								operator: "gte",
								count: 3,
							},
						}),
					],
				});
				const engine = new ScenarioEngine(scenario, actionHandler);
				const world = createMockWorldQuery({ countBuildings: vi.fn(() => 3) });

				engine.evaluate(world);

				expect(world.countBuildings).toHaveBeenCalledWith("ura", "dock");
				expect(actionHandler).toHaveBeenCalledTimes(1);
			});
		});

	describe("BuildingDestroyed trigger", () => {
		it("should fire when building is destroyed", () => {
			const scenario = createScenario({
				triggers: [
					createTrigger({
						condition: {
							type: "buildingDestroyed",
							buildingTag: "siphon-1",
						},
					}),
				],
			});
			const engine = new ScenarioEngine(scenario, actionHandler);
			const world = createMockWorldQuery({
				isBuildingDestroyed: vi.fn(() => true),
			});

			engine.evaluate(world);

			expect(actionHandler).toHaveBeenCalledTimes(1);
			expect(world.isBuildingDestroyed).toHaveBeenCalledWith("siphon-1");
		});
	});

	describe("ObjectiveComplete trigger", () => {
		it("should fire when referenced objective is completed", () => {
			const scenario = createScenario({
				objectives: [createObjective({ id: "build-barracks" })],
				triggers: [
					createTrigger({
						id: "after-barracks",
						condition: {
							type: "objectiveComplete",
							objectiveId: "build-barracks",
						},
						action: {
							type: "showDialogue",
							portrait: "foxhound",
							speaker: "FOXHOUND",
							text: "Barracks operational!",
						},
					}),
				],
			});
			const engine = new ScenarioEngine(scenario, actionHandler);
			const world = createMockWorldQuery();

			// Before completion — should not fire
			engine.evaluate(world);
			expect(actionHandler).not.toHaveBeenCalled();

			// Complete the objective
			engine.completeObjective("build-barracks");

			// Now the trigger should fire
			engine.evaluate(world);
			expect(actionHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "showDialogue",
					speaker: "FOXHOUND",
				}),
			);
		});
	});

	describe("AllObjectivesComplete trigger", () => {
		it("should fire when all primary objectives are completed", () => {
			const scenario = createScenario({
				objectives: [
					createObjective({ id: "obj-a", type: "primary" }),
					createObjective({ id: "obj-b", type: "primary" }),
					createObjective({ id: "obj-c", type: "bonus" }),
				],
				triggers: [
					createTrigger({
						condition: { type: "allObjectivesComplete" },
					}),
				],
			});
			const engine = new ScenarioEngine(scenario, actionHandler);
			const world = createMockWorldQuery();

			// Not all complete yet
			engine.completeObjective("obj-a");
			engine.evaluate(world);
			expect(actionHandler).not.toHaveBeenCalled();

			// Complete all primary (bonus doesn't matter)
			engine.completeObjective("obj-b");
			engine.evaluate(world);
			expect(actionHandler).toHaveBeenCalledTimes(1);
		});
	});

	describe("HealthThreshold trigger", () => {
		it("should fire when entity health drops below threshold", () => {
			const scenario = createScenario({
				triggers: [
					createTrigger({
						condition: {
							type: "healthThreshold",
							entityTag: "command-post",
							percentage: 30,
							operator: "below",
						},
						action: {
							type: "showDialogue",
							portrait: "foxhound",
							speaker: "FOXHOUND",
							text: "Command Post critical!",
						},
					}),
				],
			});
			const engine = new ScenarioEngine(scenario, actionHandler);
			const world = createMockWorldQuery({
				getEntityHealthPercent: vi.fn(() => 25),
			});

			engine.evaluate(world);

			expect(actionHandler).toHaveBeenCalledTimes(1);
		});

		it("should not fire when entity health is above threshold", () => {
			const scenario = createScenario({
				triggers: [
					createTrigger({
						condition: {
							type: "healthThreshold",
							entityTag: "hero",
							percentage: 30,
							operator: "below",
						},
					}),
				],
			});
			const engine = new ScenarioEngine(scenario, actionHandler);
			const world = createMockWorldQuery({
				getEntityHealthPercent: vi.fn(() => 50),
			});

			engine.evaluate(world);

			expect(actionHandler).not.toHaveBeenCalled();
		});

		it("should handle null (missing entity) gracefully", () => {
			const scenario = createScenario({
				triggers: [
					createTrigger({
						condition: {
							type: "healthThreshold",
							entityTag: "missing",
							percentage: 50,
							operator: "below",
						},
					}),
				],
			});
			const engine = new ScenarioEngine(scenario, actionHandler);
			const world = createMockWorldQuery({
				getEntityHealthPercent: vi.fn(() => null),
			});

			engine.evaluate(world);

			expect(actionHandler).not.toHaveBeenCalled();
		});
	});

	describe("Multiple actions per trigger", () => {
		it("should execute all actions when trigger fires", () => {
			const scenario = createScenario({
				triggers: [
					createTrigger({
						condition: { type: "timer", time: 5 },
						action: [
							{
								type: "showDialogue",
								portrait: "foxhound",
								speaker: "FOXHOUND",
								text: "Incoming!",
							},
							{
								type: "spawnUnits",
								unitType: "gator",
								count: 5,
								faction: "scale_guard",
								position: { x: 20, y: 0 },
							},
						],
					}),
				],
			});
			const engine = new ScenarioEngine(scenario, actionHandler);
			const world = createMockWorldQuery({ elapsedTime: 5 });

			engine.evaluate(world);

			expect(actionHandler).toHaveBeenCalledTimes(2);
			expect(actionHandler).toHaveBeenCalledWith(expect.objectContaining({ type: "showDialogue" }));
			expect(actionHandler).toHaveBeenCalledWith(expect.objectContaining({ type: "spawnUnits" }));
		});
	});

	describe("Disabled triggers", () => {
		it("should skip disabled triggers", () => {
			const scenario = createScenario({
				triggers: [createTrigger({ enabled: false })],
			});
			const engine = new ScenarioEngine(scenario, actionHandler);
			const world = createMockWorldQuery({ elapsedTime: 100 });

			engine.evaluate(world);

			expect(actionHandler).not.toHaveBeenCalled();
		});
	});

	describe("Objective tracking", () => {
		it("should track objective completion", () => {
			const engine = new ScenarioEngine(createScenario(), actionHandler);

			expect(engine.getObjectiveStatus("obj-1")).toBe("active");

			engine.completeObjective("obj-1");

			expect(engine.getObjectiveStatus("obj-1")).toBe("completed");
		});

		it("should not re-complete an already completed objective", () => {
			const listener = vi.fn();
			const engine = new ScenarioEngine(createScenario(), actionHandler);
			engine.on(listener);

			engine.completeObjective("obj-1");
			engine.completeObjective("obj-1");

			const completionEvents = listener.mock.calls.filter(([e]) => e.type === "objectiveCompleted");
			expect(completionEvents).toHaveLength(1);
		});

		it("should fail objectives", () => {
			const engine = new ScenarioEngine(createScenario(), actionHandler);

			engine.failObjective("obj-1");

			expect(engine.getObjectiveStatus("obj-1")).toBe("failed");
		});

		it("should not fail an already completed objective", () => {
			const engine = new ScenarioEngine(createScenario(), actionHandler);

			engine.completeObjective("obj-1");
			engine.failObjective("obj-1");

			expect(engine.getObjectiveStatus("obj-1")).toBe("completed");
		});

		it("should emit allObjectivesCompleted when all primary objectives done", () => {
			const listener = vi.fn();
			const scenario = createScenario({
				objectives: [
					createObjective({ id: "a", type: "primary" }),
					createObjective({ id: "b", type: "primary" }),
				],
			});
			const engine = new ScenarioEngine(scenario, actionHandler);
			engine.on(listener);

			engine.completeObjective("a");
			engine.completeObjective("b");

			const allComplete = listener.mock.calls.filter(([e]) => e.type === "allObjectivesCompleted");
			expect(allComplete).toHaveLength(1);
		});

		it("should list all objectives with statuses", () => {
			const scenario = createScenario({
				objectives: [
					createObjective({ id: "a", status: "active" }),
					createObjective({ id: "b", status: "pending" }),
				],
			});
			const engine = new ScenarioEngine(scenario, actionHandler);

			const objs = engine.getObjectives();
			expect(objs).toEqual([
				{ id: "a", status: "active" },
				{ id: "b", status: "pending" },
			]);
		});
	});

	describe("Mission failure", () => {
		it("should stop evaluating triggers after mission failure", () => {
			const scenario = createScenario({
				triggers: [
					createTrigger({
						id: "fail-trigger",
						condition: { type: "timer", time: 5 },
						action: { type: "failMission", reason: "Time's up" },
					}),
					createTrigger({
						id: "should-not-fire",
						condition: { type: "timer", time: 5 },
						action: {
							type: "showDialogue",
							portrait: "foxhound",
							speaker: "FOXHOUND",
							text: "This should not show",
						},
						once: true,
					}),
				],
			});
			const engine = new ScenarioEngine(scenario, actionHandler);
			const world = createMockWorldQuery({ elapsedTime: 5 });

			engine.evaluate(world);

			expect(engine.isMissionFailed).toBe(true);
			expect(engine.missionFailReason).toBe("Time's up");

			// Second evaluate should do nothing
			actionHandler.mockClear();
			engine.evaluate(world);
			expect(actionHandler).not.toHaveBeenCalled();
		});

		it("should emit missionFailed event", () => {
			const listener = vi.fn();
			const scenario = createScenario({
				triggers: [
					createTrigger({
						condition: { type: "timer", time: 0 },
						action: { type: "failMission", reason: "Base destroyed" },
					}),
				],
			});
			const engine = new ScenarioEngine(scenario, actionHandler);
			engine.on(listener);

			engine.evaluate(createMockWorldQuery({ elapsedTime: 0 }));

			expect(listener).toHaveBeenCalledWith({
				type: "missionFailed",
				reason: "Base destroyed",
			});
		});
	});

	describe("Event system", () => {
		it("should emit triggerFired events", () => {
			const listener = vi.fn();
			const engine = new ScenarioEngine(createScenario(), actionHandler);
			engine.on(listener);

			engine.evaluate(createMockWorldQuery({ elapsedTime: 10 }));

			expect(listener).toHaveBeenCalledWith({
				type: "triggerFired",
				triggerId: "trigger-1",
			});
		});

		it("should allow unsubscribing from events", () => {
			const listener = vi.fn();
			const engine = new ScenarioEngine(createScenario(), actionHandler);
			const unsub = engine.on(listener);

			unsub();
			engine.evaluate(createMockWorldQuery({ elapsedTime: 10 }));

			expect(listener).not.toHaveBeenCalled();
		});
	});

	describe("Reset", () => {
		it("should reset all state on reset()", () => {
			const scenario = createScenario();
			const engine = new ScenarioEngine(scenario, actionHandler);
			const world = createMockWorldQuery({ elapsedTime: 10 });

			// Fire trigger and complete objective
			engine.evaluate(world);
			engine.completeObjective("obj-1");

			expect(engine.hasTriggerFired("trigger-1")).toBe(true);
			expect(engine.getObjectiveStatus("obj-1")).toBe("completed");

			// Reset
			engine.reset();

			expect(engine.hasTriggerFired("trigger-1")).toBe(false);
			expect(engine.getObjectiveStatus("obj-1")).toBe("active");
			expect(engine.isMissionFailed).toBe(false);

			// Should be able to fire trigger again
			actionHandler.mockClear();
			engine.evaluate(world);
			expect(actionHandler).toHaveBeenCalledTimes(1);
		});
	});

	describe("CompleteObjective action", () => {
		it("should complete objective when completeObjective action fires", () => {
			const scenario = createScenario({
				objectives: [createObjective({ id: "train-mudfoots" })],
				triggers: [
					createTrigger({
						condition: {
							type: "unitCount",
							faction: "ura",
							unitType: "mudfoot",
							operator: "gte",
							count: 4,
						},
						action: {
							type: "completeObjective",
							objectiveId: "train-mudfoots",
						},
					}),
				],
			});
			const engine = new ScenarioEngine(scenario, actionHandler);
			const world = createMockWorldQuery({
				countUnits: vi.fn(() => 4),
			});

			engine.evaluate(world);

			expect(engine.getObjectiveStatus("train-mudfoots")).toBe("completed");
			expect(actionHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "completeObjective",
					objectiveId: "train-mudfoots",
				}),
			);
		});
	});
});
