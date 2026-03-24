/**
 * DDL Schemas - Zod validation schemas for chunk and world DDL files.
 *
 * These schemas validate JSON data loaded from:
 *   public/chunks/{coordinates}.json
 *   public/worlds/{worldId}.json
 *
 * IMPORTANT: The Zod schemas here must produce types structurally
 * compatible with the hand-written interfaces in types.ts. The
 * interfaces in types.ts are the authoritative type definitions.
 *
 * Design follows stellar-descent DDL validation patterns.
 */

import { z } from "zod";
import type {
	ChunkDDL,
	ChunkEntity,
	DecorationDDL,
	DriverInstanceDDL,
	EntityDDL,
	HazardDDL,
	KeyCoordinateDDL,
	ObjectiveDDL,
	WorldDDL,
} from "./types";

// ============================================================================
// PRIMITIVE SCHEMAS
// ============================================================================

/** RGB color as [r, g, b] tuple (0-1 range). */
const ColorRGBSchema = z.tuple([
	z.number().min(0).max(1),
	z.number().min(0).max(1),
	z.number().min(0).max(1),
]);

/** 3-component vector [x, y, z]. */
const Vec3Schema = z.tuple([z.number(), z.number(), z.number()]);

/** 2-component chunk coordinate [x, z]. */
const ChunkCoordSchema = z.tuple([z.number().int(), z.number().int()]);

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

/** Terrain biome types. */
export const TerrainTypeSchema = z.enum(["RIVER", "MARSH", "DENSE_JUNGLE", "CLEARING", "SWAMP"]);

/** Territory ownership states. */
export const TerritoryStateSchema = z.enum(["HOSTILE", "NEUTRAL", "SECURED"]);

/** Entity archetype types. */
export const EntityTypeSchema = z.enum([
	// Enemies
	"GATOR",
	"SCOUT",
	"SNAKE",
	"SNAPPER",
	// Structures
	"HUT",
	"WATCHTOWER",
	"LONGHOUSE",
	"MEDICAL_POST",
	// Objectives
	"SIPHON",
	"GAS_STOCKPILE",
	"PRISON_CAGE",
	"CLAM_BASKET",
	"CLAM",
	// Environment
	"MUD_PIT",
	"TOXIC_SLUDGE",
	"OIL_SLICK",
	"DEBRIS",
	// Interactions
	"EXTRACTION_POINT",
	"HEALER",
	"VILLAGER",
	"RAFT",
	// Decorations
	"MANGROVE",
	"REEDS",
	"BURNT_TREES",
	"LILYPADS",
	"FLOATING_DRUMS",
]);

/** Enemy tier levels. */
export const EnemyTierSchema = z.enum(["normal", "heavy", "elite", "boss"]);

/** Faction types. */
export const FactionSchema = z.enum(["URA", "SCALE_GUARD", "NATIVE", "NEUTRAL"]);

/** POI types. */
export const POITypeSchema = z.enum([
	"STARTING_LZ",
	"VILLAGE",
	"ENEMY_OUTPOST",
	"SIPHON_CLUSTER",
	"GAS_DEPOT",
	"HEALER_HUB",
	"WAYPOINT",
	"PRISON_CAMP",
	"BOSS_ARENA",
]);

/** Driver IDs. */
export const DriverIdSchema = z.enum([
	"prison-rescue",
	"healer-hub",
	"boss-arena",
	"underwater-cache",
	"village-liberation",
	"siphon-assault",
	"gas-depot-capture",
	"patrol-spawner",
	"ambient-hazards",
]);

/** Hazard types. */
export const HazardTypeSchema = z.enum(["MUD_PIT", "TOXIC_SLUDGE", "OIL_SLICK", "WATER_CURRENT"]);

/** Decoration types. */
export const DecorationTypeSchema = z.enum([
	"MANGROVE",
	"REEDS",
	"BURNT_TREES",
	"LILYPADS",
	"FLOATING_DRUMS",
	"DEBRIS",
	"ROCK",
	"GRASS_CLUMP",
]);

/** Objective types. */
export const ObjectiveTypeSchema = z.enum([
	"destroy",
	"rescue",
	"collect",
	"defend",
	"secure",
	"escort",
	"interact",
]);

/** Path styles. */
export const PathStyleSchema = z.enum(["dirt", "planks", "stones", "elevated"]);

