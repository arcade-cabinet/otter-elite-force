/**
 * DDL Module - Data Definition Language for OTTER: ELITE FORCE
 *
 * This module provides the foundation for data-driven chunk and world definitions.
 * All chunk content (entities, hazards, objectives, drivers) can be specified
 * declaratively in JSON files validated by Zod schemas.
 *
 * @example
 * ```typescript
 * import { loadChunkDDL, ddlToChunkData } from '@/game/ddl';
 *
 * // Load DDL for a specific chunk (returns null if no DDL file exists)
 * const ddl = await loadChunkDDL(5, 5);
 * if (ddl) {
 *   const chunkData = ddlToChunkData(ddl);
 *   // Use chunkData in Zustand store
 * }
 * ```
 */

// Types (pure TypeScript interfaces)
export type {
	// Primitives
	ColorRGB,
	Vec3,
	ChunkCoord,
	// Enums
	TerrainType,
	TerritoryState,
	EntityType,
	EnemyTier,
	Faction,
	POIType,
	DriverId,
	HazardType,
	DecorationType,
	ObjectiveType,
	// Driver types
	DriverCapabilities,
	DriverInstanceDDL,
	// Entity types
	EntityDDL,
	ChunkEntity,
	// Hazard types
	HazardDDL,
	// Decoration types
	DecorationDDL,
	// Objective types
	ObjectiveDDL,
	// Terrain types
	TerrainConfigDDL,
	// Lighting types
	LightingOverridesDDL,
	// Audio types
	AudioConfigDDL,
	// Chunk types
	ChunkDDL,
	ChunkData,
	// World types
	KeyCoordinateDDL,
	WorldDDL,
} from "./types";

// Schemas (Zod validators)
export {
	// Enum schemas
	TerrainTypeSchema,
	TerritoryStateSchema,
	EntityTypeSchema,
	EnemyTierSchema,
	FactionSchema,
	POITypeSchema,
	DriverIdSchema,
	HazardTypeSchema,
	DecorationTypeSchema,
	ObjectiveTypeSchema,
	PathStyleSchema,
	// Entity schemas
	EntityDDLSchema,
	ChunkEntitySchema,
	// Hazard schemas
	HazardDDLSchema,
	// Decoration schemas
	DecorationDDLSchema,
	// Objective schemas
	ObjectiveDDLSchema,
	// Terrain schemas
	TerrainConfigDDLSchema,
	// Lighting schemas
	LightingOverridesDDLSchema,
	// Audio schemas
	AudioConfigDDLSchema,
	// Driver schemas
	DriverInstanceDDLSchema,
	// Chunk schemas
	ChunkDDLSchema,
	// World schemas
	KeyCoordinateDDLSchema,
	WorldDDLSchema,
	// Validation functions
	validateChunkDDL,
	validateWorldDDL,
	safeValidateChunkDDL,
	safeValidateWorldDDL,
	validateEntityDDL,
	validateChunkEntity,
	validateHazardDDL,
	validateDecorationDDL,
	validateObjectiveDDL,
	validateDriverInstanceDDL,
	validateKeyCoordinateDDL,
	// Cross-validation functions
	validateChunkEntityIds,
	validateChunkObjectiveTargets,
	validateChunkDriverConfigs,
	crossValidateChunkDDL,
	validateWorldReferences,
} from "./schema";

// Loader (fetch, validate, cache)
export {
	// Error types
	DDLError,
	DDLLoadError,
	DDLValidationError,
	DDLCrossValidationError,
	// Loader configuration
	type DDLLoaderConfig,
	// Chunk loading
	getChunkUrl,
	loadChunkDDL,
	getCachedChunkDDL,
	isChunkDDLCached,
	clearChunkCache,
	clearAllChunkCache,
	// World loading
	getWorldUrl,
	loadWorldDDL,
	getCachedWorldDDL,
	clearAllWorldCache,
	// DDL to runtime conversion
	ddlToChunkData,
	mergeChunkData,
	// Batch loading
	preloadChunks,
	getCachedChunkCoordinates,
} from "./loader";
