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
import { runBuildingSystem } from "./buildingSystem";
import { runResearchSystem } from "./researchSystem";
import { runDetectionSystem } from "./detectionSystem";

export { runOrderSystem } from "./orderSystem";
export { runMovementSystem } from "./movementSystem";
export { runCombatSystem } from "./combatSystem";
export { runEconomySystem, resetGatherTimers } from "./economySystem";
export { runProductionSystem } from "./productionSystem";
export { runAiSystem, resetAIStates } from "./aiSystem";
export { runFogSystem, createFogGrid, getFogState, isTileVisible, isTileExplored, revealArea, FOG_UNEXPLORED, FOG_EXPLORED, FOG_VISIBLE } from "./fogSystem";
export type { FogRuntime } from "./fogSystem";
export { runBuildingSystem, canPlaceBuilding, placeBuilding, canTrainUnit, getBuildingDef } from "./buildingSystem";
export type { TileMap, TerrainType } from "./buildingSystem";
export { runResearchSystem, queueResearch, isResearchCompleted, getResearchDef } from "./researchSystem";
export type { ResearchDef } from "./researchSystem";
export { runDetectionSystem } from "./detectionSystem";

/**
 * Run all game systems in the canonical tick order:
 * 1. Orders (validate/resolve order queues)
 * 2. AI (FSM decisions for enemy entities)
 * 3. Movement
 * 4. Combat (attacks, projectiles, death cleanup)
 * 5. Economy (gathering, passive income)
 * 6. Production (unit training queues)
 * 7. Building (construction progress)
 * 8. Research (tech progress)
 * 9. Detection (stealth/cone detection)
 * 10. Fog (visibility grid)
 * 11. Flush removals
 */
export function runAllSystems(world: GameWorld): void {
	runOrderSystem(world);
	runAiSystem(world);
	runMovementSystem(world);
	runCombatSystem(world);
	runEconomySystem(world);
	runProductionSystem(world);
	runBuildingSystem(world);
	runResearchSystem(world);
	runDetectionSystem(world);
	runFogSystem(world);
	flushRemovals(world);
}