// ============================================================================
// ENTITY SCHEMAS
// ============================================================================

/** Entity definition schema. */
export const EntityDDLSchema = z.object({
	id: z.string().optional(),
	type: EntityTypeSchema,
	position: Vec3Schema,
	rotation: Vec3Schema.optional(),
	scale: z.union([Vec3Schema, z.number()]).optional(),
	faction: FactionSchema.optional(),
	tier: EnemyTierSchema.optional(),
	health: z.number().positive().optional(),
	active: z.boolean().optional(),
	characterId: z.string().optional(),
	lootTable: z.string().optional(),
	customData: z.record(z.string(), z.unknown()).optional(),
});

/** Chunk entity with runtime state. */
export const ChunkEntitySchema = EntityDDLSchema.extend({
	id: z.string(), // Required for runtime
	hp: z.number().optional(),
	defeated: z.boolean().optional(),
	interacted: z.boolean().optional(),
	runtimeState: z.record(z.string(), z.unknown()).optional(),
});

// ============================================================================
// HAZARD SCHEMAS
// ============================================================================

/** Hazard definition schema. */
export const HazardDDLSchema = z.object({
	type: HazardTypeSchema,
	position: Vec3Schema,
	radius: z.number().positive().optional(),
	damagePerSecond: z.number().nonnegative().optional(),
	speedMultiplier: z.number().min(0).max(1).optional(),
	intensity: z.number().min(0).max(1).optional(),
});

// ============================================================================
// DECORATION SCHEMAS
// ============================================================================

/** Decoration definition schema. */
export const DecorationDDLSchema = z.object({
	type: DecorationTypeSchema,
	position: Vec3Schema,
	rotation: Vec3Schema.optional(),
	scale: z.number().positive().optional(),
	lodDistance: z.number().positive().optional(),
});

// ============================================================================
// OBJECTIVE SCHEMAS
// ============================================================================

/** Objective reward schema. */
const ObjectiveRewardSchema = z.object({
	coins: z.number().int().nonnegative().optional(),
	xp: z.number().int().nonnegative().optional(),
	peacekeeping: z.number().int().nonnegative().optional(),
});

/** Objective definition schema. */
export const ObjectiveDDLSchema = z.object({
	id: z.string().min(1),
	type: ObjectiveTypeSchema,
	text: z.string().min(1),
	target: z.string().optional(),
	count: z.number().int().positive().optional(),
	optional: z.boolean().optional(),
	reward: ObjectiveRewardSchema.optional(),
});

// ============================================================================
// TERRAIN CONFIG SCHEMAS
// ============================================================================

/** Terrain configuration schema. */
export const TerrainConfigDDLSchema = z.object({
	type: TerrainTypeSchema,
	seed: z.number().int().optional(),
	waterLevel: z.number().optional(),
	heightScale: z.number().positive().optional(),
	groundColor: ColorRGBSchema.optional(),
	waterColor: ColorRGBSchema.optional(),
	deformable: z.boolean().optional(),
});

// ============================================================================
// LIGHTING SCHEMAS
// ============================================================================

/** Point light schema. */
const PointLightSchema = z.object({
	position: Vec3Schema,
	color: ColorRGBSchema,
	intensity: z.number().positive(),
	range: z.number().positive(),
});

/** Lighting overrides schema. */
export const LightingOverridesDDLSchema = z.object({
	ambientIntensity: z.number().nonnegative().optional(),
	ambientColor: ColorRGBSchema.optional(),
	fogDensity: z.number().nonnegative().optional(),
	fogColor: ColorRGBSchema.optional(),
	pointLights: z.array(PointLightSchema).optional(),
});

// ============================================================================
// AUDIO SCHEMAS
// ============================================================================

/** Environmental sound schema. */
const EnvironmentalSoundSchema = z.object({
	type: z.string().min(1),
	position: Vec3Schema.optional(),
	volume: z.number().min(0).max(1).optional(),
	loop: z.boolean().optional(),
});

/** Audio configuration schema. */
export const AudioConfigDDLSchema = z.object({
	ambientTrack: z.string().optional(),
	combatTrack: z.string().optional(),
	environmentalSounds: z.array(EnvironmentalSoundSchema).optional(),
});

// ============================================================================
// DRIVER SCHEMAS
// ============================================================================

/** Driver instance schema. */
export const DriverInstanceDDLSchema = z.object({
	id: DriverIdSchema,
	activeStates: z.array(z.string()).optional(),
	config: z.record(z.string(), z.unknown()),
});

