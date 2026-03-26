import type { Objective, Scenario, ScenarioTrigger, TriggerCondition } from "@/scenarios/types";
import { deriveMissionSeedPhrase } from "@/engine";
import type { MissionDef } from "../types";

function compileCondition(
	condition: MissionDef["triggers"][number]["condition"],
	mission: MissionDef,
): TriggerCondition {
	if (condition.type !== "areaEntered") return condition;

	const zone = mission.zones[condition.zoneId];
	if (!zone) throw new Error(`Unknown mission zone '${condition.zoneId}' in ${mission.id}`);

	return {
		type: "areaEntered",
		faction: condition.faction,
		unitType: condition.unitType,
		minUnits: condition.minUnits,
		area: zone,
	};
}

function compileObjective(
	type: Objective["type"],
	objective: { id: string; description: string },
): Objective {
	return {
		id: objective.id,
		description: objective.description,
		type,
		status: "active",
	};
}

export function compileMissionScenario(mission: MissionDef): Scenario {
	const objectives = [
		...mission.objectives.primary.map((objective) => compileObjective("primary", objective)),
		...mission.objectives.bonus.map((objective) => compileObjective("bonus", objective)),
	];

	const triggers: ScenarioTrigger[] = mission.triggers.map((trigger) => {
		return {
			id: trigger.id,
			condition: compileCondition(trigger.condition, mission),
			action: trigger.action,
			once: trigger.once ?? true,
			enabled: trigger.enabled,
		};
	});

	return {
		id: mission.id,
		chapter: mission.chapter,
		mission: mission.mission,
		name: mission.name,
		briefing: {
			title: mission.subtitle ? `${mission.name} — ${mission.subtitle}` : mission.name,
			lines: mission.briefing.lines.map((line) => ({
				portrait: mission.briefing.portraitId,
				speaker: line.speaker,
				text: line.text,
			})),
			objectives: objectives.map((objective) => ({
				description: objective.description,
				type: objective.type,
			})),
		},
		startConditions: {
			resources: { ...mission.startResources },
			populationCap: mission.startPopCap,
		},
		objectives,
		triggers,
		seedPhrase: mission.seedPhrase ?? deriveMissionSeedPhrase(mission.id),
		unitUnlocks: mission.unlocks?.units,
		buildingUnlocks: mission.unlocks?.buildings,
	};
}
