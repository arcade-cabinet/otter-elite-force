/**
 * Game Loop — Master system orchestrator.
 *
 * Calls all ECS systems in the correct execution order each frame.
 * This is the backbone of the game tick: GameScene.update() delegates here.
 *
 * Execution order:
 *   1. scenarioSystem   — evaluate win/loss triggers, spawn scripted events
 *   2. orderSystem       — translate player/AI commands into ECS state
 *   3. aiSystem          — enemy FSM decisions
 *   4. movementSystem    — Yuka steering sync, arrival detection
 *   5. combatSystem      — melee damage + ranged projectile spawning
 *      aggroSystem       — auto-acquire nearest enemy within vision
 *      projectileSystem  — move projectiles, apply damage on arrival
 *      deathSystem       — destroy dead entities, clear targeting
 *   6. economySystem     — resource gathering + fish trap passive income
 *   7. productionSystem  — unit training queue progression
 *   8. buildingSystem    — construction progress for incomplete buildings
 *   9. stealthSystem     — detection checks + alert cascade
 *  10. waterSystem       — garrison position sync for raft passengers
 *  11. weatherSystem     — advance weather schedule
 *  12. fogSystem         — update fog of war overlay
 *  13. syncSystem        — sync Koota ECS → Phaser sprites (always last)
 */

import type { World } from "koota";
import type Phaser from "phaser";
import type { ScenarioEngine, ScenarioWorldQuery } from "../scenarios/engine";
import { aiSystem } from "./aiSystem";
import { buildingSystem } from "./buildingSystem";
import { aggroSystem, combatSystem, deathSystem, projectileSystem } from "./combatSystem";
import { economySystem } from "./economySystem";
import type { DayNightSystem } from "./dayNightSystem";
import type { FogOfWarSystem } from "./fogSystem";
import { movementSystem } from "./movementSystem";
import { orderSystem } from "./orderSystem";
import { productionSystem } from "./productionSystem";
import { scenarioSystem } from "./scenarioSystem";
import { alertCascadeSystem, detectionSystem } from "./stealthSystem";
import { syncKootaToPhaser } from "./syncSystem";
import { waterSystem } from "./waterSystem";
import type { WeatherSystem } from "./weatherSystem";

/**
 * Optional subsystems that may not be available on every mission.
 * Pass null/undefined for any system not active in the current scene.
 */
export interface GameLoopContext {
	world: World;
	scene: Phaser.Scene;
	/** Delta time in seconds (Phaser provides ms — caller divides by 1000). */
	delta: number;
	/** Scenario engine for the active mission. Null in skirmish/sandbox. */
	scenarioEngine: ScenarioEngine | null;
	/** Adapter that reads ECS state for the scenario engine. */
	scenarioWorldQuery: ScenarioWorldQuery | null;
	/** Fog of war system instance. Null if fog is disabled. */
	fogSystem: FogOfWarSystem | null;
	/** Weather system instance. Null if weather is disabled. */
	weatherSystem: WeatherSystem | null;
	/** Day/night cycle system instance. Null if disabled. */
	dayNightSystem: DayNightSystem | null;
	/** Current game clock elapsed time in ms (for day/night cycle). */
	elapsedMs: number;
}

/**
 * Tick all game systems in the correct order.
 * Call once per frame from GameScene.update().
 */
export function tickAllSystems(ctx: GameLoopContext): void {
	const { world, scene, delta } = ctx;

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

	// 5. Combat — damage resolution pipeline
	combatSystem(world, delta);
	aggroSystem(world);
	projectileSystem(world, delta);
	deathSystem(world);

	// 6. Economy — resource gathering + passive income
	economySystem(world, delta);

	// 7. Production — unit training queue
	productionSystem(world, delta);

	// 8. Building — construction progress
	buildingSystem(world, delta);

	// 9. Stealth — detection checks + alert propagation
	detectionSystem(world);
	alertCascadeSystem(world);

	// 10. Water — garrison position sync
	waterSystem(world);

	// 11. Weather — advance schedule
	if (ctx.weatherSystem) {
		ctx.weatherSystem.updateSchedule(delta);
	}

	// 12. Day/Night — update cycle overlay and vision multiplier
	if (ctx.dayNightSystem) {
		ctx.dayNightSystem.update(ctx.elapsedMs);
	}

	// 13. Fog of War — update visibility overlay
	if (ctx.fogSystem) {
		ctx.fogSystem.update();
	}

	// 14. Sync — Koota ECS → Phaser sprites (always last)
	syncKootaToPhaser(world, scene);
}
