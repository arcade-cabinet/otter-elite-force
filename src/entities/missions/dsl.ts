import type { TriggerAction } from "@/scenarios/types";
import type { MissionObjective, MissionScenarioTrigger, MissionTriggerCondition } from "../types";

const SPEAKER_NAMES: Record<string, string> = {
	foxhound: "FOXHOUND",
	gen_whiskers: "Gen. Whiskers",
	sgt_fang: "Sgt. Fang",
	cpl_splash: "Cpl. Splash",
	sgt_bubbles: "Sgt. Bubbles",
	medic_marina: "Medic Marina",
	pvt_muskrat: "Pvt. Muskrat",
};

function toSpeakerName(id: string): string {
	return (
		SPEAKER_NAMES[id] ??
		id
			.split("_")
			.map((part) => part[0].toUpperCase() + part.slice(1))
			.join(" ")
	);
}

export function objective(id: string, description: string): MissionObjective {
	return { id, description };
}

export function trigger(
	id: string,
	condition: MissionTriggerCondition,
	action: TriggerAction | TriggerAction[],
	options: Pick<MissionScenarioTrigger, "once" | "enabled"> = {},
): MissionScenarioTrigger {
	return {
		id,
		condition,
		action,
		once: options.once ?? true,
		...(options.enabled === undefined ? {} : { enabled: options.enabled }),
	};
}

export const on = {
	timer(time: number): MissionTriggerCondition {
		return { type: "timer", time };
	},
	areaEntered(
		faction: string,
		zoneId: string,
		options: { unitType?: string; minUnits?: number } = {},
	): MissionTriggerCondition {
		return { type: "areaEntered", faction, zoneId, ...options };
	},
	unitCount(
		faction: string,
		unitType: string,
		operator: "gte" | "lte" | "eq",
		count: number,
	): MissionTriggerCondition {
		return { type: "unitCount", faction, unitType, operator, count };
	},
	buildingCount(
		faction: string,
		buildingType: string,
		operator: "gte" | "lte" | "eq",
		count: number,
	): MissionTriggerCondition {
		return { type: "buildingCount", faction, buildingType, operator, count };
	},
	objectiveComplete(objectiveId: string): MissionTriggerCondition {
		return { type: "objectiveComplete", objectiveId };
	},
	allPrimaryComplete(): MissionTriggerCondition {
		return { type: "allObjectivesComplete" };
	},
};

export const act = {
	completeObjective(objectiveId: string): TriggerAction {
		return { type: "completeObjective", objectiveId };
	},
	dialogue(portrait: string, text: string): TriggerAction {
		return {
			type: "showDialogue",
			portrait,
			speaker: toSpeakerName(portrait),
			text,
		};
	},
	spawn(unitType: string, faction: string, x: number, y: number, count = 1): TriggerAction {
		return {
			type: "spawnUnits",
			unitType,
			faction,
			position: { x, y },
			count,
		};
	},
	failMission(reason = "Mission failed"): TriggerAction {
		return { type: "failMission", reason };
	},
	victory(): TriggerAction {
		return { type: "victory" };
	},
	enableTrigger(triggerId: string): TriggerAction {
		return { type: "enableTrigger", triggerId };
	},
	/**
	 * Trigger a multi-line dialogue exchange.
	 * Pauses the game, shows the portrait overlay, player advances with Space/tap.
	 * Use for mid-mission conversations (e.g., rescue cutscenes, boss taunts).
	 *
	 * @example
	 * act.exchange([
	 *   { speaker: "Gen. Whiskers", text: "I was starting to think command had written me off." },
	 *   { speaker: "Sgt. Bubbles", text: "Not a chance, General. Can you walk?" },
	 *   { speaker: "Gen. Whiskers", text: "I can fight. Let's move." },
	 * ])
	 */
	exchange(
		lines: Array<{ speaker: string; text: string; portraitId?: string }>,
		pauseGame = true,
	): TriggerAction {
		return { type: "showDialogueExchange", lines, pauseGame };
	},
};
