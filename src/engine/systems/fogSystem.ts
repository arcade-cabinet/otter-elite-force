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
 * 3. Tiles that were never Explored stay at 0.
 *
 * The grid is stored on world.runtime.fogGrid (added by this system).
 */

import { Faction, Position, VisionRadius } from "@/engine/world/components";
import { FACTION_IDS } from "@/engine/content/ids";
import type { GameWorld } from "@/engine/world/gameWorld";

export const FOG_UNEXPLORED = 0;
export const FOG_EXPLORED = 1;
export const FOG_VISIBLE = 2;

/**
 * Create a flat fog grid of the given tile dimensions.
 * All tiles start as Unexplored (0).
 */
export function createFogGrid(width: number, height: number): Uint8Array {
	return new Uint8Array(width * height);
}

/**
 * Run one tick of the fog of war system.
 * Updates tile visibility based on unit vision radii.
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

		const visionRadius = VisionRadius.value[eid];
		if (visionRadius <= 0) continue;

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

/** Type augmentation for fogGrid on world.runtime. */
export interface FogRuntime {
	fogGrid?: Uint8Array;
}
