/**
 * Game Loop — Master system orchestrator.
 *
 * Calls all ECS systems in the correct execution order each frame.
 * This is the backbone of the game tick: GameScene.update() delegates here.
 *
 * Execution order:
 *   1. scenarioSystem     — evaluate win/loss triggers, spawn scripted events
 *   2. orderSystem         — translate player/AI commands into ECS state
 *   3. aiSystem            — enemy FSM decisions
 *   4. movementSystem      — Yuka steering sync, arrival detection
 *  4b. convoySystem        — scripted waypoint movement + enemy detection
 *   5. combatSystem        — melee damage + ranged projectile spawning
 *  5b. siegeCombatSystem   — bonus damage vs buildings (Sapper, Sgt. Fang)
 *      aoeSplashSystem     — AoE splash for mortar projectiles
 *  5c. chargeTickSystem    — demolition charge countdowns + explosions
 *  5d. bossSystem          — phase transitions, AoE ground-pound, minion summons
 *      aggroSystem         — auto-acquire nearest enemy within vision
 *      projectileSystem    — move projectiles, apply damage on arrival
 *      deathSystem         — destroy dead entities, clear targeting
 *  5e. cleanupAIRunners   — remove stale FSM runners for dead entities
 *   6. economySystem       — resource gathering + fish trap passive income
 *   7. productionSystem    — unit training queue progression
 *  7b. researchSystem      — armory research progress
 *   8. buildingSystem      — construction progress for incomplete buildings
 *   9. stealthSystem       — detection checks + alert cascade
 *  9b. coneDetectionSystem — directional cone detection + suspicion ramp + alarm
 *  10. waterSystem         — garrison position sync for raft passengers
 *  11. weatherSystem       — advance weather schedule
 * 11b. tidalSystem         — advance tidal cycle, convert terrain on phase change
 * 11c. fireSystem          — fire damage, spread, and scorching
 *  12. fogSystem           — update fog of war overlay
 *
 * Rendering is handled by the React/canvas layer.
 */

import type { World } from "koota";
import { CompletedResearch } from "../ecs/traits/state";
import type { ScenarioEngine, ScenarioWorldQuery } from "../scenarios/engine";
import { aiSystem, cleanupAIRunners } from "./aiSystem";
import { buildingSystem } from "./buildingSystem";
import { bossSystem } from "./bossSystem";
import { aggroSystem, combatSystem, deathSystem, projectileSystem } from "./combatSystem";

import { convoySystem } from "./convoySystem";
import { chargeTickSystem } from "./demolitionSystem";
import { economySystem } from "./economySystem";
import type { FogOfWarSystem } from "./fogSystem";
import { movementSystem } from "./movementSystem";
import { orderSystem } from "./orderSystem";
import { productionSystem } from "./productionSystem";
import { researchSystem } from "./researchSystem";
import { scenarioSystem } from "./scenarioSystem";
import { aoeSplashSystem, siegeCombatSystem } from "./siegeSystem";
import { coneDetectionSystem } from "./detectionSystem";
import { alertCascadeSystem, detectionSystem } from "./stealthSystem";
import { fireSystem } from "./fireSystem";
import { tidalSystem } from "./tidalSystem";
import { waterSystem } from "./waterSystem";
import type { WeatherSystem } from "./weatherSystem";

/**
 * Optional subsystems that may not be available on every mission.
 * Pass null/undefined for any system not active in the current scene.
 */
export interface GameLoopContext {
	world: World;
	/** Delta time in seconds. */
	delta: number;
	/** Canvas/viewport width in pixels. */
	width: number;
	/** Canvas/viewport height in pixels. */
	height: number;
	/** Scenario engine for the active mission. Null in skirmish/sandbox. */
	scenarioEngine: ScenarioEngine | null;
	/** Adapter that reads ECS state for the scenario engine. */
	scenarioWorldQuery: ScenarioWorldQuery | null;
	/** Fog of war system instance. Null if fog is disabled. */
	fogSystem: FogOfWarSystem | null;
	/** Weather system instance. Null if weather is disabled. */
	weatherSystem: WeatherSystem | null;
	/** Current game clock elapsed time in ms (for day/night cycle). */
	elapsedMs: number;
	/** Mutable terrain grid for environmental systems (tidal, fire). Null if not available. */
	terrainGrid: import("../ai/terrainTypes").TerrainType[][] | null;
}

/**
 * Tick all game systems in the correct order.
 * Call once per frame from GameScene.update().
 */
export function tickAllSystems(ctx: GameLoopContext): void {
	const { world, delta } = ctx;

	// 1. Scenario — evaluate triggers, check win/loss conditions
	if (ctx.scenarioEngine && ctx.scenarioWorldQuery) {
		scenarioSystem(ctx.scenarioEngine, ctx.scenarioWorldQuery);
	}

	// 2. Orders — translate queued commands into ECS state
	orderSystem(world, delta);

	// 3. AI — enemy FSM decisions
	aiSystem(world, delta);

	// 4. Movement — Yuka steering sync + arrival detection
	movementSystem(world, delta);

	// 4b. Convoy — scripted waypoint movement + enemy detection
	convoySystem(world, delta);

	// 5. Combat — damage resolution pipeline
	combatSystem(world, delta);

	// 5b. Siege — bonus damage vs buildings + AoE splash
	const completedResearch = world.get(CompletedResearch)?.ids ?? new Set<string>();
	siegeCombatSystem(world, delta, completedResearch);
	aoeSplashSystem(world);

	// 5c. Demolition — timed charge countdowns + explosions
	chargeTickSystem(world, delta);

	// 5d. Boss — phase transitions, AoE ground-pound, minion summons
	bossSystem(world, delta);

	aggroSystem(world, ctx.fogSystem);
	projectileSystem(world, delta);
	deathSystem(world);

	// 5e. AI cleanup — remove stale FSM runners for dead entities
	cleanupAIRunners(world);

	// 6. Economy — resource gathering + passive income
	economySystem(world, delta);

	// 7. Production — unit training queue
	productionSystem(world, delta);

	// 7b. Research — armory research progress
	researchSystem(world, delta);

	// 8. Building — construction progress
	buildingSystem(world, delta);

	// 9. Stealth — detection checks + alert propagation
	detectionSystem(world);
	alertCascadeSystem(world);

	// 9b. Cone detection — directional suspicion ramp + alarm trigger
	coneDetectionSystem(world, delta);

	// 10. Water — garrison position sync
	waterSystem(world);

	// 11. Weather — advance schedule
	if (ctx.weatherSystem) {
		ctx.weatherSystem.updateSchedule(delta);
	}

	// 11b. Tidal — advance cycle, convert terrain on phase transitions
	tidalSystem(world, delta, ctx.terrainGrid);

	// 11c. Fire — damage, spread, and scorch terrain
	fireSystem(world, delta, ctx.elapsedMs / 1000, ctx.terrainGrid);

	// 12. (Day/Night removed — bright battlefield, fog handles visibility)

	// 13. Fog of War — update visibility overlay
	if (ctx.fogSystem) {
		ctx.fogSystem.update();
	}

}
