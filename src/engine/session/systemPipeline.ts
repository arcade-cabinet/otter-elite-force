/**
 * System Pipeline — ordered execution of all gameplay systems per tick.
 *
 * The pipeline runs systems in a fixed order each frame:
 *   1. movement   — resolve move orders toward targets
 *   2. combat     — attack resolution and damage application
 *   3. economy    — resource gathering and passive income
 *   4. production — building construction and unit training
 *   5. ai         — enemy behavior and decision-making
 *   6. fog        — fog of war visibility updates
 *   7. flush      — remove dead entities from the world
 *
 * Each system receives the GameWorld and operates on its ECS data directly.
 */

import { runAllSystems } from "@/engine/systems";
import type { GameWorld } from "@/engine/world/gameWorld";

export interface SystemPipeline {
	/** Execute one tick of all gameplay systems in order. */
	step(): void;
	/** Clean up any pipeline state. */
	dispose(): void;
}

/**
 * Create the system execution pipeline for a GameWorld.
 * Call step() once per simulation tick to advance all gameplay systems.
 */
export function createSystemPipeline(world: GameWorld): SystemPipeline {
	let disposed = false;

	return {
		step(): void {
			if (disposed) return;
			if (world.session.phase !== "playing") return;
			if (world.time.deltaMs <= 0) return;

			runAllSystems(world);
		},
		dispose(): void {
			disposed = true;
		},
	};
}
