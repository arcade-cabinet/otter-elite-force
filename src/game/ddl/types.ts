/**
 * DDL (Data Definition Language) Type System for OTTER: ELITE FORCE
 *
 * Pure data types for JSON-driven chunk, entity, and driver definitions.
 * These types describe the schema of declarative JSON documents that
 * fully specify chunks, entities, terrain, hazards, objectives, and
 * driver configurations for the open world system.
 *
 * Design constraints:
 *  - Zero runtime imports (no Three.js, no Miniplex, no React)
 *  - Every field must be JSON-serializable
 *  - Tuple types ([x, y, z]) for vectors to enable JSON round-trips
 *  - Optional fields use `?` for partial definitions
 *  - Runtime validation handled by Zod schemas in schema.ts
 *
 * Architecture follows stellar-descent DDL pattern adapted for open world chunks.
 */

// ============================================================================
// Primitives
// ============================================================================

/** RGB color expressed as normalized floats [0..1]. */
export type ColorRGB = [number, number, number];

/** 3-component vector (position, direction, scale, etc.). */
export type Vec3 = [number, number, number];

/** 2-component coordinate for chunk addressing. */
export type ChunkCoord = [number, number];

// ============================================================================
// Terrain Types
// ============================================================================

/**
 * Terrain biome types determine visual appearance and hazard distribution.
 */
export type TerrainType = "RIVER" | "MARSH" | "DENSE_JUNGLE" | "CLEARING" | "SWAMP";

/**
 * Territory ownership states for chunk control mechanics.
 */
export type TerritoryState = "HOSTILE" | "NEUTRAL" | "SECURED";

// ============================================================================
// Entity Types
// ============================================================================

/**
 * Entity archetypes that can be placed in chunks via DDL.
 * Each type has specific renderer and behavior associations.
 */
export type EntityType =
	// Enemies
	| "GATOR"
	| "SCOUT"
	| "SNAKE"
	| "SNAPPER"
	// Structures
	| "HUT"
	| "WATCHTOWER"
	| "LONGHOUSE"
	| "MEDICAL_POST"
	// Objectives
	| "SIPHON"
	| "GAS_STOCKPILE"
	| "PRISON_CAGE"
	| "CLAM_BASKET"
	| "CLAM"
	// Environment
	| "MUD_PIT"
	| "TOXIC_SLUDGE"
	| "OIL_SLICK"
	| "DEBRIS"
	// Interactions
	| "EXTRACTION_POINT"
	| "HEALER"
	| "VILLAGER"
	| "RAFT"
	// Decorations
	| "MANGROVE"
	| "REEDS"
	| "BURNT_TREES"
	| "LILYPADS"
	| "FLOATING_DRUMS";

/**
 * Enemy tier determines stats scaling and visual treatment.
 */
export type EnemyTier = "normal" | "heavy" | "elite" | "boss";

/**
 * Faction determines material palette and allegiance.
 */
export type Faction = "URA" | "SCALE_GUARD" | "NATIVE" | "NEUTRAL";

// ============================================================================
// POI (Point of Interest) Types
// ============================================================================

/**
 * POI types for world layout generation.
 * Each POI has specific chunk content requirements.
 */
export type POIType =
	| "STARTING_LZ"
	| "VILLAGE"
	| "ENEMY_OUTPOST"
	| "SIPHON_CLUSTER"
	| "GAS_DEPOT"
	| "HEALER_HUB"
	| "WAYPOINT"
	| "PRISON_CAMP"
	| "BOSS_ARENA";

// ============================================================================
// Driver Types
// ============================================================================

/**
 * Driver IDs for chunk-specific gameplay logic.
 * Each driver handles a specific gameplay system.
 */
export type DriverId =
	| "prison-rescue"
	| "healer-hub"
	| "boss-arena"
	| "underwater-cache"
	| "village-liberation"
	| "siphon-assault"
	| "gas-depot-capture"
	| "patrol-spawner"
	| "ambient-hazards";

/**
 * Driver capabilities declaration.
 * Drivers declare what services they need at initialization.
 */
export interface DriverCapabilities {
	/** Needs AI pathfinding system */
	needsPathfinding?: boolean;
	/** Needs physics collision detection */
	needsPhysics?: boolean;
	/** Needs spatial audio system */
	needsSpatialAudio?: boolean;
	/** Needs particle effect system */
	needsParticles?: boolean;
	/** HUD elements this driver adds */
	hudElements?: string[];
}

/**
 * Driver instance configuration in chunk DDL.
 * References a registered driver by ID with chunk-specific config.
 */
export interface DriverInstanceDDL {
	/** Registered driver ID */
	id: DriverId;
	/** Chunk states during which driver is active */
	activeStates?: string[];
	/** Driver-specific configuration (validated by driver's schema) */
	config: Record<string, unknown>;
}

