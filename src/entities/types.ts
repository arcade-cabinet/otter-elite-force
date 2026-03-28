import type { TriggerAction, TriggerCondition } from "@/scenarios/types";

// src/entities/types.ts
// Canonical type system for all entity definitions.
// Every entity in the game (units, buildings, resources, terrain, portraits,
// research, missions) is described by these interfaces.

// ─── Sprite Definition (Legacy) ───

/** Map of animation name to array of frames, each frame being rows of palette chars. */
export interface SpriteFrames {
	[animationName: string]: string[][];
}

export interface SpriteDef {
	/** Grid dimension (16 for units, 32 for buildings, 64x96 for portraits). */
	size: number;
	/** ASCII frames keyed by animation name. Each frame is string[] (rows of chars). */
	frames: SpriteFrames;
	/** Frames per second per animation. */
	animationRates?: Record<string, number>;
}

// ─── SP-DSL Sprite Definition (Layered) ───

/**
 * A single compositing layer in an SP-DSL sprite.
 * Layers are stacked by zIndex (low = back, high = front).
 * Each grid cell is a numeric palette index: '0' = transparent, '1' = outline, '2'-'9' = colors.
 */
export interface SpriteLayer {
	/** Unique layer identifier (e.g. "fur", "uniform", "eyes"). */
	id: string;
	/** Compositing order — lower renders first (back), higher renders on top (front). */
	zIndex: number;
	/** Pixel grid as rows of single-char numeric palette indices. */
	grid: string[][];
	/** Optional pixel offset [x, y] relative to sprite origin. */
	offset?: [number, number];
	/** Canvas composite operation for this layer. Defaults to "source-over". */
	blendMode?: GlobalCompositeOperation;
}

/**
 * SP-DSL sprite definition — palette-driven, multi-layer, animation-aware.
 *
 * Numeric indices ('0'–'9') in each layer grid map to hex colors
 * via the named palette. This decouples art from color, enabling
 * faction recoloring, seasonal variants, and procedural tinting.
 */
export interface SPDSLSprite {
	/** Named palette key from PALETTES (e.g. "otter_default", "croc_default"). */
	palette: string;
	/** Compositing layers, stacked by zIndex. */
	layers: SpriteLayer[];
	/** Animation definitions — each key maps to an array of layer-override sets per frame. */
	animations?: Record<string, { layerOverrides?: Record<string, { grid: string[][] }> }[]>;
	/** Procedural generation hints for the build script. */
	procedural?: {
		/** Whether to auto-generate walk cycle by shifting leg layers. */
		autoWalk?: boolean;
		/** Whether to generate a damage/hit flash variant. */
		hitFlash?: boolean;
		/** Team-color layer IDs that can be recolored per faction. */
		teamColorLayers?: string[];
	};
}

// ─── Resource Cost ───

export interface ResourceCost {
	fish?: number;
	timber?: number;
	salvage?: number;
}

// ─── Unit Definition ───

export interface UnitDef {
	id: string;
	name: string;
	faction: "ura" | "scale_guard";
	category: "worker" | "infantry" | "ranged" | "siege" | "transport" | "scout" | "support";

	// Visual
	sprite: SpriteDef | SPDSLSprite;

	// Combat stats
	hp: number;
	armor: number;
	damage: number;
	damageVsBuildings?: number;
	range: number;
	attackCooldown: number;
	speed: number;
	visionRadius: number;

	// Economy
	cost: ResourceCost;
	populationCost: number;
	trainTime: number;
	trainedAt: string;

	// Unlock
	unlockedAt: string;

	// Worker-specific
	gatherCapacity?: number;
	gatherRate?: number;
	buildRate?: number;

	// Water
	canSwim?: boolean;
	canSubmerge?: boolean;
	carryCapacity?: number;

	// Stealth
	canCrouch?: boolean;
	detectionRadius?: number;

	// AI profile (enemy units)
	aiProfile?: {
		states: string[];
		defaultState: string;
		aggroRange: number;
		fleeThreshold?: number;
		specialBehavior?: string;
	};

	// Drop table (enemy units)
	drops?: {
		type: "fish" | "timber" | "salvage";
		min: number;
		max: number;
		chance: number;
	}[];

	// Trait composition tags
	tags: string[];
}

// ─── Hero Definition ───

export interface HeroDef extends UnitDef {
	portraitId: string;
	unlockMission: string;
	unlockDescription: string;
	abilities?: {
		id: string;
		name: string;
		description: string;
		cooldown: number;
	}[];
}

// ─── Building Definition ───

export interface BuildingDef {
	id: string;
	name: string;
	faction: "ura" | "scale_guard";
	category: "production" | "defense" | "economy" | "wall" | "special";

	sprite: SpriteDef | SPDSLSprite;

	hp: number;
	armor: number;
	buildTime: number;

	cost: ResourceCost;
	unlockedAt: string;
	requiresResearch?: string;

	trains?: string[];
	researches?: string[];

	// Defense
	attackDamage?: number;
	attackRange?: number;
	attackCooldown?: number;

