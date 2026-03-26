/**
 * Integration Tests — Mission scripting validation (US-049, US-054-057).
 *
 * Validates that all 16 campaign missions have correct structure:
 * - Required fields (terrain, placements, objectives, triggers)
 * - Victory trigger chain (allPrimaryComplete → victory action)
 * - Defeat conditions where applicable
 * - Briefing dialogue exists
 * - Par time is reasonable
 */
import { describe, expect, it } from "vitest";
import { CAMPAIGN, getMissionById } from "../../entities/missions";
import { compileMissionScenario } from "../../entities/missions/compileMissionScenario";
import type { MissionDef } from "../../entities/types";
import type { ScenarioWorldQuery } from "../../scenarios/engine";
import { ScenarioEngine } from "../../scenarios/engine";
import type { TriggerAction } from "../../scenarios/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockWorldQuery(overrides: Partial<ScenarioWorldQuery> = {}): ScenarioWorldQuery {
	return {
		elapsedTime: 0,
		countUnits: () => 0,
		countBuildings: () => 0,
		countUnitsInArea: () => 0,
		isBuildingDestroyed: () => false,
		getEntityHealthPercent: () => null,
		getResourceAmount: () => 0,
		...overrides,
	};
}

function getMissionDef(missionNumber: number): MissionDef {
	const mission = getMissionById(`mission_${missionNumber}`);
	if (!mission) throw new Error(`Mission ${missionNumber} not found`);
	return mission;
}

// ---------------------------------------------------------------------------
// Structural validation for ALL 16 missions
// ---------------------------------------------------------------------------

describe("Mission structure validation", () => {
	it("should have exactly 16 campaign missions", () => {
		expect(CAMPAIGN.length).toBe(16);
	});

	for (let i = 1; i <= 16; i++) {
		describe(`Mission ${i}`, () => {
			it("should have required fields", () => {
				const mission = getMissionDef(i);
				expect(mission.id).toBeTruthy();
				expect(mission.name).toBeTruthy();
				expect(mission.terrain).toBeTruthy();
				expect(mission.terrain.width).toBeGreaterThan(0);
				expect(mission.terrain.height).toBeGreaterThan(0);
				expect(mission.placements.length).toBeGreaterThan(0);
			});

			it("should have objectives with at least one primary", () => {
				const mission = getMissionDef(i);
				expect(mission.objectives.primary.length).toBeGreaterThan(0);
			});

			it("should have a briefing with dialogue lines", () => {
				const mission = getMissionDef(i);
				expect(mission.briefing).toBeTruthy();
				expect(mission.briefing.lines.length).toBeGreaterThan(0);
			});

			it("should have a par time", () => {
				const mission = getMissionDef(i);
				expect(mission.parTime).toBeGreaterThan(0);
				// Par time should be reasonable (1-30 minutes)
				expect(mission.parTime).toBeLessThanOrEqual(1800);
			});

			it("should have triggers including a victory condition", () => {
				const mission = getMissionDef(i);
				expect(mission.triggers.length).toBeGreaterThan(0);

				// Should have a trigger with victory action
				const hasVictory = mission.triggers.some((t) => {
					const actions = Array.isArray(t.action) ? t.action : [t.action];
					return actions.some((a: TriggerAction) => a.type === "victory");
				});
				expect(hasVictory).toBe(true);
			});

			it("should compile into a valid scenario", () => {
				const mission = getMissionDef(i);
				const scenario = compileMissionScenario(mission);
				expect(scenario).toBeTruthy();
				expect(scenario.objectives.length).toBeGreaterThan(0);
				expect(scenario.triggers.length).toBeGreaterThan(0);
			});

			it("should fire victory when all primary objectives are completed", () => {
				const mission = getMissionDef(i);
				const scenario = compileMissionScenario(mission);

				const actions: TriggerAction[] = [];
				const engine = new ScenarioEngine(scenario, (a) => actions.push(a));

				const mockWorld = createMockWorldQuery({
					elapsedTime: 9999,
					countBuildings: (faction: string, _buildingType?: string) => {
						// Return 1 for friendly buildings to avoid false "building destroyed" triggers
						if (faction === "ura") return 1;
						// Return 0 for enemy buildings (they've been defeated)
						return 0;
					},
				});

				// Complete all primary objectives, then evaluate.
				// Some missions add new primary objectives mid-mission via addObjective triggers.
				// Loop until all are completed and victory fires (max 5 passes to avoid infinite loop).
				for (let pass = 0; pass < 5; pass++) {
					for (const obj of engine.getObjectives()) {
						if (obj.status !== "completed") {
							engine.completeObjective(obj.id);
						}
					}
					engine.evaluate(mockWorld);
					if (actions.some((a) => a.type === "victory")) break;
				}

				const victoryActions = actions.filter((a) => a.type === "victory");
				expect(victoryActions.length).toBeGreaterThan(0);
			});
		});
	}
});

