/**
 * System barrel — exports all systems and the runAllSystems orchestrator.
 */

import type { GameWorld } from "@/engine/world/gameWorld";
import { flushRemovals } from "@/engine/world/gameWorld";

import { runOrderSystem } from "./orderSystem";
import { runMovementSystem } from "./movementSystem";
import { runCombatSystem } from "./combatSystem";
import { runEconomySystem } from "./economySystem";
import { runProductionSystem } from "./productionSystem";
import { runAiSystem } from "./aiSystem";
import { runFogSystem } from "./fogSystem";

export { runOrderSystem } from "./orderSystem";
export { runMovementSystem } from "./movementSystem";
export { runCombatSystem } from "./combatSystem";
export { runEconomySystem, resetGatherTimers } from "./economySystem";
export { runProductionSystem } from "./productionSystem";
export { runAiSystem } from "./aiSystem";
export { runFogSystem, createFogGrid, getFogState, FOG_UNEXPLORED, FOG_EXPLORED, FOG_VISIBLE } from "./fogSystem";
export type { FogRuntime } from "./fogSystem";

/**
 * Run all game systems in the canonical tick order:
 * 1. Orders (validate/resolve order queues)
 * 2. Movement
 * 3. Combat
 * 4. Economy
 * 5. Production
 * 6. AI
 * 7. Fog
 * 8. Flush removals
 */
export function runAllSystems(world: GameWorld): void {
	runOrderSystem(world);
	runMovementSystem(world);
	runCombatSystem(world);
	runEconomySystem(world);
	runProductionSystem(world);
	runAiSystem(world);
	runFogSystem(world);
	flushRemovals(world);
}
