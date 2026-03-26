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

export interface BuildingCountCondition {
	type: "buildingCount";
	/** Faction to count buildings for */
	faction: string;
	/** Optional building type filter (e.g. "barracks", "siphon") */
	buildingType?: string;
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

export interface ResourceThresholdCondition {
	type: "resourceThreshold";
	/** Resource type to monitor */
	resource: "fish" | "timber" | "salvage";
	/** Comparison operator */
	operator: "gte" | "lte" | "eq";
	/** Resource amount threshold */
	amount: number;
}

export type TriggerCondition =
	| TimerCondition
	| UnitCountCondition
	| BuildingCountCondition
	| AreaEnteredCondition
	| BuildingDestroyedCondition
	| ObjectiveCompleteCondition
	| AllObjectivesCompleteCondition
	| HealthThresholdCondition
	| ResourceThresholdCondition;

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

export interface ShowDialogueExchangeAction {
	type: "showDialogueExchange";
	/** Multi-line dialogue exchange — back-and-forth portrait conversation. */
	lines: Array<{
		speaker: string;
		text: string;
		portraitId?: string;
	}>;
	/** Whether to pause the game during this exchange (default true). */
	pauseGame?: boolean;
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

export interface RevealZoneAction {
	type: "revealZone";
	/** Zone ID to reveal fog of war for */
	zoneId: string;
}

export interface LockZoneAction {
	type: "lockZone";
	/** Zone ID to block unit movement in */
	zoneId: string;
}

export interface UnlockZoneAction {
	type: "unlockZone";
	/** Zone ID to allow unit movement in */
	zoneId: string;
}

export interface PanCameraAction {
	type: "panCamera";
	/** Target position to pan camera to */
	target: { x: number; y: number };
	/** Duration of camera pan in seconds */
	duration: number;
}

export interface AddObjectiveAction {
	type: "addObjective";
	/** Unique objective identifier */
	id: string;
	/** Display text shown to the player */
	description: string;
	/** Whether this is a primary or bonus objective */
	objectiveType: "primary" | "bonus";
}

export interface StartPhaseAction {
	type: "startPhase";
	/** Phase name to activate */
	phase: string;
}

export interface VictoryAction {
	type: "victory";
}

export interface EnableTriggerAction {
	type: "enableTrigger";
	/** ID of the trigger to enable */
	triggerId: string;
}

export interface GrantResourceAction {
	type: "grantResource";
	/** Resource type to grant */
	resource: "fish" | "timber" | "salvage";
	/** Amount to add to the player's stockpile */
	amount: number;
}

export interface SpawnBossUnitAction {
	type: "spawnBossUnit";
	/** Boss display name (shown on health bar). */
	name: string;
	/** Unit type id (e.g. "kommandant_ironjaw"). */
	unitType: string;
	/** Faction that owns the boss. */
	faction: string;
	/** Spawn position in tile coordinates. */
	position: { x: number; y: number };
	/** Total hit points. */
	hp: number;
	/** Armor value. */
	armor: number;
	/** Base attack damage. */
	damage: number;
	/** Attack range in tiles. */
	range: number;
	/** Attack cooldown in seconds. */
	attackCooldown: number;
	/** Movement speed. */
	speed: number;
	/** Vision radius in tiles. */
	visionRadius: number;
	/** Boss encounter phases. */
	phases: Array<{
		name: string;
		hpThreshold: number;
		abilities: string[];
		dialogue?: { speaker: string; text: string };
	}>;
	/** AoE radius in tiles. */
	aoeRadius?: number;
	/** AoE damage per hit. */
	aoeDamage?: number;
	/** AoE cooldown in seconds. */
	aoeCooldown?: number;
	/** Summon cooldown in seconds. */
	summonCooldown?: number;
	/** Unit type to summon. */
	summonType?: string;
	/** Number of units per summon wave. */
	summonCount?: number;
}

export type TriggerAction =
	| SpawnUnitsAction
	| ShowDialogueAction
	| ShowDialogueExchangeAction
	| ChangeWeatherAction
	| SpawnReinforcementsAction
	| CompleteObjectiveAction
	| FailMissionAction
	| PlaySFXAction
	| CameraAction
	| RevealZoneAction
	| LockZoneAction
	| UnlockZoneAction
	| PanCameraAction
	| AddObjectiveAction
	| StartPhaseAction
	| VictoryAction
	| EnableTriggerAction
	| GrantResourceAction
	| SpawnBossUnitAction;

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
