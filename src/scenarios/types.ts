/**
 * Scenario Scripting Engine — Type Definitions
 *
 * Defines the data model for campaign mission scripting:
 * triggers, conditions, actions, objectives, and briefings.
 *
 * Each mission is a Scenario containing triggers that fire
 * TriggerActions when TriggerConditions are met.
 */

// ---------------------------------------------------------------------------
// Trigger Conditions
// ---------------------------------------------------------------------------

export interface TimerCondition {
	type: "timer";
	/** Seconds elapsed since mission start */
	time: number;
}

export interface UnitCountCondition {
	type: "unitCount";
	/** Faction to count units for */
	faction: string;
	/** Optional unit type filter (e.g. "mudfoot", "gator") */
	unitType?: string;
	/** Comparison operator */
	operator: "gte" | "lte" | "eq";
	/** Count threshold */
	count: number;
}

export interface AreaEnteredCondition {
	type: "areaEntered";
	/** Faction whose units must enter the area */
	faction: string;
	/** Optional unit type filter */
	unitType?: string;
	/** Rectangular area in tile coordinates */
	area: { x: number; y: number; width: number; height: number };
	/** Minimum number of units required in area (default: 1) */
	minUnits?: number;
}

export interface BuildingDestroyedCondition {
	type: "buildingDestroyed";
	/** Building entity tag or ID to monitor */
	buildingTag: string;
}

export interface ObjectiveCompleteCondition {
	type: "objectiveComplete";
	/** ID of the objective that must be completed */
	objectiveId: string;
}

export interface AllObjectivesCompleteCondition {
	type: "allObjectivesComplete";
}

export interface HealthThresholdCondition {
	type: "healthThreshold";
	/** Entity tag to monitor */
	entityTag: string;
	/** Threshold as percentage (0-100) */
	percentage: number;
	/** Fire when health goes below this threshold */
	operator: "below" | "above";
}

export type TriggerCondition =
	| TimerCondition
	| UnitCountCondition
	| AreaEnteredCondition
	| BuildingDestroyedCondition
	| ObjectiveCompleteCondition
	| AllObjectivesCompleteCondition
	| HealthThresholdCondition;

// ---------------------------------------------------------------------------
// Trigger Actions
// ---------------------------------------------------------------------------

export interface SpawnUnitsAction {
	type: "spawnUnits";
	/** Unit type to spawn */
	unitType: string;
	/** Number of units */
	count: number;
	/** Faction that owns the spawned units */
	faction: string;
	/** Spawn position in tile coordinates */
	position: { x: number; y: number };
	/** Optional tag for referencing these units in other triggers */
	tag?: string;
}

export interface ShowDialogueAction {
	type: "showDialogue";
	/** Portrait key (e.g. "foxhound", "gen-whiskers") */
	portrait: string;
	/** Speaker name shown in the dialogue box */
	speaker: string;
	/** Dialogue text */
	text: string;
	/** Duration in seconds to show dialogue (0 = until dismissed) */
	duration?: number;
}

export interface ChangeWeatherAction {
	type: "changeWeather";
	/** Target weather state */
	weather: "clear" | "rain" | "monsoon";
	/** Transition time in seconds */
	transitionTime?: number;
}

export interface SpawnReinforcementsAction {
	type: "spawnReinforcements";
	/** Array of unit spawns */
	units: Array<{
		unitType: string;
		count: number;
		position: { x: number; y: number };
	}>;
	/** Faction that owns the reinforcements */
	faction: string;
	/** Optional dialogue to show with reinforcements */
	dialogue?: {
		portrait: string;
		speaker: string;
		text: string;
	};
}

export interface CompleteObjectiveAction {
	type: "completeObjective";
	/** ID of the objective to mark complete */
	objectiveId: string;
}

export interface FailMissionAction {
	type: "failMission";
	/** Reason shown to the player */
	reason: string;
}

export interface PlaySFXAction {
	type: "playSFX";
	/** SFX key */
	sfx: string;
}

export interface CameraAction {
	type: "camera";
	/** Target position to pan camera to */
	target: { x: number; y: number };
	/** Duration of camera pan in seconds */
	duration: number;
}

export type TriggerAction =
	| SpawnUnitsAction
	| ShowDialogueAction
	| ChangeWeatherAction
	| SpawnReinforcementsAction
	| CompleteObjectiveAction
	| FailMissionAction
	| PlaySFXAction
	| CameraAction;

// ---------------------------------------------------------------------------
// Scenario Trigger
// ---------------------------------------------------------------------------

export interface ScenarioTrigger {
	/** Unique identifier for this trigger */
	id: string;
	/** Condition(s) that must be met to fire */
	condition: TriggerCondition;
	/** Action(s) to execute when condition is met */
	action: TriggerAction | TriggerAction[];
	/** If true, trigger fires only once; if false, it re-checks each frame */
	once: boolean;
	/** Whether trigger is initially enabled (default: true) */
	enabled?: boolean;
}

// ---------------------------------------------------------------------------
// Objectives
// ---------------------------------------------------------------------------

export type ObjectiveStatus = "pending" | "active" | "completed" | "failed";

export interface Objective {
	/** Unique objective identifier */
	id: string;
	/** Display text shown to the player */
	description: string;
	/** Whether this is a primary or bonus objective */
	type: "primary" | "bonus";
	/** Current status */
	status: ObjectiveStatus;
}

// ---------------------------------------------------------------------------
// Briefing
// ---------------------------------------------------------------------------

export interface BriefingLine {
	/** Portrait key for the speaker */
	portrait: string;
	/** Speaker name */
	speaker: string;
	/** Dialogue text */
	text: string;
}

export interface BriefingDefinition {
	/** Mission title shown at top of briefing */
	title: string;
	/** Lines of briefing dialogue */
	lines: BriefingLine[];
	/** Objectives shown to the player before mission start */
	objectives: Array<{ description: string; type: "primary" | "bonus" }>;
}

// ---------------------------------------------------------------------------
// Start Conditions
// ---------------------------------------------------------------------------

export interface StartUnit {
	unitType: string;
	count: number;
	faction: string;
	position: { x: number; y: number };
	tag?: string;
}

export interface StartBuilding {
	buildingType: string;
	faction: string;
	position: { x: number; y: number };
	health?: number;
	tag?: string;
}

export interface StartConditions {
	/** Starting resources for the player */
	resources?: { fish?: number; timber?: number; salvage?: number };
	/** Pre-placed units */
	units?: StartUnit[];
	/** Pre-placed buildings */
	buildings?: StartBuilding[];
	/** Starting population cap */
	populationCap?: number;
}

// ---------------------------------------------------------------------------
// Scenario (top-level mission definition)
// ---------------------------------------------------------------------------

export interface Scenario {
	/** Unique scenario identifier (e.g. "mission-01-beachhead") */
	id: string;
	/** Chapter number (1-4) */
	chapter: number;
	/** Mission number within chapter (1-4) */
	mission: number;
	/** Display name */
	name: string;
	/** Pre-mission briefing */
	briefing: BriefingDefinition;
	/** Initial game state */
	startConditions: StartConditions;
	/** Mission objectives */
	objectives: Objective[];
	/** Event-driven triggers */
	triggers: ScenarioTrigger[];
	/** Weather schedule (optional) */
	weather?: "clear" | "rain" | "monsoon";
	/** New unit types unlocked this mission */
	unitUnlocks?: string[];
	/** New building types unlocked this mission */
	buildingUnlocks?: string[];
}