// ============================================================================
// PATH SCHEMAS
// ============================================================================

/** Path definition schema. */
const PathDDLSchema = z.object({
	points: z.array(Vec3Schema).min(2),
	width: z.number().positive(),
	style: PathStyleSchema,
});

// ============================================================================
// CHUNK DDL SCHEMA (MAIN)
// ============================================================================

/** Chunk connections schema. */
const ChunkConnectionsSchema = z.object({
	north: z.string().optional(),
	south: z.string().optional(),
	east: z.string().optional(),
	west: z.string().optional(),
});

/**
 * Full chunk DDL schema.
 * This is the primary validation schema for chunk JSON files.
 */
export const ChunkDDLSchema = z.object({
	coordinates: ChunkCoordSchema,
	name: z.string().optional(),
	subtitle: z.string().optional(),
	poiType: POITypeSchema.optional(),
	difficulty: z.number().min(0).max(10).optional(),
	terrain: TerrainConfigDDLSchema,
	territoryState: TerritoryStateSchema.optional(),
	entities: z.array(EntityDDLSchema),
	hazards: z.array(HazardDDLSchema).optional(),
	decorations: z.array(DecorationDDLSchema).optional(),
	objectives: z.array(ObjectiveDDLSchema).optional(),
	lighting: LightingOverridesDDLSchema.optional(),
	audio: AudioConfigDDLSchema.optional(),
	drivers: z.array(DriverInstanceDDLSchema).optional(),
	paths: z.array(PathDDLSchema).optional(),
	connections: ChunkConnectionsSchema.optional(),
});

// ============================================================================
// WORLD DDL SCHEMAS
// ============================================================================

/** Difficulty scaling configuration. */
const DifficultyScalingSchema = z.object({
	startDistance: z.number().nonnegative(),
	maxDifficulty: z.number().positive(),
	exponent: z.number().positive(),
});

/** Key coordinate definition. */
export const KeyCoordinateDDLSchema = z.object({
	coordinates: ChunkCoordSchema,
	type: POITypeSchema,
	difficulty: z.number().min(0).max(10),
	chunkFile: z.string().optional(),
	rescueTarget: z.string().optional(),
});

/**
 * Full world DDL schema.
 * Validates top-level campaign/world definitions.
 */
export const WorldDDLSchema = z.object({
	worldId: z.string().min(1),
	name: z.string().min(1),
	description: z.string().optional(),
	seed: z.number().int(),
	radius: z.number().int().positive(),
	keyCoordinates: z.array(KeyCoordinateDDLSchema).min(1),
	defaultTerrain: TerrainTypeSchema,
	difficultyScaling: DifficultyScalingSchema.optional(),
});

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates raw JSON as a ChunkDDL. Throws ZodError on failure.
 */
export function validateChunkDDL(data: unknown): ChunkDDL {
	return ChunkDDLSchema.parse(data) as ChunkDDL;
}

/**
 * Validates raw JSON as a WorldDDL. Throws ZodError on failure.
 */
export function validateWorldDDL(data: unknown): WorldDDL {
	return WorldDDLSchema.parse(data) as WorldDDL;
}

/**
 * Safe validation for ChunkDDL - returns result object instead of throwing.
 */
export function safeValidateChunkDDL(data: unknown) {
	return ChunkDDLSchema.safeParse(data);
}

/**
 * Safe validation for WorldDDL - returns result object instead of throwing.
 */
export function safeValidateWorldDDL(data: unknown) {
	return WorldDDLSchema.safeParse(data);
}

/**
 * Validates an entity definition.
 */
export function validateEntityDDL(data: unknown): EntityDDL {
	return EntityDDLSchema.parse(data) as EntityDDL;
}

/**
 * Validates a chunk entity with runtime state.
 */
export function validateChunkEntity(data: unknown): ChunkEntity {
	return ChunkEntitySchema.parse(data) as ChunkEntity;
}

/**
 * Validates a hazard definition.
 */
export function validateHazardDDL(data: unknown): HazardDDL {
	return HazardDDLSchema.parse(data) as HazardDDL;
}

/**
 * Validates a decoration definition.
 */
export function validateDecorationDDL(data: unknown): DecorationDDL {
	return DecorationDDLSchema.parse(data) as DecorationDDL;
}

