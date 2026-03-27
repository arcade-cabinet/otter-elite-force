/**
 * Fog of War System — Pure data fog grid (no rendering).
 *
 * Maintains a 2D Uint8Array grid with three states:
 *   0 = Unexplored (never seen)
 *   1 = Explored (previously seen, terrain only)
 *   2 = Visible (currently within friendly vision)
 *
 * Each frame:
 * 1. Demote all Visible (2) tiles to Explored (1).
 * 2. For each player-faction entity, mark tiles within VisionRadius as Visible (2).
 *    - Buildings have a base vision bonus (+2 tiles).
 *    - Watchtowers have extended range (doubled vision).
 *    - Stealth detection interaction: stealthed enemies in Explored tiles
 *      are invisible; only Visible tiles can reveal stealth.
 * 3. Tiles that were never Explored stay at 0.
 * 4. Minimap fog sync: provides a compact visibility snapshot for the minimap.
 *
 * The grid is stored on world.runtime.fogGrid (added by this system).
 */

import { Faction, Flags, Position, VisionRadius } from "@/engine/world/components";
import { FACTION_IDS } from "@/engine/content/ids";
import type { GameWorld } from "@/engine/world/gameWorld";

export const FOG_UNEXPLORED = 0;
export const FOG_EXPLORED = 1;
export const FOG_VISIBLE = 2;

/** Vision bonus tiles for buildings. */
const BUILDING_VISION_BONUS = 2;

/** Vision multiplier for watchtowers. */
const WATCHTOWER_VISION_MULTIPLIER = 2.0;

/** Type augmentation for fogGrid on world.runtime. */
export interface FogRuntime {
	fogGrid?: Uint8Array;
	/** Compact minimap fog data (1 byte per minimap pixel). */
	minimapFog?: Uint8Array;
}

/**
 * Create a flat fog grid of the given tile dimensions.
 * All tiles start as Unexplored (0).
 */
export function createFogGrid(width: number, height: number): Uint8Array {
	return new Uint8Array(width * height);
}

/**
 * Run one tick of the fog of war system.
 * Updates tile visibility based on unit and building vision radii.
 */
export function runFogSystem(world: GameWorld): void {
	const fogGrid = (world.runtime as FogRuntime).fogGrid;
	if (!fogGrid) return;

	const gridWidth = world.navigation.width;
	const gridHeight = world.navigation.height;
	if (gridWidth <= 0 || gridHeight <= 0) return;

	// Step 1: Demote all Visible tiles to Explored
	for (let i = 0; i < fogGrid.length; i++) {
		if (fogGrid[i] === FOG_VISIBLE) {
			fogGrid[i] = FOG_EXPLORED;
		}
	}

	// Step 2: Mark tiles around player-faction entities as Visible
	const playerFactionId = FACTION_IDS.ura;

	for (const eid of world.runtime.alive) {
		if (Faction.id[eid] !== playerFactionId) continue;

		let visionRadius = VisionRadius.value[eid];
		if (visionRadius <= 0) continue;

		// Apply vision bonuses for buildings
		if (Flags.isBuilding[eid] === 1) {
			const buildingType = world.runtime.entityTypeIndex.get(eid);
			if (buildingType === "watchtower") {
				visionRadius *= WATCHTOWER_VISION_MULTIPLIER;
			} else {
				visionRadius += BUILDING_VISION_BONUS;
			}
		}

		const entityTileX = Math.floor(Position.x[eid]);
		const entityTileY = Math.floor(Position.y[eid]);
		const radiusInt = Math.ceil(visionRadius);
		const radiusSq = visionRadius * visionRadius;

		for (let dy = -radiusInt; dy <= radiusInt; dy++) {
			for (let dx = -radiusInt; dx <= radiusInt; dx++) {
				if (dx * dx + dy * dy > radiusSq) continue;

				const tx = entityTileX + dx;
				const ty = entityTileY + dy;

				if (tx < 0 || tx >= gridWidth || ty < 0 || ty >= gridHeight) continue;

				fogGrid[ty * gridWidth + tx] = FOG_VISIBLE;
			}
		}
	}

	// Step 3: Sync minimap fog (downsample if minimap data exists)
	syncMinimapFog(world, fogGrid, gridWidth, gridHeight);
}

/**
 * Sync the compact minimap fog data from the full fog grid.
 * The minimap fog uses the same grid — no downsampling needed for
 * data purposes. The renderer can sample as needed.
 */
function syncMinimapFog(
	world: GameWorld,
	fogGrid: Uint8Array,
	_gridWidth: number,
	_gridHeight: number,
): void {
	const runtime = world.runtime as FogRuntime;
	if (!runtime.minimapFog) {
		// Create minimap fog buffer matching the full grid
		runtime.minimapFog = new Uint8Array(fogGrid.length);
	}
	// Copy fog state to minimap buffer
	runtime.minimapFog.set(fogGrid);
}

/**
 * Read the fog state at a specific tile coordinate.
 */
export function getFogState(
	world: GameWorld,
	tileX: number,
	tileY: number,
): number {
	const fogGrid = (world.runtime as FogRuntime).fogGrid;
	if (!fogGrid) return FOG_UNEXPLORED;

	const gridWidth = world.navigation.width;
	const gridHeight = world.navigation.height;

	if (tileX < 0 || tileX >= gridWidth || tileY < 0 || tileY >= gridHeight) {
		return FOG_UNEXPLORED;
	}

	return fogGrid[tileY * gridWidth + tileX];
}

/**
 * Check if a tile is currently visible (within friendly unit vision).
 * Real-time query against the fog grid.
 */
export function isTileVisible(world: GameWorld, tileX: number, tileY: number): boolean {
	return getFogState(world, tileX, tileY) === FOG_VISIBLE;
}

/**
 * Check if a tile has been explored at least once.
 */
export function isTileExplored(world: GameWorld, tileX: number, tileY: number): boolean {
	const state = getFogState(world, tileX, tileY);
	return state === FOG_EXPLORED || state === FOG_VISIBLE;
}

/**
 * Reveal a rectangular area on the fog grid (for scenario triggers).
 */
export function revealArea(
	world: GameWorld,
	x: number,
	y: number,
	width: number,
	height: number,
): void {
	const fogGrid = (world.runtime as FogRuntime).fogGrid;
	if (!fogGrid) return;

	const gridWidth = world.navigation.width;
	const gridHeight = world.navigation.height;

	for (let ty = y; ty < y + height; ty++) {
		for (let tx = x; tx < x + width; tx++) {
			if (tx < 0 || tx >= gridWidth || ty < 0 || ty >= gridHeight) continue;
			const idx = ty * gridWidth + tx;
			if (fogGrid[idx] === FOG_UNEXPLORED) {
				fogGrid[idx] = FOG_EXPLORED;
			}
		}
	}
}
