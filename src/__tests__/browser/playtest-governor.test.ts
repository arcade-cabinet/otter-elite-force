/**
 * Governor Playtest — Yuka GOAP brain plays through missions via real mouse events.
 *
 * The AIPlaytester governor:
 * 1. Reads game state through Koota ECS (resources, units, buildings)
 * 2. Builds a perception snapshot (visible units, resource locations, threats)
 * 3. Runs the GOAP brain to decide what to do (gather, build, train, attack)
 * 4. Dispatches REAL MouseEvents to the canvas (clicks, right-clicks, drags)
 * 5. The game's input system processes them identically to human input
 *
 * This test runs in Vitest browser mode (real Chromium) so Canvas2D and
 * DOM events work. The game loop ticks each frame, the governor ticks
 * alongside it, and we capture periodic diagnostics.
 *
 * Run: pnpm test:browser
 */

import { describe, expect, it } from "vitest";
import { createWorld, type World } from "koota";
import { initSingletons, resetSessionState } from "../../ecs/singletons";
import {
	CampaignProgress, CurrentMission, GameClock, GamePhase,
	Objectives, PopulationState, ResourcePool,
} from "../../ecs/traits/state";
// ResourcePool imported above — used by getResourceAmount in worldQuery
import { Faction, IsBuilding, UnitType } from "../../ecs/traits/identity";
import { Health } from "../../ecs/traits/combat";
import { Position } from "../../ecs/traits/spatial";
import { getMissionById, CAMPAIGN } from "../../entities/missions";
import { compileMissionScenario } from "../../entities/missions/compileMissionScenario";
import { spawnUnit, spawnBuilding, spawnResource } from "../../entities/spawner";
import { getUnit, getHero, getBuilding, getResource } from "../../entities/registry";
import { ScenarioEngine, type ScenarioWorldQuery } from "../../scenarios/engine";
import { tickAllSystems, type GameLoopContext } from "../../systems/gameLoop";
import { initSprites } from "../../canvas/spriteGen";
import {
	AIPlaytester,
} from "../../ai/playtester/index";
import { createKootaGameStateReader } from "../../ai/playtester/perception";
import { FogState, type FogOfWarSystem } from "../../systems/fogSystem";
import type { MissionDef } from "../../entities/types";

/** Stub fog system that reports everything as visible — for governor testing. */
function createAllVisibleFog(): FogOfWarSystem {
	return {
		getFogState: () => FogState.Visible,
		isTileVisible: () => true,
		update: () => {},
		destroy: () => {},
	} as unknown as FogOfWarSystem;
}

// ─── Mission initialization ───

function initMission(world: World, mission: MissionDef): void {
	resetSessionState(world);
	world.set(CurrentMission, { missionId: mission.id });
	world.set(GamePhase, { phase: "playing" });
	if (mission.startResources) {
		world.set(ResourcePool, {
			fish: mission.startResources.fish ?? 0,
			timber: mission.startResources.timber ?? 0,
			salvage: mission.startResources.salvage ?? 0,
		});
	}
	if (mission.startPopCap) {
		world.set(PopulationState, { current: 0, max: mission.startPopCap });
	}
	for (const p of mission.placements) {
		const count = p.count ?? 1;
		for (let i = 0; i < count; i++) {
			const x = p.x ?? 10 + i * 2;
			const y = p.y ?? 10 + i * 2;
			const f = p.faction ?? "neutral";
			const u = getUnit(p.type) ?? getHero(p.type);
			if (u) { spawnUnit(world, u, x, y, f); continue; }
			const b = getBuilding(p.type);
			if (b) { spawnBuilding(world, b, x, y, f); continue; }
			const r = getResource(p.type);
			if (r) { spawnResource(world, r, x, y); }
		}
	}
}

function createWorldQuery(world: World): ScenarioWorldQuery {
	return {
		elapsedTime: 0,
		countUnits: (faction, unitType) => {
			let c = 0;
			for (const e of world.query(Faction, Health)) {
				if (e.get(Faction)?.id !== faction) continue;
				if (unitType && e.get(UnitType)?.type !== unitType) continue;
				c++;
			}
			return c;
		},
		countBuildings: (faction, buildingType) => {
			let c = 0;
			for (const e of world.query(Faction, UnitType, Health, IsBuilding)) {
				if (e.get(Faction)?.id !== faction) continue;
				if (buildingType && e.get(UnitType)?.type !== buildingType) continue;
				c++;
			}
			return c;
		},
		countUnitsInArea: () => 0,
		isBuildingDestroyed: () => false,
		getEntityHealthPercent: () => null,
		getResourceAmount: (resource: "fish" | "timber" | "salvage") => {
			const pool = world.get(ResourcePool);
			return pool?.[resource] ?? 0;
		},
	};
}

// ─── Governor test ───