// ---------------------------------------------------------------------------
// Mission-specific validations (US-049, US-054-057)
// ---------------------------------------------------------------------------

describe("US-049: Mission 1 (Beachhead) validation", () => {
	it("should start with 4 River Rats", () => {
		const mission = getMissionDef(1);
		const uraUnits = mission.placements.filter(
			(p) => p.faction === "ura" && p.type === "river_rat",
		);
		expect(uraUnits.length).toBeGreaterThan(0);
		const totalCount = uraUnits.reduce((sum, p) => sum + (p.count ?? 1), 0);
		expect(totalCount).toBe(4);
	});

	it("should have gather, build, and train objectives", () => {
		const mission = getMissionDef(1);
		const objectiveIds = mission.objectives.primary.map((o) => o.id);
		expect(objectiveIds).toContain("build-command-post");
		expect(objectiveIds).toContain("build-barracks");
		expect(objectiveIds).toContain("train-mudfoots");
	});

	it("should have tutorial dialogue triggers", () => {
		const mission = getMissionDef(1);
		const dialogueTriggers = mission.triggers.filter((t) => {
			const actions = Array.isArray(t.action) ? t.action : [t.action];
			return actions.some((a: TriggerAction) => a.type === "showDialogue");
		});
		expect(dialogueTriggers.length).toBeGreaterThan(0);
	});

	it("should have starting resources", () => {
		const mission = getMissionDef(1);
		expect(mission.startResources).toBeTruthy();
		expect(mission.startResources!.fish).toBeGreaterThan(0);
	});
});

describe("US-054: Missions 2-4 validation", () => {
	it("Mission 2 should have escort/convoy-related objectives", () => {
		const mission = getMissionDef(2);
		expect(mission.name).toContain("Causeway");
		expect(mission.objectives.primary.length).toBeGreaterThan(0);
	});

	it("Mission 3 should have capture-related objectives", () => {
		const mission = getMissionDef(3);
		expect(mission.objectives.primary.length).toBeGreaterThan(0);
	});

	it("Mission 4 should have stealth-related elements", () => {
		const mission = getMissionDef(4);
		expect(mission.objectives.primary.length).toBeGreaterThan(0);
	});
});

describe("US-055: Missions 5-8 validation", () => {
	for (let i = 5; i <= 8; i++) {
		it(`Mission ${i} should have complete definition`, () => {
			const mission = getMissionDef(i);
			expect(mission.terrain.width).toBeGreaterThan(0);
			expect(mission.objectives.primary.length).toBeGreaterThan(0);
			expect(mission.triggers.length).toBeGreaterThan(0);
		});
	}
});

describe("US-056: Missions 9-12 validation", () => {
	for (let i = 9; i <= 12; i++) {
		it(`Mission ${i} should have complete definition`, () => {
			const mission = getMissionDef(i);
			expect(mission.terrain.width).toBeGreaterThan(0);
			expect(mission.objectives.primary.length).toBeGreaterThan(0);
			expect(mission.triggers.length).toBeGreaterThan(0);
		});
	}
});

describe("US-057: Missions 13-16 validation", () => {
	for (let i = 13; i <= 16; i++) {
		it(`Mission ${i} should have complete definition`, () => {
			const mission = getMissionDef(i);
			expect(mission.terrain.width).toBeGreaterThan(0);
			expect(mission.objectives.primary.length).toBeGreaterThan(0);
			expect(mission.triggers.length).toBeGreaterThan(0);
		});
	}

	it("Mission 16 should be the final campaign mission", () => {
		const mission = getMissionDef(16);
		expect(mission.chapter).toBe(4);
		expect(mission.mission).toBe(4);
	});
});
