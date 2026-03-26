/**
 * Governor Playtest — parameterized mission runner with diagnostic captures.
 *
 * Runs the game loop + scenario engine for any mission (or all 16).
 * Captures snapshots every 60s of simulated time.
 * Runs until victory, defeat, or timeout (3x par time).
 *
 * Configuration via environment variables:
 *   MISSION=1        — run only mission 1
 *   MISSION=all      — run all 16 missions sequentially
 *   MISSION=5-8      — run missions 5 through 8
 *   (default: mission 1)
 *
 * Run with: pnpm test:browser
 *   or: MISSION=all pnpm test:browser
 *   or: MISSION=5 pnpm test:browser
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createWorld, type World } from "koota";
import { initSingletons, resetSessionState } from "../../ecs/singletons";
import {
	CampaignProgress, CurrentMission, GamePhase,
	Objectives, PopulationState, ResourcePool,
} from "../../ecs/traits/state";
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
import type { MissionDef, Placement } from "../../entities/types";

// ─── Config ───

const MISSION_ENV = (typeof process !== "undefined" ? process.env?.MISSION : undefined) ?? "1";
const FPS = 60;
const SNAPSHOT_INTERVAL_SEC = 60;

function parseMissionRange(env: string): number[] {
	if (env === "all") return Array.from({ length: 16 }, (_, i) => i + 1);
	if (env.includes("-")) {
		const [a, b] = env.split("-").map(Number);
		return Array.from({ length: b - a + 1 }, (_, i) => a + i);
	}
	return [Number(env) || 1];
}

const MISSIONS_TO_RUN = parseMissionRange(MISSION_ENV);

// ─── Snapshot type ───

interface Snapshot {
	elapsedSec: number;
	resources: { fish: number; timber: number; salvage: number };
	population: { current: number; max: number };
	uraUnits: Record<string, number>;
	sgUnits: Record<string, number>;
	uraBuildings: Record<string, number>;
	objectivesCompleted: string[];
	triggersFired: string[];
	totalEntities: number;
}

// ─── Helpers ───

function countByType(world: World, faction: string, building: boolean): Record<string, number> {
	const counts: Record<string, number> = {};
	for (const e of world.query(Faction, UnitType)) {
		if (e.get(Faction)?.id !== faction) continue;
		const isBldg = e.has(IsBuilding);
		if (building !== isBldg) continue;
		const type = e.get(UnitType)?.type ?? "unknown";
		counts[type] = (counts[type] ?? 0) + 1;
	}
	return counts;
}

function takeSnapshot(world: World, sec: number, objDone: string[], triggers: string[]): Snapshot {
	const res = world.get(ResourcePool) ?? { fish: 0, timber: 0, salvage: 0 };
	const pop = world.get(PopulationState) ?? { current: 0, max: 0 };
	return {
		elapsedSec: sec,
		resources: { fish: res.fish, timber: res.timber, salvage: res.salvage },
		population: { current: pop.current, max: pop.max },
		uraUnits: countByType(world, "ura", false),
		sgUnits: countByType(world, "scale_guard", false),
		uraBuildings: countByType(world, "ura", true),
		objectivesCompleted: [...objDone],
		triggersFired: [...triggers],
		totalEntities: world.query(Position).length,
	};
}

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
	};
}

// ─── Run a single mission ───

function runMission(missionNum: number): {
	result: "victory" | "defeat" | "timeout";
	snapshots: Snapshot[];
	diagnostics: Record<string, unknown>;
} {
	const world = createWorld();
	initSingletons(world);
	world.set(CampaignProgress, { missions: {}, currentMission: `mission_${missionNum}`, difficulty: "tactical" });

	const mission = getMissionById(`mission_${missionNum}`);
	if (!mission) return { result: "timeout", snapshots: [], diagnostics: { error: `Mission ${missionNum} not found` } };

	initMission(world, mission);

	const scenario = compileMissionScenario(mission);
	const objDone: string[] = [];
	const triggers: string[] = [];
	let result: "victory" | "defeat" | "timeout" = "timeout";

	const engine = new ScenarioEngine(scenario, (action) => {
		if (action.type === "victory") result = "victory";
		if (action.type === "failMission") result = "defeat";
	});
	engine.on((event) => {
		if (event.type === "triggerFired") triggers.push(event.triggerId);
		if (event.type === "objectiveCompleted") objDone.push(event.objectiveId);
		if (event.type === "allObjectivesCompleted") result = "victory";
		if (event.type === "missionFailed") result = "defeat";
	});

	world.set(Objectives, {
		list: scenario.objectives.map((o) => ({
			id: o.id, description: o.description, status: o.status, bonus: o.type === "bonus",
		})),
	});

	const wq = createWorldQuery(world);
	const ctx: GameLoopContext = {
		world, delta: 1 / FPS, width: 800, height: 600,
		scenarioEngine: engine, scenarioWorldQuery: wq,
		fogSystem: null, weatherSystem: null, elapsedMs: 0,
	};

	const maxSec = (mission.parTime ?? 480) * 3; // 3x par time timeout
	const maxFrames = maxSec * FPS;
	const snapInterval = SNAPSHOT_INTERVAL_SEC * FPS;
	const snapshots: Snapshot[] = [];

	for (let frame = 0; frame < maxFrames; frame++) {
		ctx.delta = 1 / FPS;
		ctx.elapsedMs = frame * (1000 / FPS);
		wq.elapsedTime = ctx.elapsedMs / 1000;

		tickAllSystems(ctx);

		if (frame > 0 && frame % snapInterval === 0) {
			snapshots.push(takeSnapshot(world, Math.round(frame / FPS), objDone, triggers));
		}

		if (result !== "timeout") break;
	}

	const finalSnap = takeSnapshot(world, Math.round(ctx.elapsedMs / 1000), objDone, triggers);
	snapshots.push(finalSnap);

	world.reset();

	return {
		result,
		snapshots,
		diagnostics: {
			mission: mission.id,
			name: mission.name,
			parTimeSec: mission.parTime,
			maxTimeSec: maxSec,
			result,
			elapsedSec: finalSnap.elapsedSec,
			finalResources: finalSnap.resources,
			finalPop: finalSnap.population,
			objectivesCompleted: objDone,
			triggersFired: triggers.length,
			snapshotCount: snapshots.length,
		},
	};
}

// ─── Test suite ───

describe("Governor Playtest", () => {
	beforeEach(() => { initSprites(); });

	for (const mNum of MISSIONS_TO_RUN) {
		it(`Mission ${mNum} runs without crashing`, () => {
			console.log(`\n=== MISSION ${mNum} ===`);

			const { result, snapshots, diagnostics } = runMission(mNum);

			console.log(`Result: ${result}`);
			console.log(`Elapsed: ${diagnostics.elapsedSec}s (par: ${diagnostics.parTimeSec}s)`);
			console.log(`Triggers fired: ${diagnostics.triggersFired}`);
			console.log(`Objectives: ${(diagnostics.objectivesCompleted as string[]).join(", ") || "none"}`);

			for (const snap of snapshots) {
				console.log(`  [${snap.elapsedSec}s] F:${snap.resources.fish} T:${snap.resources.timber} S:${snap.resources.salvage} Pop:${snap.population.current}/${snap.population.max} Entities:${snap.totalEntities}`);
			}

			console.log(`\nDIAGNOSTIC: ${JSON.stringify(diagnostics)}`);

			// Game should not crash
			const final = snapshots[snapshots.length - 1];
			expect(final).toBeDefined();
			expect(final.totalEntities).toBeGreaterThan(0);
			expect(final.resources.fish).toBeGreaterThanOrEqual(0);
			expect(final.resources.timber).toBeGreaterThanOrEqual(0);
		});
	}
});
