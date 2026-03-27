/**
 * Template type definitions for the data-driven content layer.
 *
 * These are INTERFACES only — no data. All game data lives in JSON files
 * under public/data/ and is loaded at runtime by templateLoader.ts.
 */

// ---------------------------------------------------------------------------
// Resource cost (shared across units, buildings, research)
// ---------------------------------------------------------------------------

export interface ResourceCost {
	fish: number;
	timber: number;
	salvage: number;
}

// ---------------------------------------------------------------------------
// Unit Templates
// ---------------------------------------------------------------------------

export interface VisualConfig {
	sprite: string;
	tint: string | null;
	emblem: string;
	scale: number;
	defaultAnim: string;
}

export interface StatBlock {
	hp: number;
	armor: number;
	speed: number;
	attackDamage: number;
	attackRange: number;
	attackCooldownMs: number;
	visionRadius: number;
	popCost: number;
}

export interface TrainingConfig {
	building: string;
	cost: ResourceCost;
	timeMs: number;
}

/**
 * Raw unit template as it appears in JSON (may have `extends`).
 * After resolution, `extends` is stripped and all fields are present.
 */
export interface UnitTemplateRaw {
	extends?: string;
	base?: string;
	name?: string;
	faction?: string;
	category?: string;
	visual?: Partial<VisualConfig>;
	stats?: Partial<StatBlock>;
	abilities?: string[];
	flags?: Record<string, boolean>;
	training?: Partial<TrainingConfig>;
	unlocksAtMission?: number;
	description?: string;
}

/** Fully resolved unit template — all fields guaranteed present. */
export interface UnitTemplate {
	id: string;
	base: string;
	name: string;
	faction: string;
	category: string;
	visual: VisualConfig;
	stats: StatBlock;
	abilities: string[];
	flags: Record<string, boolean>;
	training: TrainingConfig;
	unlocksAtMission: number;
	description: string;
}

// ---------------------------------------------------------------------------
// Building Templates
// ---------------------------------------------------------------------------

export interface BuildingStatBlock {
	hp: number;
	armor: number;
	visionRadius: number;
	attackDamage: number;
	attackRange: number;
	attackCooldownMs: number;
	healRate: number;
	healRadius: number;
	populationCapacity: number;
}

export interface BuildingVisualConfig {
	sprite: string | null;
	tint: string | null;
	scale: number;
}

export interface ConstructionConfig {
	cost: ResourceCost;
	timeMs: number;
}

export interface PassiveIncome {
	resource: "fish" | "timber" | "salvage";
	amount: number;
	intervalMs: number;
}

export interface BuildingTemplateRaw {
	extends?: string;
	name?: string;
	faction?: string;
	category?: string;
	visual?: Partial<BuildingVisualConfig>;
	stats?: Partial<BuildingStatBlock>;
	flags?: Record<string, boolean>;
	construction?: Partial<ConstructionConfig>;
	produces?: string[];
	passiveIncome?: PassiveIncome | null;
	unlocksAtMission?: number;
	description?: string;
}

/** Fully resolved building template. */
export interface BuildingTemplate {
	id: string;
	name: string;
	faction: string;
	category: string;
	visual: BuildingVisualConfig;
	stats: BuildingStatBlock;
	flags: Record<string, boolean>;
	construction: ConstructionConfig;
	produces: string[];
	passiveIncome: PassiveIncome | null;
	unlocksAtMission: number;
	description: string;
}

// ---------------------------------------------------------------------------
// Ability Definitions
// ---------------------------------------------------------------------------

export interface AbilityDef {
	id: string;
	type: "active" | "passive";
	cooldownMs?: number;
	description: string;
	params: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Research Definitions
// ---------------------------------------------------------------------------

export interface ResearchEffect {
	target: string;
	stat: string;
	modifier: string;
}

export interface ResearchDef {
	id: string;
	name: string;
	description: string;
	cost: ResourceCost;
	timeMs: number;
	researchedAt: string;
	effects: ResearchEffect[];
	prerequisite: string | null;
	unlocksAtMission: number;
}

// ---------------------------------------------------------------------------
// Balance Config
// ---------------------------------------------------------------------------

export interface DifficultyConfig {
	enemyDamageMultiplier: number;
	enemyHpMultiplier: number;
	resourceMultiplier: number;
	xpMultiplier: number;
}

export interface BalanceConfig {
	gathering: {
		fishPerTrip: number;
		timberPerTrip: number;
		salvagePerTrip: number;
		tripDurationMs: number;
		returnSpeedMultiplier: number;
		autoSearchRadius: number;
	};
	startingResources: Record<string, ResourceCost>;
	population: {
		lodgeCap: number;
		commandPostCap: number;
		maxCap: number;
	};
	combat: {
		retreatHealthPercent: number;
		lodgeDestroyedDefeat: boolean;
		armorReduction: string;
		minimumDamage: number;
	};
	economy: {
		fishTrapIncome: number;
		fishTrapIntervalMs: number;
	};
	difficulty: Record<string, DifficultyConfig>;
}

// ---------------------------------------------------------------------------
// Mission Data
// ---------------------------------------------------------------------------

export interface MissionPatrol {
	composition: Array<{ type: string; count: number }>;
	intervalMs: number;
	variance: number;
}

export interface MissionLootDrop {
	resource: string;
	amount: number;
	probability: number;
}

export interface MissionData {
	id: string;
	availableBuildings: string[];
	availableUnits: string[];
	startingResources: ResourceCost;
	placements: unknown[];
	encounterTable: {
		patrols: MissionPatrol[];
	};
	lootTable: Record<string, { drops: MissionLootDrop[] }>;
}

// ---------------------------------------------------------------------------
// Aggregate container
// ---------------------------------------------------------------------------

export interface GameTemplates {
	units: Map<string, UnitTemplate>;
	buildings: Map<string, BuildingTemplate>;
	abilities: Map<string, AbilityDef>;
	research: Map<string, ResearchDef>;
	balance: BalanceConfig;
	missions: Map<string, MissionData>;
}
