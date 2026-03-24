/**
 * DDL Loader - Centralized loading and caching for DDL files.
 *
 * This module handles:
 *  - Fetching chunk and world DDL JSON files
 *  - Zod validation of loaded data
 *  - Caching to prevent redundant fetches
 *  - Error handling with typed error classes
 *  - Mobile-friendly timeout handling
 *
 * Architecture follows stellar-descent DDL loader patterns.
 */

import type { ChunkDDL, ChunkData, ChunkEntity, DecorationDDL, WorldDDL } from "./types";
import {
	crossValidateChunkDDL,
	safeValidateChunkDDL,
	safeValidateWorldDDL,
	validateChunkDDL,
	validateWorldDDL,
} from "./schema";

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Base class for DDL loading errors.
 */
export class DDLError extends Error {
	constructor(
		message: string,
		public readonly code: string,
	) {
		super(message);
		this.name = "DDLError";
	}
}

/**
 * Error thrown when a DDL file cannot be loaded (network, 404, etc.).
 */
export class DDLLoadError extends DDLError {
	constructor(
		message: string,
		public readonly url: string,
		public readonly cause?: Error,
	) {
		super(message, "LOAD_ERROR");
		this.name = "DDLLoadError";
	}
}

/**
 * Error thrown when DDL data fails Zod validation.
 */
export class DDLValidationError extends DDLError {
	constructor(
		message: string,
		public readonly errors: Array<{ path: string; message: string }>,
	) {
		super(message, "VALIDATION_ERROR");
		this.name = "DDLValidationError";
	}
}

/**
 * Error thrown when cross-validation fails.
 */
