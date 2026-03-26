/**
 * Fire System — simulates fire spread, damage, and terrain scorching.
 *
 * Mission 3-2: fires ignite on flammable terrain (toxic_sludge, mangrove),
 * spread to adjacent flammable tiles over time, damage units standing
 * in burning tiles, and leave behind "scorched" terrain when they burn out.
 *
 * Scorched terrain is passable but yields no resources.
 *
 * Nav graph is NOT rebuilt here — scorched and flammable terrain are both
 * passable, so walkability doesn't change. Only tidalSystem rebuilds the
 * nav graph (water/land transitions).
 */

import type { World } from "koota";
import type { TerrainType } from "../ai/terrainTypes";
import { Health } from "../ecs/traits/combat";
import { FireState } from "../ecs/traits/environment";
import { Position } from "../ecs/traits/spatial";
import { EventBus } from "../game/EventBus";

/** Terrain types that can catch fire. */
const FLAMMABLE_TERRAIN: Set<string> = new Set(["toxic_sludge", "mangrove"]);

/** Per-tick chance that fire spreads to an adjacent flammable tile (0-1). */
const SPREAD_CHANCE = 0.02;

/** Minimum duration (seconds) for a newly-spread fire. */
const SPREAD_FIRE_DURATION_MIN = 8;

/** Maximum duration (seconds) for a newly-spread fire. */
const SPREAD_FIRE_DURATION_MAX = 15;

/**
 * Tick the fire system. Call once per frame from the game loop.
 *
 * @param world        ECS world (must have FireState singleton added).
 * @param delta        Frame delta in seconds.
 * @param elapsedSec   Total mission elapsed time in seconds (for fire start timestamps).
 * @param terrainGrid  Mutable terrain grid — scorched tiles are written in place.
 */
export function fireSystem(
	world: World,
	delta: number,
	elapsedSec: number,
	terrainGrid: TerrainType[][] | null,
): void {
	const fireState = world.get(FireState);
	if (!fireState) return;

	const fires = [...fireState.activeFires];
	const { spreadRadius, damagePerSecond } = fireState;

	const height = terrainGrid ? terrainGrid.length : 0;
	const width = height > 0 ? terrainGrid![0].length : 0;

	// Build a set of currently-burning tile coords for fast lookup
	const burningSet = new Set<string>();
	for (const fire of fires) {
		burningSet.add(`${fire.x},${fire.y}`);
	}

	// --- Damage units on burning tiles ---
	const units = world.query(Health, Position);
	for (const unit of units) {
		const pos = unit.get(Position)!;
		const tx = Math.floor(pos.x);
		const ty = Math.floor(pos.y);
		if (burningSet.has(`${tx},${ty}`)) {
			const dmg = damagePerSecond * delta;
			unit.set(Health, (prev) => ({ current: prev.current - dmg }));
			EventBus.emit("under-attack", { x: pos.x, y: pos.y });
		}
	}

	// --- Check expired fires & spread ---
	const surviving: typeof fires = [];
	const newFires: typeof fires = [];

	for (const fire of fires) {
		const age = elapsedSec - fire.startTime;

		if (age >= fire.duration) {
			// Fire burned out — scorch the terrain
			if (terrainGrid && fire.y < height && fire.x < width) {
				terrainGrid[fire.y][fire.x] = "scorched" as TerrainType;
			}
			EventBus.emit("fire-extinguished", { x: fire.x, y: fire.y });
			continue;
		}

		surviving.push(fire);

		// --- Spread check ---
		if (!terrainGrid) continue;
		for (let dy = -spreadRadius; dy <= spreadRadius; dy++) {
			for (let dx = -spreadRadius; dx <= spreadRadius; dx++) {
				if (dx === 0 && dy === 0) continue;
				const nx = fire.x + dx;
				const ny = fire.y + dy;
				if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

				const key = `${nx},${ny}`;
				if (burningSet.has(key)) continue;

				const neighborTerrain = terrainGrid[ny][nx];
				if (!FLAMMABLE_TERRAIN.has(neighborTerrain)) continue;

				if (Math.random() < SPREAD_CHANCE) {
					const duration =
						SPREAD_FIRE_DURATION_MIN +
						Math.random() * (SPREAD_FIRE_DURATION_MAX - SPREAD_FIRE_DURATION_MIN);
					const newFire = { x: nx, y: ny, startTime: elapsedSec, duration };
					newFires.push(newFire);
					burningSet.add(key);
					EventBus.emit("fire-started", { x: nx, y: ny });
				}
			}
		}
	}

	// Merge surviving + newly-spread fires and persist
	const allFires = [...surviving, ...newFires];
	world.set(FireState, {
		...fireState,
		activeFires: allFires,
	});
}