// ============================================================================
// Entity DDL
// ============================================================================

/**
 * Entity definition in chunk DDL.
 * Specifies type, position, and type-specific properties.
 */
export interface EntityDDL {
	/** Unique entity ID within chunk (auto-generated if omitted) */
	id?: string;
	/** Entity archetype */
	type: EntityType;
	/** Local position within chunk [x, y, z] */
	position: Vec3;
	/** Euler rotation [x, y, z] in radians */
	rotation?: Vec3;
	/** Scale factor [x, y, z] or uniform number */
	scale?: Vec3 | number;
	/** Faction for material palette */
	faction?: Faction;

	// Type-specific properties (validated per-type)

	/** Enemy tier (for enemy types) */
	tier?: EnemyTier;
	/** Starting health (overrides default for type) */
	health?: number;
	/** Whether entity is initially active */
	active?: boolean;
	/** Character ID for rescue targets */
	characterId?: string;
	/** Loot table ID for collectibles */
	lootTable?: string;
	/** Custom data for specialized entities */
	customData?: Record<string, unknown>;
}

// ============================================================================
// Hazard DDL
// ============================================================================

/**
 * Hazard types for environmental dangers.
 */
export type HazardType = "MUD_PIT" | "TOXIC_SLUDGE" | "OIL_SLICK" | "WATER_CURRENT";

/**
 * Hazard definition in chunk DDL.
 */
export interface HazardDDL {
	/** Hazard type */
	type: HazardType;
	/** Center position [x, y, z] */
	position: Vec3;
	/** Hazard radius or dimensions */
	radius?: number;
	/** Damage per second (for damaging hazards) */
	damagePerSecond?: number;
	/** Movement speed multiplier (for slowing hazards) */
	speedMultiplier?: number;
	/** Visual intensity 0-1 */
	intensity?: number;
}

// ============================================================================
// Decoration DDL
// ============================================================================

/**
 * Decoration types for visual elements without gameplay impact.
 */
export type DecorationType =
	| "MANGROVE"
	| "REEDS"
	| "BURNT_TREES"
	| "LILYPADS"
	| "FLOATING_DRUMS"
	| "DEBRIS"
	| "ROCK"
	| "GRASS_CLUMP";

/**
 * Decoration definition in chunk DDL.
 */
export interface DecorationDDL {
	/** Decoration type */
	type: DecorationType;
	/** Position [x, y, z] */
	position: Vec3;
	/** Rotation [x, y, z] in radians */
	rotation?: Vec3;
	/** Scale factor */
	scale?: number;
	/** LOD distance (hide beyond this range) */
	lodDistance?: number;
}

// ============================================================================
// Objective DDL
// ============================================================================

/**
 * Objective types for chunk-specific missions.
 */
export type ObjectiveType =
	| "destroy"
	| "rescue"
	| "collect"
	| "defend"
	| "secure"
	| "escort"
	| "interact";

/**
 * Objective definition in chunk DDL.
 */
export interface ObjectiveDDL {
	/** Unique objective ID */
	id: string;
	/** Objective type */
	type: ObjectiveType;
	/** Display text for HUD */
	text: string;
	/** Target entity ID or count */
	target?: string;
	/** Required count (e.g., "destroy 3 siphons") */
	count?: number;
	/** Whether optional for chunk completion */
	optional?: boolean;
	/** Reward for completion */
	reward?: {
		coins?: number;
		xp?: number;
		peacekeeping?: number;
	};
}

// ============================================================================
// Terrain Configuration DDL
// ============================================================================

/**
 * Terrain generation parameters for a chunk.
 */
export interface TerrainConfigDDL {
	/** Base terrain type */
	type: TerrainType;
	/** Override seed for this chunk (defaults to coordinate-based) */
	seed?: number;
	/** Water level height */
	waterLevel?: number;
	/** Height variation multiplier */
	heightScale?: number;
	/** Ground material/color override */
	groundColor?: ColorRGB;
	/** Water material/color override */
	waterColor?: ColorRGB;
	/** Enable terrain deformation from impacts */
	deformable?: boolean;
}

// ============================================================================
// Lighting Configuration DDL
// ============================================================================

/**
 * Chunk-specific lighting overrides.
 */
export interface LightingOverridesDDL {
	/** Ambient light intensity multiplier */
	ambientIntensity?: number;
	/** Ambient light color */
	ambientColor?: ColorRGB;
	/** Fog density override */
	fogDensity?: number;
	/** Fog color override */
	fogColor?: ColorRGB;
	/** Point lights to add */
	pointLights?: Array<{
		position: Vec3;
		color: ColorRGB;
		intensity: number;
		range: number;
	}>;
}

// ============================================================================
// Audio Configuration DDL
// ============================================================================