export class DDLCrossValidationError extends DDLError {
	constructor(
		message: string,
		public readonly errors: string[],
	) {
		super(message, "CROSS_VALIDATION_ERROR");
		this.name = "DDLCrossValidationError";
	}
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Loader configuration options.
 */
export interface DDLLoaderConfig {
	/** Base URL for chunk DDL files */
	chunkBasePath: string;
	/** Base URL for world DDL files */
	worldBasePath: string;
	/** Fetch timeout in milliseconds (0 = no timeout) */
	timeout: number;
	/** Mobile timeout (shorter for mobile devices) */
	mobileTimeout: number;
	/** Whether to run cross-validation after schema validation */
	crossValidate: boolean;
	/** Whether to throw on validation errors or return null */
	throwOnError: boolean;
}

const DEFAULT_CONFIG: DDLLoaderConfig = {
	chunkBasePath: "/chunks",
	worldBasePath: "/worlds",
	timeout: 10000,
	mobileTimeout: 5000,
	crossValidate: true,
	throwOnError: true,
};

// ============================================================================
// CACHES
// ============================================================================

/** Cache for loaded chunk DDL data */
const chunkCache = new Map<string, ChunkDDL>();

/** Cache for loaded world DDL data */
const worldCache = new Map<string, WorldDDL>();

/** Pending fetch promises to prevent duplicate requests */
const pendingChunkFetches = new Map<string, Promise<ChunkDDL | null>>();
const pendingWorldFetches = new Map<string, Promise<WorldDDL | null>>();

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Detects if running on a mobile device.
 */
function isMobileDevice(): boolean {
	if (typeof navigator === "undefined") return false;
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Gets the appropriate timeout based on device type.
 */
function getTimeout(config: DDLLoaderConfig): number {
	return isMobileDevice() ? config.mobileTimeout : config.timeout;
}

/**
 * Creates a coordinate key for cache lookups.
 */
function coordKey(x: number, z: number): string {
	return `${x},${z}`;
}

/**
 * Formats Zod errors into a readable array.
 */
function formatZodErrors(zodError: {
	issues: Array<{ path: (string | number)[]; message: string }>;
}): Array<{
	path: string;
	message: string;
}> {
	return zodError.issues.map((issue) => ({
		path: issue.path.join("."),
		message: issue.message,
	}));
}

// ============================================================================
// CHUNK LOADER
// ============================================================================

/**
 * Generates the URL for a chunk DDL file.
 */
export function getChunkUrl(x: number, z: number, config: Partial<DDLLoaderConfig> = {}): string {
	const basePath = config.chunkBasePath ?? DEFAULT_CONFIG.chunkBasePath;
	// Format: /chunks/5_-3.json for chunk at (5, -3)
	return `${basePath}/${x}_${z}.json`;
}

/**
 * Fetches a chunk DDL file from the server.
 * Returns null if the chunk doesn't have a DDL file (will use procedural generation).
 */
async function fetchChunkDDL(
	x: number,
	z: number,
	config: DDLLoaderConfig,
): Promise<ChunkDDL | null> {
	const url = getChunkUrl(x, z, config);
	const timeout = getTimeout(config);

	const controller = timeout > 0 ? new AbortController() : undefined;
	const timeoutId = controller ? setTimeout(() => controller.abort(), timeout) : undefined;

	try {
		const response = await fetch(url, {
			signal: controller?.signal,
		});

		if (timeoutId) clearTimeout(timeoutId);

		if (!response.ok) {
			if (response.status === 404) {
				// No DDL file for this chunk - will use procedural generation
				return null;
			}
			throw new DDLLoadError(
				`Failed to load chunk DDL: ${response.status} ${response.statusText}`,
				url,
			);
		}

		const data = await response.json();
		return data;
	} catch (error) {
		if (timeoutId) clearTimeout(timeoutId);

		if (error instanceof DDLLoadError) {
			throw error;
		}

		if (error instanceof Error && error.name === "AbortError") {
			throw new DDLLoadError(`Chunk DDL load timed out after ${timeout}ms`, url);
		}

		// Network error - chunk might not exist
		if (error instanceof TypeError && error.message.includes("fetch")) {
			return null;
		}

		throw new DDLLoadError(
			`Failed to load chunk DDL: ${String(error)}`,
			url,
			error instanceof Error ? error : undefined,
		);
	}
}

/**
 * Loads a chunk DDL file, validates it, and caches the result.
 *
 * @param x - Chunk X coordinate
 * @param z - Chunk Z coordinate
 * @param config - Optional loader configuration
 * @returns Validated ChunkDDL or null if no DDL file exists
 */
export async function loadChunkDDL(
	x: number,
	z: number,
	config: Partial<DDLLoaderConfig> = {},
): Promise<ChunkDDL | null> {
	const fullConfig = { ...DEFAULT_CONFIG, ...config };
	const key = coordKey(x, z);

	// Check cache first
	if (chunkCache.has(key)) {
		return chunkCache.get(key)!;
	}

	// Check if there's already a pending fetch
	if (pendingChunkFetches.has(key)) {
		return pendingChunkFetches.get(key)!;
	}

	// Start the fetch
	const fetchPromise = (async (): Promise<ChunkDDL | null> => {
		try {
			const rawData = await fetchChunkDDL(x, z, fullConfig);

			if (rawData === null) {
				// No DDL file - remove from pending and return null
				pendingChunkFetches.delete(key);
				return null;
			}

			// Validate with Zod
			const validationResult = safeValidateChunkDDL(rawData);

			if (!validationResult.success) {
				const errors = formatZodErrors(validationResult.error);
				const errorMsg = `Chunk DDL validation failed for [${x}, ${z}]: ${errors.map((e) => `${e.path}: ${e.message}`).join("; ")}`;

				if (fullConfig.throwOnError) {
					throw new DDLValidationError(errorMsg, errors);
				}
				console.error(errorMsg);
				return null;
			}

			const chunkDDL = validationResult.data as ChunkDDL;

			// Cross-validate
			if (fullConfig.crossValidate) {
				const crossErrors = crossValidateChunkDDL(chunkDDL);
				if (crossErrors.length > 0) {
					const errorMsg = `Chunk DDL cross-validation failed for [${x}, ${z}]: ${crossErrors.join("; ")}`;

					if (fullConfig.throwOnError) {
						throw new DDLCrossValidationError(errorMsg, crossErrors);
					}
					console.error(errorMsg);
					return null;
				}
			}

			// Cache and return
			chunkCache.set(key, chunkDDL);
			pendingChunkFetches.delete(key);
			return chunkDDL;
		} catch (error) {
			pendingChunkFetches.delete(key);
			throw error;
		}
	})();

	pendingChunkFetches.set(key, fetchPromise);
	return fetchPromise;
}

/**
 * Synchronously gets a chunk DDL from cache.
 * Returns undefined if not cached.
 */
export function getCachedChunkDDL(x: number, z: number): ChunkDDL | undefined {
	return chunkCache.get(coordKey(x, z));
}

/**
 * Checks if a chunk DDL is cached.
 */
export function isChunkDDLCached(x: number, z: number): boolean {
	return chunkCache.has(coordKey(x, z));
}

/**
 * Clears a specific chunk from the cache.
 */
export function clearChunkCache(x: number, z: number): void {
	chunkCache.delete(coordKey(x, z));
}

/**
 * Clears all cached chunk DDL data.
 */
export function clearAllChunkCache(): void {
	chunkCache.clear();
}

// ============================================================================
// WORLD LOADER
// ============================================================================

/**
 * Generates the URL for a world DDL file.
 */
export function getWorldUrl(worldId: string, config: Partial<DDLLoaderConfig> = {}): string {
	const basePath = config.worldBasePath ?? DEFAULT_CONFIG.worldBasePath;
	return `${basePath}/${worldId}.json`;
}

/**
 * Loads a world DDL file, validates it, and caches the result.
 *
 * @param worldId - World identifier
 * @param config - Optional loader configuration
 * @returns Validated WorldDDL
 */
export async function loadWorldDDL(
	worldId: string,
	config: Partial<DDLLoaderConfig> = {},
): Promise<WorldDDL> {
	const fullConfig = { ...DEFAULT_CONFIG, ...config };

	// Check cache first
	if (worldCache.has(worldId)) {
		return worldCache.get(worldId)!;
	}

	// Check if there's already a pending fetch
	if (pendingWorldFetches.has(worldId)) {
		const result = await pendingWorldFetches.get(worldId)!;
		if (result === null) {
			throw new DDLLoadError(`World DDL "${worldId}" not found`, getWorldUrl(worldId, config));
		}
		return result;
	}

	const url = getWorldUrl(worldId, config);
	const timeout = getTimeout(fullConfig);

	const fetchPromise = (async (): Promise<WorldDDL | null> => {
		const controller = timeout > 0 ? new AbortController() : undefined;
		const timeoutId = controller ? setTimeout(() => controller.abort(), timeout) : undefined;

		try {
			const response = await fetch(url, {
				signal: controller?.signal,
			});

			if (timeoutId) clearTimeout(timeoutId);

			if (!response.ok) {
				throw new DDLLoadError(
					`Failed to load world DDL: ${response.status} ${response.statusText}`,
					url,
				);
			}

			const rawData = await response.json();

			// Validate with Zod
			const validationResult = safeValidateWorldDDL(rawData);

			if (!validationResult.success) {
				const errors = formatZodErrors(validationResult.error);
				throw new DDLValidationError(
					`World DDL validation failed for "${worldId}": ${errors.map((e) => `${e.path}: ${e.message}`).join("; ")}`,
					errors,
				);
			}

			const worldDDL = validationResult.data as WorldDDL;

			// Cache and return
			worldCache.set(worldId, worldDDL);
			pendingWorldFetches.delete(worldId);
			return worldDDL;
		} catch (error) {
			if (timeoutId) clearTimeout(timeoutId);
			pendingWorldFetches.delete(worldId);

			if (error instanceof DDLError) {
				throw error;
			}

			if (error instanceof Error && error.name === "AbortError") {
				throw new DDLLoadError(`World DDL load timed out after ${timeout}ms`, url);
			}

			throw new DDLLoadError(
				`Failed to load world DDL: ${String(error)}`,
				url,
				error instanceof Error ? error : undefined,
			);
		}
	})();

	pendingWorldFetches.set(worldId, fetchPromise);

	const result = await fetchPromise;
	if (result === null) {
		throw new DDLLoadError(`World DDL "${worldId}" not found`, url);
	}
	return result;
}

/**
 * Synchronously gets a world DDL from cache.
 */
export function getCachedWorldDDL(worldId: string): WorldDDL | undefined {
	return worldCache.get(worldId);
}

/**
 * Clears all cached world DDL data.
 */
export function clearAllWorldCache(): void {
	worldCache.clear();
}

// ============================================================================
// DDL TO RUNTIME CONVERSION
// ============================================================================

/**
 * Generates a unique entity ID if one wasn't provided.
 */
function generateEntityId(type: string, index: number, chunkX: number, chunkZ: number): string {
	return `${type.toLowerCase()}-${chunkX}-${chunkZ}-${index}`;
}

/**
 * Converts a ChunkDDL to runtime ChunkData.
 * This bridges the declarative DDL format to the runtime format used by Zustand.
 *
 * @param ddl - Validated ChunkDDL
 * @param seed - Generation seed (from DDL or coordinate-based)
 * @returns ChunkData ready for Zustand storage
 */
export function ddlToChunkData(ddl: ChunkDDL, seed?: number): ChunkData {
	const [x, z] = ddl.coordinates;
	const chunkSeed = seed ?? ddl.terrain.seed ?? x * 374761393 + z * 668265263;

	// Convert entities with runtime state
	const entities: ChunkEntity[] = ddl.entities.map((entity, index) => ({
		...entity,
		id: entity.id ?? generateEntityId(entity.type, index, x, z),
		hp: entity.health,
		defeated: false,
		interacted: false,
	}));

	// Convert decorations
	const decorations: DecorationDDL[] = ddl.decorations ?? [];

	return {
		id: coordKey(x, z),
		x,
		z,
		seed: chunkSeed,
		terrainType: ddl.terrain.type,
		secured: ddl.territoryState === "SECURED",
		territoryState: ddl.territoryState ?? "NEUTRAL",
		entities,
		decorations,
		lastVisited: undefined,
		hibernated: false,
		poiType: ddl.poiType,
		difficulty: ddl.difficulty,
		sourceFile: `${x}_${z}.json`,
	};
}

/**
 * Merges DDL data with existing chunk state.
 * Preserves runtime state (hp, defeated, etc.) from existing data.
 *
 * @param ddl - Fresh DDL data
 * @param existing - Existing chunk data with runtime state
 * @returns Merged ChunkData
 */
export function mergeChunkData(ddl: ChunkDDL, existing: ChunkData): ChunkData {
	const fresh = ddlToChunkData(ddl);

	// Build a map of existing entity states
	const existingEntityStates = new Map<string, Partial<ChunkEntity>>();
	for (const entity of existing.entities) {
		existingEntityStates.set(entity.id, {
			hp: entity.hp,
			defeated: entity.defeated,
			interacted: entity.interacted,
			runtimeState: entity.runtimeState,
		});
	}

	// Merge entity states
	const mergedEntities = fresh.entities.map((entity) => {
		const existingState = existingEntityStates.get(entity.id);
		if (existingState) {
			return {
				...entity,
				hp: existingState.hp ?? entity.hp,
				defeated: existingState.defeated ?? entity.defeated,
				interacted: existingState.interacted ?? entity.interacted,
				runtimeState: existingState.runtimeState ?? entity.runtimeState,
			};
		}
		return entity;
	});

	return {
		...fresh,
		entities: mergedEntities,
		secured: existing.secured,
		territoryState: existing.territoryState,
		lastVisited: existing.lastVisited,
		hibernated: existing.hibernated,
	};
}

// ============================================================================
// BATCH LOADING
// ============================================================================

/**
 * Preloads multiple chunks in parallel.
 * Useful for loading chunks around the player's position.
 *
 * @param coordinates - Array of [x, z] coordinate pairs
 * @param config - Optional loader configuration
 * @returns Map of coordinate keys to loaded DDL (or null for procedural chunks)
 */
export async function preloadChunks(
	coordinates: Array<[number, number]>,
	config: Partial<DDLLoaderConfig> = {},
): Promise<Map<string, ChunkDDL | null>> {
	const results = new Map<string, ChunkDDL | null>();

	const promises = coordinates.map(async ([x, z]) => {
		const key = coordKey(x, z);
		try {
			const ddl = await loadChunkDDL(x, z, { ...config, throwOnError: false });
			results.set(key, ddl);
		} catch (error) {
			console.error(`Failed to preload chunk [${x}, ${z}]:`, error);
			results.set(key, null);
		}
	});

	await Promise.all(promises);
	return results;
}

/**
 * Gets all cached chunk coordinates.
 */
export function getCachedChunkCoordinates(): Array<[number, number]> {
	return Array.from(chunkCache.keys()).map((key) => {
		const [x, z] = key.split(",").map(Number);
		return [x, z] as [number, number];
	});
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { ChunkDDL, ChunkData, ChunkEntity, WorldDDL, DecorationDDL };
