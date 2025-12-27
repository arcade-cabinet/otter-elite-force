/**
 * Type Definitions - Single Source of Truth
 * All game types are defined here and exported for use across the codebase
 */

// =============================================================================
// GAME MODE TYPES
// =============================================================================

export type GameMode = "MENU" | "CUTSCENE" | "GAME" | "GAMEOVER" | "CANTEEN" | "VICTORY";
export type DifficultyMode = "ELITE" | "TACTICAL" | "SUPPORT";

// =============================================================================
// CHARACTER TYPES
// =============================================================================

export interface CharacterTraits {
	id: string;
	name: string;
	furColor: string;
	eyeColor: string;
	whiskerLength: number;
	grizzled: boolean;
	baseSpeed: number;
	baseHealth: number;
	climbSpeed: number;
	unlockRequirement?: string;
}

export interface CharacterGear {
	headgear?: "bandana" | "beret" | "helmet" | "none";
	vest?: "tactical" | "heavy" | "none";
	backgear?: "radio" | "scuba" | "none";
	weaponId: string;
}

export interface CharacterDefinition {
	traits: CharacterTraits;
	gear: CharacterGear;
}

// =============================================================================
// WEAPON TYPES
// =============================================================================

export type WeaponType = "PISTOL" | "RIFLE" | "MACHINE_GUN" | "SHOTGUN" | "LAUNCHER";
export type WeaponVisualType =
	| "FISH_CANNON"
	| "BUBBLE_GUN"
	| "PISTOL_GRIP"
	| "SHOTGUN"
	| "MORTAR"
	| "NEEDLE_GUN";

export interface WeaponData {
	id: string;
	name: string;
	type: WeaponType;
	damage: number;
	fireRate: number;
	bulletSpeed: number;
	recoil: number;
	range: number;
	visualType: WeaponVisualType;
}

// =============================================================================
// ENTITY TYPES
// =============================================================================

export type PredatorType = "GATOR" | "SNAKE" | "SNAPPER" | "SCOUT";

// Ensure worldGenerator can use these types
export type WorldPredatorType = PredatorType;
export type ObjectiveType = "GAS_STOCKPILE" | "SIPHON" | "PRISON_CAGE";
export type InteractionType =
	| "VILLAGER"
	| "HEALER"
	| "HUT"
	| "EXTRACTION_POINT"
	| "RAFT"
	| "CLAM_BASKET";
export type EnvironmentType = "PLATFORM" | "CLIMBABLE" | "OIL_SLICK" | "MUD_PIT" | "TOXIC_SLUDGE";
export type DecorationType = "REED" | "LILYPAD" | "DEBRIS" | "BURNT_TREE" | "MANGROVE" | "DRUM";

export type BaseEntity = {
	id: string;
	position: [number, number, number];
};

export type PredatorEntity = BaseEntity & {
	type: PredatorType;
	hp: number;
	suppression: number;
	isHeavy?: boolean;
};

export type ObjectiveEntity = BaseEntity & {
	type: ObjectiveType;
	hp?: number;
	objectiveId?: string;
	captured?: boolean;
	rescued?: boolean;
};

export type InteractionEntity = BaseEntity & {
	type: InteractionType;
	interacted?: boolean;
	isHeavy?: boolean;
};

export type EnvironmentEntity = BaseEntity & {
	type: EnvironmentType;
};

export type Entity = PredatorEntity | ObjectiveEntity | InteractionEntity | EnvironmentEntity;

// Combined entity type for chunk generation (includes all possible fields)
export type ChunkEntity = {
	id: string;
	type:
		| PredatorType
		| ObjectiveType
		| InteractionType
		| EnvironmentType
		| "VILLAGER"
		| "HEALER"
		| "HUT"
		| "EXTRACTION_POINT"
		| "RAFT"
		| "CLAM_BASKET"
		| "SIPHON"
		| "GAS_STOCKPILE"
		| "PRISON_CAGE"
		| "GATOR"
		| "SNAKE"
		| "SNAPPER"
		| "SCOUT"
		| "PLATFORM"
		| "CLIMBABLE"
		| "OIL_SLICK"
		| "MUD_PIT"
		| "TOXIC_SLUDGE";
	position: [number, number, number];
	isHeavy?: boolean;
	objectiveId?: string;
	hp?: number;
	suppression?: number;
	captured?: boolean;
	interacted?: boolean;
	rescued?: boolean;
};

// =============================================================================
// CHUNK / WORLD TYPES
// =============================================================================

export type TerrainType = "RIVER" | "MARSH" | "DENSE_JUNGLE";

export interface ChunkDecoration {
	id: string;
	type: DecorationType;
	count: number;
}

export interface ChunkData {
	id: string; // "x,z"
	x: number;
	z: number;
	seed: number;
	terrainType: TerrainType;
	secured: boolean;
	entities: ChunkEntity[];
	decorations: ChunkDecoration[];
}

// =============================================================================
// BASE BUILDING TYPES
// =============================================================================

export type BaseComponentType = "FLOOR" | "WALL" | "ROOF" | "STILT";

export interface PlacedComponent {
	id: string;
	type: BaseComponentType;
	position: [number, number, number];
	rotation: [number, number, number];
}

// =============================================================================
// SAVE DATA TYPES
// =============================================================================

export interface StrategicObjectives {
	siphonsDismantled: number;
	villagesLiberated: number;
	gasStockpilesCaptured: number;
	healersProtected: number;
	alliesRescued: number;
}

export interface SpoilsOfWar {
	creditsEarned: number;
	clamsHarvested: number;
	upgradesUnlocked: number;
}

export interface PlayerUpgrades {
	speedBoost: number;
	healthBoost: number;
	damageBoost: number;
	weaponLvl: Record<string, number>;
}

/**
 * Save Data Schema (v8)
 *
 * This schema defines persistent game state for the open world.
 * Key design principles:
 * - Chunks are fixed-on-discovery (never regenerated)
 * - Difficulty can escalate but never decrease
 * - Characters are unlocked via rescue, not purchase
 */
export interface SaveData {
	version: number;
	rank: number;
	xp: number;
	medals: number;
	unlocked: number;
	unlockedCharacters: string[];
	unlockedWeapons: string[];
	coins: number;
	discoveredChunks: Record<string, ChunkData>;
	territoryScore: number;
	difficultyMode: DifficultyMode;
	isFallTriggered: boolean;
	strategicObjectives: StrategicObjectives;
	spoilsOfWar: SpoilsOfWar;
	peacekeepingScore: number;
	upgrades: PlayerUpgrades;
	isLZSecured: boolean;
	baseComponents: PlacedComponent[];
}

// =============================================================================
// DIFFICULTY CONFIG TYPES
// =============================================================================

export interface DifficultyConfig {
	mode: DifficultyMode;
	displayName: string;
	description: string;
	supplyDropsAnywhere: boolean;
	extractionAnywhere: boolean;
	fallThreshold: number;
	permadeath: boolean;
	enemyDamageMultiplier: number;
	xpMultiplier: number;
}

// =============================================================================
// KEY COORDINATE TYPES
// =============================================================================

export interface KeyCoordinate {
	x: number;
	z: number;
	name: string;
	description: string;
	unlocks?: string;
}

// =============================================================================
// TERRAIN CONFIG TYPES
// =============================================================================

export interface TerrainConfig {
	name: string;
	waterColor: string;
	fogColor: string;
	skyColor: string;
	enemyDensity: number;
	hazardDensity: number;
}