/**
 * Chunk-specific audio configuration.
 */
export interface AudioConfigDDL {
	/** Ambient track ID */
	ambientTrack?: string;
	/** Combat music track ID */
	combatTrack?: string;
	/** Environmental sounds */
	environmentalSounds?: Array<{
		type: string;
		position?: Vec3;
		volume?: number;
		loop?: boolean;
	}>;
}

// ============================================================================
// Chunk DDL (Main Type)
// ============================================================================

/**
 * Complete chunk definition loaded from JSON.
 * This is the primary DDL type that defines all chunk content.
 */
export interface ChunkDDL {
	/** Chunk coordinates [x, z] */
	coordinates: ChunkCoord;

	/** Human-readable name for this chunk (optional) */
	name?: string;

	/** Narrative subtitle/description */
	subtitle?: string;

	/** POI type if this is a key location */
	poiType?: POIType;

	/** Base difficulty level 0-10 (overrides distance-based calculation) */
	difficulty?: number;

	/** Terrain configuration */
	terrain: TerrainConfigDDL;

	/** Initial territory state */
	territoryState?: TerritoryState;

	/** Entities to spawn in this chunk */
	entities: EntityDDL[];

	/** Environmental hazards */
	hazards?: HazardDDL[];

	/** Visual decorations */
	decorations?: DecorationDDL[];

	/** Chunk-specific objectives */
	objectives?: ObjectiveDDL[];

	/** Lighting overrides */
	lighting?: LightingOverridesDDL;

	/** Audio configuration */
	audio?: AudioConfigDDL;

	/** Drivers to activate for this chunk */
	drivers?: DriverInstanceDDL[];

	/** Paths/roads through this chunk */
	paths?: Array<{
		points: Vec3[];
		width: number;
		style: "dirt" | "planks" | "stones" | "elevated";
	}>;

	/** Next chunk suggestions for procedural continuity */
	connections?: {
		north?: string;
		south?: string;
		east?: string;
		west?: string;
	};
}

// ============================================================================
// Campaign/World DDL
// ============================================================================

/**
 * Key coordinate definition in world DDL.
 */
export interface KeyCoordinateDDL {
	/** Chunk coordinates */
	coordinates: ChunkCoord;
	/** POI type */
	type: POIType;
	/** Difficulty level */
	difficulty: number;
	/** Reference to chunk DDL file (optional - can be procedural) */
	chunkFile?: string;
	/** Character ID for rescue locations */
	rescueTarget?: string;
}

/**
 * World layout definition - top-level campaign structure.
 */
export interface WorldDDL {
	/** World identifier */
	worldId: string;
	/** Display name */
	name: string;
	/** World description */
	description?: string;
	/** World generation seed */
	seed: number;
	/** World radius in chunks */
	radius: number;
	/** Key coordinate definitions */
	keyCoordinates: KeyCoordinateDDL[];
	/** Default terrain type for procedural chunks */
	defaultTerrain: TerrainType;
	/** Difficulty scaling curve */
	difficultyScaling?: {
		/** Distance at which difficulty starts increasing */
		startDistance: number;
		/** Maximum difficulty value */
		maxDifficulty: number;
		/** Scaling curve exponent */
		exponent: number;
	};
}

// ============================================================================
// Runtime Chunk Data (Hydrated from DDL)
// ============================================================================

/**
 * Entity instance with runtime state.
 * Extends EntityDDL with mutable runtime properties.
 */
export interface ChunkEntity extends EntityDDL {
	/** Generated or specified ID */
	id: string;
	/** Current health (may differ from initial) */
	hp?: number;
	/** Whether entity has been defeated/collected */
	defeated?: boolean;
	/** Whether entity has been interacted with */
	interacted?: boolean;
	/** Custom runtime state */
	runtimeState?: Record<string, unknown>;
}

/**
 * Runtime chunk data stored in Zustand.
 * Combines DDL definition with persistent state changes.
 */
export interface ChunkData {
	/** Chunk ID in "x,z" format */
	id: string;
	/** X coordinate */
	x: number;
	/** Z coordinate */
	z: number;
	/** Generation seed */
	seed: number;
	/** Terrain type */
	terrainType: TerrainType;
	/** Whether chunk is secured (legacy compatibility) */
	secured: boolean;
	/** Territory ownership state */
	territoryState: TerritoryState;
	/** Entities with runtime state */
	entities: ChunkEntity[];
	/** Decorations (static, no runtime state) */
	decorations: DecorationDDL[];
	/** Last visited timestamp */
	lastVisited?: number;
	/** Whether AI is hibernated */
	hibernated?: boolean;
	/** POI type if applicable */
	poiType?: POIType;
	/** Difficulty level */
	difficulty?: number;
	/** Source DDL file (if loaded from file) */
	sourceFile?: string;
}
