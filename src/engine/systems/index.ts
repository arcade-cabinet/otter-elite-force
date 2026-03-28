/**
 * System barrel -- exports all systems and the runAllSystems orchestrator.
 */

import type { GameWorld } from "@/engine/world/gameWorld";
import { flushRemovals, tickFloatingTexts } from "@/engine/world/gameWorld";
import { runAbilitySystem } from "./abilitySystem";
import { runAiSystem } from "./aiSystem";
import { runBossSystem } from "./bossSystem";
import { runBuildingSystem } from "./buildingSystem";
import { runCombatSystem } from "./combatSystem";
import { runConvoySystem } from "./convoySystem";
import { runDemolitionSystem } from "./demolitionSystem";
import { runDetectionSystem } from "./detectionSystem";
import { runDifficultyScalingSystem } from "./difficultyScalingSystem";
import { runEconomySystem } from "./economySystem";
import { runEncounterSystem } from "./encounterSystemEngine";
import { runFireSystem } from "./fireSystem";
import { runFogSystem } from "./fogSystem";
import { runLootSystem } from "./lootSystem";
import { runMovementSystem } from "./movementSystem";
import { runMultiBaseSystem } from "./multiBaseSystem";
import { runOrderSystem } from "./orderSystem";
import { runProductionSystem } from "./productionSystem";
import { runResearchSystem } from "./researchSystem";
import { runSiegeSystem } from "./siegeSystem";
import { runSiphonSystem } from "./siphonSystem";
import { runStealthSystem } from "./stealthSystem";
import { runTerritorySystem } from "./territorySystem";
import { runTidalSystem } from "./tidalSystem";
import { runVeterancySystem } from "./veterancySystem";
import { runWaterSystem } from "./waterSystem";
import { runWaveSpawnerSystem } from "./waveSpawnerSystem";
import { runWeatherSystem } from "./weatherSystem";

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
export type { ActiveFire, FireRuntime } from "./fireSystem";
export { igniteFireAt, resetFireState, runFireSystem } from "./fireSystem";
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
export type {
	CaravanCargo,
	CaravanEntry,
	CommandPostLocation,
	CPRadiusEntry,
	MultiBaseRuntime,
} from "./multiBaseSystem";
export {
	canPlaceSecondaryCP,
	createSupplyCaravan,
	findNearestCPGlobal,
	findNearestCPInRadius,
	getCaravanCargo,
	registerCommandPost,
	resetMultiBaseState,
	runMultiBaseSystem,
} from "./multiBaseSystem";
export { runOrderSystem } from "./orderSystem";
export { runProductionSystem } from "./productionSystem";
export type { ResearchDef } from "./researchSystem";
export {
	getResearchDef,
	isResearchCompleted,
	queueResearch,
	runResearchSystem,
} from "./researchSystem";
export type { TerritoryRuntime, VillageEntry } from "./territorySystem";
export {
	FOG_REVEAL_RADIUS,
	registerVillage,
	resetTerritoryState,
	runTerritorySystem,
} from "./territorySystem";
export type { TidalPhase, TidalRuntime, TidalZoneRect } from "./tidalSystem";
export {
	phaseAtTime,
	resetTidalState,
	runTidalSystem,
} from "./tidalSystem";
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
export { runBossSystem } from "./bossSystem";
export { runConvoySystem } from "./convoySystem";
export { runDemolitionSystem } from "./demolitionSystem";
export { runDifficultyScalingSystem } from "./difficultyScalingSystem";
export { runSiegeSystem } from "./siegeSystem";
export { runSiphonSystem } from "./siphonSystem";
export { runStealthSystem } from "./stealthSystem";
export { runWaterSystem } from "./waterSystem";
export { runWaveSpawnerSystem } from "./waveSpawnerSystem";
export { runWeatherSystem } from "./weatherSystem";

/**
 * Run all game systems in the canonical tick order:
 * 1.  Orders (validate/resolve order queues)
 * 2.  AI (FSM decisions for enemy entities)
 * 3.  Movement
 * 4.  Combat (attacks, projectiles, death cleanup)
 * 5.  Veterancy (XP awards and promotions from combat events)
 * 6.  Loot (resource drops from dead enemies)
 * 7.  Economy (gathering, passive income)
 * 8.  Production (unit training queues)
 * 9.  Building (construction progress)
 * 10. Research (tech progress)
 * 11. Abilities (cooldowns, activations, timed effects)
 * 12. Detection (stealth/cone detection)
 * 13. Stealth (cloak timers, reveal on attack)
 * 14. Encounters (PRNG-driven random spawns)
 * 15. Territory (village liberation, zone control)
 * 16. Multi-base (caravans, base loss detection)
 * 17. Convoy (escort waypoints, convoy movement)
 * 18. Water (naval movement, depth, amphibious)
 * 19. Weather (rain/monsoon progression, stat modifiers)
 * 20. WaveSpawner (timed enemy waves)
 * 21. Boss (phase transitions, boss abilities)
 * 22. Siphon (destructible siphons, toxic terrain)
 * 23. Demolition (breach charges, explosives)
 * 24. Siege (multi-section mega-structure attacks)
 * 25. Tidal (terrain phase transitions)
 * 26. Fire (spread, damage, scorch)
 * 27. Difficulty scaling (adaptive enemy strength)
 * 28. Fog (visibility grid)
 * 29. Floating text cleanup
 * 30. Flush removals
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
	runStealthSystem(world);
	runEncounterSystem(world);
	runTerritorySystem(world);
	runMultiBaseSystem(world);
	runConvoySystem(world);
	runWaterSystem(world);
	runWeatherSystem(world);
	runWaveSpawnerSystem(world);
	runBossSystem(world);
	runSiphonSystem(world);
	runDemolitionSystem(world);
	runSiegeSystem(world);
	runTidalSystem(world);
	runFireSystem(world);
	runDifficultyScalingSystem(world);
	runFogSystem(world);
	tickFloatingTexts(world);
	flushRemovals(world);
}
