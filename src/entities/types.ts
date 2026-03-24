// src/entities/types.ts
// Canonical type system for all entity definitions.
// Every entity in the game (units, buildings, resources, terrain, portraits,
// research, missions) is described by these interfaces.

// ─── Sprite Definition ───

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
	sprite: SpriteDef;

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

	sprite: SpriteDef;

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

	sprite: SpriteDef;

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
	sprite: SpriteDef;

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
	sprite: SpriteDef;
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

export interface Objective {
	id: string;
	description: string;
	type: "destroy" | "survive" | "rescue" | "build" | "collect" | "explore";
	target?: string;
	count?: number;
	timeLimit?: number;
}

export interface ScenarioTrigger {
	id: string;
	condition: string;
	action: string;
	once?: boolean;
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
		primary: Objective[];
		bonus: Objective[];
	};

	triggers: ScenarioTrigger[];

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