	// Economy (passive income)
	passiveIncome?: {
		type: "fish" | "timber" | "salvage";
		amount: number;
		interval: number;
	};

	populationCapacity?: number;

	// Healing
	healRate?: number;
	healRadius?: number;

	// Special
	isExplosive?: boolean;
	chainExplosionRadius?: number;

	tags: string[];
}

// ─── Resource Definition ───

export interface ResourceDef {
	id: string;
	name: string;
	resourceType: "fish" | "timber" | "salvage";

	sprite: SpriteDef | SPDSLSprite;

	yield: {
		min: number;
		max: number;
	};
	regrowthTime?: number;
	harvestRate: number;

	tags: string[];
}

// ─── Terrain Tile Definition ───

export interface TerrainTileDef {
	id: string;
	name: string;
	sprite: SpriteDef | SPDSLSprite;

	movementCost: number;
	swimCost?: number;
	blocksVision: boolean;
	providesConcealment: boolean;
	damagePerSecond?: number;

	paintRules?: {
		baseColor: string;
		noiseColors: string[];
		noiseDensity: number;
	};
}

// ─── Portrait Definition ───

export interface PortraitDef {
	id: string;
	name: string;
	sprite: SpriteDef | SPDSLSprite;
	dialogueColor: string;
}

// ─── Research Definition ───

export interface ResearchDef {
	id: string;
	name: string;
	description: string;
	cost: ResourceCost;
	researchTime: number;
	researchedAt: string;
	unlockedAt: string;
	effect: {
		type: "stat_boost" | "unlock_building" | "unlock_ability";
		target?: string;
		stat?: string;
		value?: number;
		unlocks?: string;
	};
}

// ─── Mission Definition ───

export interface MissionObjective {
	id: string;
	description: string;
}

export interface MissionAreaEnteredCondition {
	type: "areaEntered";
	faction: string;
	zoneId: string;
	unitType?: string;
	minUnits?: number;
}

export interface MissionEnemyCountInZoneCondition {
	type: "enemyCountInZone";
	zoneId: string;
	operator: "gte" | "lte" | "eq";
	count: number;
	faction?: string;
}

export interface MissionBuildingCountInZoneCondition {
	type: "buildingCountInZone";
	faction: string;
	zoneId: string;
	operator: "gte" | "lte" | "eq";
	count: number;
	buildingType?: string;
}

export interface MissionConvoyEntersZoneCondition {
	type: "convoyEntersZone";
	zoneId: string;
	convoyTag?: string;
}

export type MissionTriggerCondition =
	| Exclude<TriggerCondition, { type: "areaEntered" }>
	| MissionAreaEnteredCondition
	| MissionEnemyCountInZoneCondition
	| MissionBuildingCountInZoneCondition
	| MissionConvoyEntersZoneCondition;

export interface MissionScenarioTrigger {
	id: string;
	condition: MissionTriggerCondition;
	action: TriggerAction | TriggerAction[];
	once?: boolean;
	enabled?: boolean;
}

export interface WeatherSchedule {
	pattern: {
		type: "clear" | "rain" | "fog" | "storm";
		startTime: number;
		duration: number;
	}[];
}

export interface TerrainRegion {
	terrainId: string;
	rect?: { x: number; y: number; w: number; h: number };
	circle?: { cx: number; cy: number; r: number };
	river?: { points: [number, number][]; width: number };
	fill?: boolean;
}

export interface TileOverride {
	x: number;
	y: number;
	terrainId: string;
}

export interface Placement {
	type: string;
	faction?: "ura" | "scale_guard" | "neutral";
	x?: number;
	y?: number;
	zone?: string;
	count?: number;
	hp?: number;
	patrol?: [number, number][];
	scriptId?: string;
	active?: boolean;
	metadata?: Record<string, string | number | boolean>;
	mechanic?: string;
}

export interface DifficultyModifier {
	enemyDamageMultiplier: number;
	enemyHpMultiplier: number;
	resourceMultiplier: number;
	xpMultiplier: number;
}

export interface MissionDef {
	id: string;
	chapter: number;
	mission: number;
	name: string;
	subtitle: string;

	briefing: {
		portraitId: string;
		lines: {
			speaker: string;
			text: string;
		}[];
	};
	seedPhrase?: string;

	terrain: {
		width: number;
		height: number;
		regions: TerrainRegion[];
		overrides: TileOverride[];
	};

	zones: {
		[zoneId: string]: {
			x: number;
			y: number;
			width: number;
			height: number;
		};
	};

	placements: Placement[];

	startResources: ResourceCost;
	startPopCap: number;

	objectives: {
		primary: MissionObjective[];
		bonus: MissionObjective[];
	};

	triggers: MissionScenarioTrigger[];

	weather?: WeatherSchedule;

	unlocks?: {
		units?: string[];
		buildings?: string[];
		heroes?: string[];
	};

	parTime: number;

	difficulty: {
		support: DifficultyModifier;
		tactical: DifficultyModifier;
		elite: DifficultyModifier;
	};
}
