/**
 * Type Definitions - Single Source of Truth
 *
 * All game types are defined here and exported for use across the codebase.
 * This file serves as the canonical reference for:
 * - Game mode FSM states
 * - Character and weapon definitions
 * - World/chunk data structures
 * - Save data schema
 *
 * @module stores/types
 */

// =============================================================================
// GAME MODE TYPES
// =============================================================================

/**
 * Game mode FSM states.
 * Transitions: MENU → CUTSCENE → GAME → (VICTORY | GAMEOVER)
 * CANTEEN is accessible from MENU for upgrades.
 */
export type GameMode = "MENU" | "CUTSCENE" | "GAME" | "GAMEOVER" | "CANTEEN" | "VICTORY";

/**
 * Difficulty modes with escalation-only progression.
 * Can go UP (SUPPORT → TACTICAL → ELITE) but NEVER down.
 * - SUPPORT: Casual mode, supply drops anywhere
 * - TACTICAL: "The Fall" mechanic at 30% HP
 * - ELITE: Permadeath enabled
 */
export type DifficultyMode = "ELITE" | "TACTICAL" | "SUPPORT";

// =============================================================================
// CHARACTER TYPES
// =============================================================================

/**
 * Visual and gameplay traits for a playable otter character.
 * Characters are unlocked by rescuing them in the world (not purchased).
 */
export interface CharacterTraits {
	/** Unique identifier (e.g., "bubbles", "whiskers") */
	id: string;
	/** Display name (e.g., "SGT. BUBBLES") */
	name: string;
	/** Hex color for fur rendering */
	furColor: string;
	/** Hex color for eye rendering */
	eyeColor: string;
	/** Visual whisker length in world units */
	whiskerLength: number;
	/** Whether character has battle-worn appearance */
	grizzled: boolean;
	/** Base movement speed multiplier */
	baseSpeed: number;
	/** Base max health points */
	baseHealth: number;
	/** Speed multiplier when climbing */
	climbSpeed: number;
	/** Description of how to unlock (e.g., "Rescue at Prison Camp (5,5)") */
	unlockRequirement?: string;
}

/**
 * Equipment loadout for a character.
 * Determines visual appearance and starting weapon.
 */
export interface CharacterGear {
	/** Head accessory type */
	headgear?: "bandana" | "beret" | "helmet" | "none";
	/** Body armor type */
	vest?: "tactical" | "heavy" | "none";
	/** Back equipment type */
	backgear?: "radio" | "scuba" | "none";
	/** Starting weapon ID (must exist in WEAPONS registry) */
	weaponId: string;
}

/**
 * Complete character definition combining traits and gear.
 * Used in the CHARACTERS registry.
 */
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

/**
 * Combined entity type for chunk generation.
 * Uses the union of all entity type enums to avoid duplication.
 */
export type ChunkEntityType = PredatorType | ObjectiveType | InteractionType | EnvironmentType;

export type ChunkEntity = {
	id: string;
	type: ChunkEntityType;
	position: [number, number, number];
	isHeavy?: boolean;
	objectiveId?: string;
	hp?: number;
	suppression?: number;
	captured?: boolean;
	interacted?: boolean;
	rescued?: boolean;
	/** Pack identifier for coordinated enemy AI behavior */
	packId?: string;
};

// =============================================================================
// CHUNK / WORLD TYPES
// =============================================================================

export type TerrainType = "RIVER" | "MARSH" | "DENSE_JUNGLE";

/**
 * Territory ownership state for chunk control.
 * - HOSTILE: Enemy controlled, full AI activity
 * - NEUTRAL: Unclaimed, normal AI activity
 * - SECURED: URA controlled, reduced enemy spawns
 */
export type TerritoryState = "HOSTILE" | "NEUTRAL" | "SECURED";

export interface ChunkDecoration {
	id: string;
	type: DecorationType;
	count: number;
}

/**
 * Chunk data structure for open world persistence.
 * Once discovered, chunks are FIXED and never regenerated.
 * Entity states persist across sessions.
 */
export interface ChunkData {
	id: string; // "x,z"
	x: number;
	z: number;
	seed: number;
	terrainType: TerrainType;
	secured: boolean; // Legacy - kept for backward compatibility
	territoryState: TerritoryState;
	entities: ChunkEntity[];
	decorations: ChunkDecoration[];
	/** Timestamp of last visit (for hibernation logic) */
	lastVisited?: number;
	/** Whether chunk is currently hibernated (AI suspended) */
	hibernated?: boolean;
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
	/**
	 * Player's last 3D position in world space.
	 * - x: horizontal (east-west)
	 * - y: vertical (height - for climbing, jumping, platforms)
	 * - z: horizontal (north-south)
	 *
	 * This allows players to save while on platforms, trees, etc.
	 */
	lastPlayerPosition: [number, number, number];
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
