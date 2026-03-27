/**
 * Fire System — Simulates fire spread, damage, and terrain scorching.
 *
 * - Fire state tracking: array of active fires with position, start time, duration
 * - Fire spread: 2% chance per tick to adjacent flammable tiles (mangrove, toxic_sludge)
 * - Fire burnout: fires expire after duration, terrain becomes "scorched"
 * - "fire-started" and "fire-extinguished" events
 * - Fire damage per second to entities within fire tile
 *
 * Used in Mission 10 (Scorched Earth).
 * Pure function on GameWorld.
 */

import { TerrainTypeId } from "@/engine/content/terrainTypes";
import { Flags, Health, Position } from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";
import { markForRemoval } from "@/engine/world/gameWorld";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Fire damage per second to entities in burning tiles. */
const FIRE_DAMAGE_PER_SEC = 3;

/** Per-tick chance that fire spreads to an adjacent flammable tile (0-1). */
const SPREAD_CHANCE = 0.02;

/** Spread radius in tiles (adjacency check). */
const SPREAD_RADIUS = 1;

/** Minimum duration (seconds) for a newly-spread fire. */
const SPREAD_FIRE_DURATION_MIN = 8;

/** Maximum duration (seconds) for a newly-spread fire. */
const SPREAD_FIRE_DURATION_MAX = 15;

/** Terrain type IDs that can catch fire. */
const FLAMMABLE_TERRAIN = new Set<number>([TerrainTypeId.mangrove, TerrainTypeId.toxic_sludge]);

// ---------------------------------------------------------------------------
// Types & Runtime augmentation
// ---------------------------------------------------------------------------

export interface ActiveFire {
	x: number;
	y: number;
	startTime: number;
	duration: number;
}

export interface FireRuntime {
	/** All currently burning fire entries. */
	activeFires?: ActiveFire[];
}

// ---------------------------------------------------------------------------
// Main system
// ---------------------------------------------------------------------------

/**
 * Run one tick of the fire system.
 * Processes fire damage, spread, and burnout.
 */
export function runFireSystem(world: GameWorld): void {
	const deltaSec = world.time.deltaMs / 1000;
	if (deltaSec <= 0) return;

	const runtime = world.runtime as unknown as FireRuntime & GameWorld["runtime"];
	const fires = runtime.activeFires;
	if (!fires || fires.length === 0) return;

	const elapsedSec = world.time.elapsedMs / 1000;
	const terrainGrid = world.runtime.terrainGrid;
	const gridHeight = terrainGrid ? terrainGrid.length : 0;
	const gridWidth = gridHeight > 0 ? (terrainGrid?.[0]?.length ?? 0) : 0;

	// Build a set of currently-burning tile coords for fast lookup
	const burningSet = new Set<string>();
	for (const fire of fires) {
		burningSet.add(`${fire.x},${fire.y}`);
	}

	// --- Damage entities on burning tiles ---
	for (const eid of world.runtime.alive) {
		if (Flags.isProjectile[eid] === 1) continue;
		if (Flags.isResource[eid] === 1) continue;

		const px = Position.x[eid];
		const py = Position.y[eid];
		const tx = Math.floor(px);
		const ty = Math.floor(py);

		if (burningSet.has(`${tx},${ty}`)) {
			const dmg = FIRE_DAMAGE_PER_SEC * deltaSec;
			Health.current[eid] -= dmg;
			if (Health.current[eid] <= 0) {
				markForRemoval(world, eid);
			}
		}
	}

	// --- Check expired fires & spread ---
	const surviving: ActiveFire[] = [];
	const newFires: ActiveFire[] = [];

	for (const fire of fires) {
		const age = elapsedSec - fire.startTime;

		if (age >= fire.duration) {
			// Fire burned out -- scorch the terrain
			if (terrainGrid && fire.y >= 0 && fire.y < gridHeight && fire.x >= 0 && fire.x < gridWidth) {
				terrainGrid[fire.y][fire.x] = TerrainTypeId.scorched;
			}
			world.events.push({
				type: "fire-extinguished",
				payload: { x: fire.x, y: fire.y },
			});
			continue;
		}

		surviving.push(fire);

		// --- Spread check ---
		if (!terrainGrid) continue;
		for (let dy = -SPREAD_RADIUS; dy <= SPREAD_RADIUS; dy++) {
			for (let dx = -SPREAD_RADIUS; dx <= SPREAD_RADIUS; dx++) {
				if (dx === 0 && dy === 0) continue;
				const nx = fire.x + dx;
				const ny = fire.y + dy;
				if (nx < 0 || nx >= gridWidth || ny < 0 || ny >= gridHeight) continue;

				const key = `${nx},${ny}`;
				if (burningSet.has(key)) continue;

				const neighborTerrain = terrainGrid[ny][nx];
				if (!FLAMMABLE_TERRAIN.has(neighborTerrain)) continue;

				if (Math.random() < SPREAD_CHANCE) {
					const duration =
						SPREAD_FIRE_DURATION_MIN +
						Math.random() * (SPREAD_FIRE_DURATION_MAX - SPREAD_FIRE_DURATION_MIN);
					const newFire: ActiveFire = { x: nx, y: ny, startTime: elapsedSec, duration };
					newFires.push(newFire);
					burningSet.add(key);
					world.events.push({
						type: "fire-started",
						payload: { x: nx, y: ny },
					});
				}
			}
		}
	}

	// Merge surviving + newly-spread fires and persist
	runtime.activeFires = [...surviving, ...newFires];
}

// ---------------------------------------------------------------------------
// Fire ignition helper
// ---------------------------------------------------------------------------

/**
 * Ignite a fire at a specific tile coordinate.
 * Initializes the activeFires array if needed.
 */
export function igniteFireAt(world: GameWorld, x: number, y: number, duration: number): void {
	const runtime = world.runtime as unknown as FireRuntime;
	if (!runtime.activeFires) {
		runtime.activeFires = [];
	}

	// Don't ignite if already burning
	const already = runtime.activeFires.some((f) => f.x === x && f.y === y);
	if (already) return;

	const startTime = world.time.elapsedMs / 1000;
	runtime.activeFires.push({ x, y, startTime, duration });
	world.events.push({
		type: "fire-started",
		payload: { x, y },
	});
}

// ---------------------------------------------------------------------------
// Reset (for tests and new missions)
// ---------------------------------------------------------------------------

/** Reset fire state on the runtime. */
export function resetFireState(world: GameWorld): void {
	const runtime = world.runtime as unknown as FireRuntime;
	runtime.activeFires = undefined;
}
