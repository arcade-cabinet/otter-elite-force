import { describe, expect, it } from "vitest";
import { mission01Beachhead } from "../../entities/missions/chapter1/mission-01-beachhead";
import { compileMissionScenario } from "../../entities/missions/compileMissionScenario";

describe("compileMissionScenario", () => {
	it("compiles canonical mission data into a runtime scenario", () => {
		const scenario = compileMissionScenario(mission01Beachhead);

		expect(scenario.id).toBe("mission_1");
		expect(scenario.briefing.title).toContain("Beachhead");
		expect(scenario.objectives.map((objective) => objective.id)).toEqual([
			"build-command-post",
			"build-barracks",
			"train-mudfoots",
			"gather-salvage",
		]);
		expect(scenario.startConditions.populationCap).toBe(mission01Beachhead.startPopCap);
	});

	it("resolves mission zone references into typed runtime triggers", () => {
		const scenario = compileMissionScenario(mission01Beachhead);
		const tutorialTrigger = scenario.triggers.find(
			(trigger) => trigger.id === "enemy-scout-arrival",
		);

		expect(tutorialTrigger?.condition).toEqual({ type: "timer", time: 300 });
		expect(tutorialTrigger?.action).toEqual([
			{
				type: "showDialogue",
				portrait: "foxhound",
				speaker: "FOXHOUND",
				text: "Heads up — Scale-Guard scouts spotted near your position. Stay sharp, Bubbles.",
			},
			{
				type: "spawnUnits",
				unitType: "scout_lizard",
				faction: "scale_guard",
				position: { x: 25, y: 2 },
				count: 2,
			},
		]);

		const areaTrigger = scenario.triggers.find((trigger) => trigger.id === "salvage-found");
		expect(areaTrigger?.condition).toEqual({
			type: "areaEntered",
			faction: "ura",
			area: mission01Beachhead.zones.salvage_area,
		});
	});
});
