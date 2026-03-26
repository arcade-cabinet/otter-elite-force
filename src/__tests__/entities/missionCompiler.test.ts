import { describe, expect, it } from "vitest";
import { mission01Beachhead } from "../../entities/missions/chapter1/mission-01-beachhead";
import { compileMissionScenario } from "../../entities/missions/compileMissionScenario";

describe("compileMissionScenario", () => {
	it("compiles canonical mission data into a runtime scenario", () => {
		const scenario = compileMissionScenario(mission01Beachhead);

		expect(scenario.id).toBe("mission_1");
		expect(scenario.briefing.title).toContain("Beachhead");
		expect(scenario.objectives.map((objective) => objective.id)).toEqual([
			"gather-timber",
			"build-command-post",
			"build-barracks",
			"train-mudfoots",
			"repair-bridge",
			"cross-river",
			"destroy-outpost",
			"bonus-salvage",
		]);
		expect(scenario.startConditions.populationCap).toBe(mission01Beachhead.startPopCap);
	});

	it("resolves mission zone references into typed runtime triggers", () => {
		const scenario = compileMissionScenario(mission01Beachhead);

		// FOXHOUND welcome trigger at 15s
		const welcomeTrigger = scenario.triggers.find(
			(trigger) => trigger.id === "phase:landfall:foxhound-welcome",
		);
		expect(welcomeTrigger?.condition).toEqual({ type: "timer", time: 15 });

		// Salvage discovery trigger uses salvage_field zone
		const salvageTrigger = scenario.triggers.find((trigger) => trigger.id === "salvage-discovery");
		expect(salvageTrigger?.condition).toEqual({
			type: "areaEntered",
			faction: "ura",
			area: mission01Beachhead.zones.salvage_field,
		});
	});
});
