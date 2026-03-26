import type { TriggerAction } from "@/scenarios/types";
import type { MissionObjective, MissionScenarioTrigger, MissionTriggerCondition } from "../types";

const SPEAKER_NAMES: Record<string, string> = {
	foxhound: "FOXHOUND",
	gen_whiskers: "Gen. Whiskers",
	sgt_fang: "Sgt. Fang",
	cpl_splash: "Cpl. Splash",
	sgt_bubbles: "Col. Bubbles",
	col_bubbles: "Col. Bubbles",
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
	buildingDestroyed(buildingTag: string): MissionTriggerCondition {
		return { type: "buildingDestroyed", buildingTag };
	},
	healthThreshold(
		entityTag: string,
		percentage: number,
		operator: "below" | "above",
	): MissionTriggerCondition {
		return { type: "healthThreshold", entityTag, percentage, operator };
	},
	resourceThreshold(
		resource: "fish" | "timber" | "salvage",
		operator: "gte" | "lte" | "eq",
		amount: number,
	): MissionTriggerCondition {
		return { type: "resourceThreshold", resource, operator, amount };
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
	 *   { speaker: "Col. Bubbles", text: "The Captain has your extraction, General." },
	 *   { speaker: "Gen. Whiskers", text: "I can fight. Let's move." },
	 * ])
	 */
	exchange(
		lines: Array<{ speaker: string; text: string; portraitId?: string }>,
		pauseGame = true,
	): TriggerAction {
		return { type: "showDialogueExchange", lines, pauseGame };
	},
	revealZone(zoneId: string): TriggerAction {
		return { type: "revealZone", zoneId };
	},
	lockZone(zoneId: string): TriggerAction {
		return { type: "lockZone", zoneId };
	},
	unlockZone(zoneId: string): TriggerAction {
		return { type: "unlockZone", zoneId };
	},
	panCamera(x: number, y: number, duration: number): TriggerAction {
		return { type: "panCamera", target: { x, y }, duration };
	},
	addObjective(id: string, description: string, type: "primary" | "bonus"): TriggerAction {
		return { type: "addObjective", id, description, objectiveType: type };
	},
	startPhase(phaseName: string): TriggerAction {
		return { type: "startPhase", phase: phaseName };
	},
	changeWeather(weather: "clear" | "rain" | "monsoon"): TriggerAction {
		return { type: "changeWeather", weather };
	},
	grantResource(resource: "fish" | "timber" | "salvage", amount: number): TriggerAction {
		return { type: "grantResource", resource, amount };
	},
	/**
	 * Spawn a boss / super-unit via the scenario trigger system.
	 * At runtime the scenario engine calls `spawnBossUnit()` from `src/entities/spawner.ts`
	 * using the config embedded in this action payload.
	 *
	 * @example
	 * act.spawnBossUnit({
	 *   name: "Kommandant Ironjaw",
	 *   unitType: "kommandant_ironjaw",
	 *   faction: "scale_guard",
	 *   x: 64, y: 52,
	 *   hp: 5000, armor: 8, damage: 40, range: 2,
	 *   attackCooldown: 1.5, speed: 3, visionRadius: 10,
	 *   phases: [...],
	 * })
	 */
	spawnBossUnit(config: {
		name: string;
		unitType: string;
		faction: string;
		x: number;
		y: number;
		hp: number;
		armor: number;
		damage: number;
		range: number;
		attackCooldown: number;
		speed: number;
		visionRadius: number;
		phases: Array<{
			name: string;
			hpThreshold: number;
			abilities: string[];
			dialogue?: { speaker: string; text: string };
		}>;
		aoeRadius?: number;
		aoeDamage?: number;
		aoeCooldown?: number;
		summonCooldown?: number;
		summonType?: string;
		summonCount?: number;
	}): TriggerAction {
		return {
			type: "spawnBossUnit",
			name: config.name,
			unitType: config.unitType,
			faction: config.faction,
			position: { x: config.x, y: config.y },
			hp: config.hp,
			armor: config.armor,
			damage: config.damage,
			range: config.range,
			attackCooldown: config.attackCooldown,
			speed: config.speed,
			visionRadius: config.visionRadius,
			phases: config.phases,
			aoeRadius: config.aoeRadius,
			aoeDamage: config.aoeDamage,
			aoeCooldown: config.aoeCooldown,
			summonCooldown: config.summonCooldown,
			summonType: config.summonType,
			summonCount: config.summonCount,
		};
	},
};