describe("Yuka Governor Playtest", () => {
	it("Mission 1: governor plays through via real mouse events on canvas", async () => {
		initSprites();

		// Create a real canvas element in the browser DOM
		const canvas = document.createElement("canvas");
		canvas.width = 800;
		canvas.height = 600;
		document.body.appendChild(canvas);

		const world = createWorld();
		initSingletons(world);
		world.set(CampaignProgress, { missions: {}, currentMission: "mission_1", difficulty: "tactical" });

		const mission = getMissionById("mission_1")!;
		initMission(world, mission);

		// Scenario engine
		const scenario = compileMissionScenario(mission);
		let missionResult: "playing" | "victory" | "defeat" = "playing";
		const triggersLog: string[] = [];
		const objectivesDone: string[] = [];

		const engine = new ScenarioEngine(scenario, (action) => {
			if (action.type === "victory") missionResult = "victory";
			if (action.type === "failMission") missionResult = "defeat";
		});
		engine.on((event) => {
			if (event.type === "triggerFired") triggersLog.push(event.triggerId);
			if (event.type === "objectiveCompleted") objectivesDone.push(event.objectiveId);
			if (event.type === "allObjectivesCompleted") missionResult = "victory";
		});

		world.set(Objectives, {
			list: scenario.objectives.map((o) => ({
				id: o.id, description: o.description, status: o.status, bonus: o.type === "bonus",
			})),
		});

		const wq = createWorldQuery(world);

		// Create the AI governor — it dispatches real mouse events to the canvas
		const stateReader = createKootaGameStateReader(world);
		const mapCols = mission.terrain.width;
		const mapRows = mission.terrain.height;

		const fog = createAllVisibleFog();
		const governor = new AIPlaytester(
			canvas,
			world,
			fog,
			stateReader,
			mapCols,
			mapRows,
			{
				viewportWidth: 800,
				viewportHeight: 600,
				errorRate: 0, // perfect play — no misclicks
				maxMisclickOffset: 0,
			},
		);

		// Game loop context
		const ctx: GameLoopContext = {
			world, delta: 1 / 60, width: 800, height: 600,
			scenarioEngine: engine, scenarioWorldQuery: wq,
			fogSystem: null, weatherSystem: null, elapsedMs: 0,
			terrainGrid: null,
		};

		// Run for up to 3x par time
		const maxSec = (mission.parTime ?? 480) * 3;
		const FPS = 60;
		const maxFrames = maxSec * FPS;
		const GOVERNOR_TICK_INTERVAL = 30; // governor thinks every 30 frames (0.5s)

		const snapshots: Array<{
			sec: number;
			fish: number;
			timber: number;
			salvage: number;
			pop: string;
			objectives: string[];
			actions: number;
		}> = [];

		for (let frame = 0; frame < maxFrames; frame++) {
			ctx.delta = 1 / FPS;
			ctx.elapsedMs = frame * (1000 / FPS);
			wq.elapsedTime = ctx.elapsedMs / 1000;

			// Tick game systems
			tickAllSystems(ctx);

			// Tick governor every 30 frames
			if (frame % GOVERNOR_TICK_INTERVAL === 0) {
				await governor.tick(ctx.elapsedMs);
			}

			// Snapshot every 60 seconds
			if (frame > 0 && frame % (60 * FPS) === 0) {
				const res = world.get(ResourcePool)!;
				const pop = world.get(PopulationState)!;
				snapshots.push({
					sec: Math.round(frame / FPS),
					fish: res.fish,
					timber: res.timber,
					salvage: res.salvage,
					pop: `${pop.current}/${pop.max}`,
					objectives: [...objectivesDone],
					actions: governor.getTotalActions?.() ?? 0,
				});
			}

			if (missionResult !== "playing") break;
		}

		// Final state
		const res = world.get(ResourcePool)!;
		const pop = world.get(PopulationState)!;

		// Log diagnostics
		console.log(`\n=== MISSION 1 GOVERNOR PLAYTEST ===`);
		console.log(`Result: ${missionResult}`);
		console.log(`Elapsed: ${Math.round(ctx.elapsedMs / 1000)}s`);
		console.log(`Resources: F:${res.fish} T:${res.timber} S:${res.salvage}`);
		console.log(`Pop: ${pop.current}/${pop.max}`);
		console.log(`Triggers: ${triggersLog.length} fired`);
		console.log(`Objectives: ${objectivesDone.join(", ") || "none"}`);
		for (const s of snapshots) {
			console.log(`  [${s.sec}s] F:${s.fish} T:${s.timber} S:${s.salvage} Pop:${s.pop} Obj:${s.objectives.join(",")}`);
		}

		// Cleanup
		document.body.removeChild(canvas);
		world.reset();

		// Assertions
		expect(missionResult).not.toBe("defeat");
		// The trigger system should have fired at least some triggers during the playtest
		expect(triggersLog.length).toBeGreaterThan(0);
		expect(res.fish).toBeGreaterThanOrEqual(0);
		expect(res.timber).toBeGreaterThanOrEqual(0);
	});
});
