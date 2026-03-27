/**
 * System barrel -- exports all systems and the runAllSystems orchestrator.
 */

import type { GameWorld } from "@/engine/world/gameWorld";
import { flushRemovals, tickFloatingTexts } from "@/engine/world/gameWorld";
import { runAbilitySystem } from "./abilitySystem";
import { runAiSystem } from "./aiSystem";
import { runBuildingSystem } from "./buildingSystem";
import { runCombatSystem } from "./combatSystem";
import { runDetectionSystem } from "./detectionSystem";
import { runEconomySystem } from "./economySystem";
import { runEncounterSystem } from "./encounterSystemEngine";
import { runFogSystem } from "./fogSystem";
import { runLootSystem } from "./lootSystem";
import { runMovementSystem } from "./movementSystem";
import { runOrderSystem } from "./orderSystem";
import { runProductionSystem } from "./productionSystem";
import { runResearchSystem } from "./researchSystem";
import { runVeterancySystem } from "./veterancySystem";

export type { AbilityDef } from "./abilitySystem";
export {
	ABILITY_CONFIG,
	ABILITY_REGISTRY,
	getAbilityCooldown,
	getAbilityDef,
	grantAbility,
	hasAbility,
	queueAbility,
	runAbilitySystem,
} from "./abilitySystem";
export { resetAIStates, runAiSystem } from "./aiSystem";
export type { TerrainType, TileMap } from "./buildingSystem";
export {
	canPlaceBuilding,
	canTrainUnit,
	getBuildingDef,
	placeBuilding,
	runBuildingSystem,
} from "./buildingSystem";
export { runCombatSystem } from "./combatSystem";
export { runDetectionSystem } from "./detectionSystem";
export { resetGatherTimers, runEconomySystem } from "./economySystem";
export type { EncounterComposition, EncounterEntry } from "./encounterSystemEngine";
export {
	DEFAULT_ENCOUNTER_ENTRIES,
	initEncounterEntries,
	resetEncounterState,
	runEncounterSystem,
} from "./encounterSystemEngine";
export type { FogRuntime } from "./fogSystem";
export {
	createFogGrid,
	FOG_EXPLORED,
	FOG_UNEXPLORED,
	FOG_VISIBLE,
	getFogState,
	isTileExplored,
	isTileVisible,
	revealArea,
	runFogSystem,
} from "./fogSystem";
export type { DropTable, DropTableEntry } from "./lootSystem";
export { DROP_TABLES, resetLootRng, rollLootFromTable, runLootSystem } from "./lootSystem";
export { runMovementSystem } from "./movementSystem";
export { runOrderSystem } from "./orderSystem";
export { runProductionSystem } from "./productionSystem";
export type { ResearchDef } from "./researchSystem";
export {
	getResearchDef,
	isResearchCompleted,
	queueResearch,
	runResearchSystem,
} from "./researchSystem";
export {
	awardXp,
	PROMOTION_THRESHOLDS,
	RANK_ELITE,
	RANK_EMBLEMS,
	RANK_HERO,
	RANK_NAMES,
	RANK_RECRUIT,
	RANK_VETERAN,
	rankForXp,
	recordDamageAssist,
	runVeterancySystem,
	veterancyMultiplier,
	XP_CONFIG,
} from "./veterancySystem";

/**
 * Run all game systems in the canonical tick order:
 * 1. Orders (validate/resolve order queues)
 * 2. AI (FSM decisions for enemy entities)
 * 3. Movement
 * 4. Combat (attacks, projectiles, death cleanup)
 * 5. Veterancy (XP awards and promotions from combat events)
 * 6. Loot (resource drops from dead enemies)
 * 7. Economy (gathering, passive income)
 * 8. Production (unit training queues)
 * 9. Building (construction progress)
 * 10. Research (tech progress)
 * 11. Abilities (cooldowns, activations, timed effects)
 * 12. Detection (stealth/cone detection)
 * 13. Encounters (PRNG-driven random spawns)
 * 14. Fog (visibility grid)
 * 15. Floating text cleanup
 * 16. Flush removals
 */
export function runAllSystems(world: GameWorld): void {
	runOrderSystem(world);
	runAiSystem(world);
	runMovementSystem(world);
	runCombatSystem(world);
	runVeterancySystem(world);
	runLootSystem(world);
	runEconomySystem(world);
	runProductionSystem(world);
	runBuildingSystem(world);
	runResearchSystem(world);
	runAbilitySystem(world);
	runDetectionSystem(world);
	runEncounterSystem(world);
	runFogSystem(world);
	tickFloatingTexts(world);
	flushRemovals(world);
}