/**
 * Validates an objective definition.
 */
export function validateObjectiveDDL(data: unknown): ObjectiveDDL {
	return ObjectiveDDLSchema.parse(data) as ObjectiveDDL;
}

/**
 * Validates a driver instance definition.
 */
export function validateDriverInstanceDDL(data: unknown): DriverInstanceDDL {
	return DriverInstanceDDLSchema.parse(data) as DriverInstanceDDL;
}

/**
 * Validates a key coordinate definition.
 */
export function validateKeyCoordinateDDL(data: unknown): KeyCoordinateDDL {
	return KeyCoordinateDDLSchema.parse(data) as KeyCoordinateDDL;
}

// ============================================================================
// CROSS-VALIDATION HELPERS
// ============================================================================

/**
 * Validates that all entity IDs in a chunk are unique.
 *
 * @param chunk - Validated chunk DDL
 * @returns Array of error messages, empty if valid
 */
export function validateChunkEntityIds(chunk: ChunkDDL): string[] {
	const errors: string[] = [];
	const ids = new Set<string>();

	for (const entity of chunk.entities) {
		if (entity.id) {
			if (ids.has(entity.id)) {
				errors.push(
					`Duplicate entity ID "${entity.id}" in chunk [${chunk.coordinates.join(", ")}]`,
				);
			}
			ids.add(entity.id);
		}
	}

	return errors;
}

/**
 * Validates that all objective targets reference valid entities.
 *
 * @param chunk - Validated chunk DDL
 * @returns Array of error messages, empty if valid
 */
export function validateChunkObjectiveTargets(chunk: ChunkDDL): string[] {
	const errors: string[] = [];

	if (!chunk.objectives) return errors;

	const entityIds = new Set(chunk.entities.filter((e) => e.id).map((e) => e.id as string));

	for (const objective of chunk.objectives) {
		if (objective.target && !entityIds.has(objective.target)) {
			// Target could be an entity type, not just an ID
			const isEntityType = EntityTypeSchema.safeParse(objective.target).success;
			if (!isEntityType) {
				errors.push(
					`Objective "${objective.id}" references unknown target "${objective.target}" in chunk [${chunk.coordinates.join(", ")}]`,
				);
			}
		}
	}

	return errors;
}

/**
 * Validates that all driver configs have required fields for their type.
 * This is a shallow check - deep validation happens in each driver.
 *
 * @param chunk - Validated chunk DDL
 * @returns Array of error messages, empty if valid
 */
export function validateChunkDriverConfigs(chunk: ChunkDDL): string[] {
	const errors: string[] = [];

	if (!chunk.drivers) return errors;

	for (const driver of chunk.drivers) {
		// Each driver type may have required config fields
		// This is a placeholder for driver-specific validation
		switch (driver.id) {
			case "prison-rescue":
				if (!driver.config.characterId) {
					errors.push(`Driver "prison-rescue" requires characterId in config`);
				}
				break;
			case "boss-arena":
				if (!driver.config.bossType) {
					errors.push(`Driver "boss-arena" requires bossType in config`);
				}
				break;
			// Add more driver-specific validation as needed
		}
	}

	return errors;
}

/**
 * Performs full cross-validation on a chunk DDL.
 *
 * @param chunk - Validated chunk DDL
 * @returns Array of all error messages, empty if valid
 */
export function crossValidateChunkDDL(chunk: ChunkDDL): string[] {
	return [
		...validateChunkEntityIds(chunk),
		...validateChunkObjectiveTargets(chunk),
		...validateChunkDriverConfigs(chunk),
	];
}

/**
 * Cross-validates a world by checking that all referenced chunk files exist.
 *
 * @param world - Validated world DDL
 * @param loadedChunks - Set of chunk coordinate strings that have been loaded
 * @returns Array of error messages, empty if valid
 */
export function validateWorldReferences(world: WorldDDL, loadedChunks: Set<string>): string[] {
	const errors: string[] = [];

	for (const keyCoord of world.keyCoordinates) {
		const coordKey = `${keyCoord.coordinates[0]},${keyCoord.coordinates[1]}`;
		if (keyCoord.chunkFile && !loadedChunks.has(coordKey)) {
			errors.push(
				`World "${world.worldId}" references chunk file "${keyCoord.chunkFile}" for [${coordKey}] which has no loaded DDL`,
			);
		}
	}

	return errors;
}
