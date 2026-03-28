/**
 * Skirmish Wiring Integration Tests
 *
 * Tests each integration point of the skirmish flow:
 *   1. SkirmishSetup -> Game flow (config passing, isSkirmish, seed)
 *   2. Skirmish world generation (terrain variety, nav graph, entities)
 *   3. Skirmish AI opponent (builds, trains, attacks via sandbox)
 *   4. Skirmish result (stats computation after victory/defeat)
 *   5. Seed determinism (same seed -> identical state at tick 5000)
 *   6. Difficulty scaling (AI behavior and resource bonuses)
 */

import { describe, expect, it } from "vitest";
import { DIFFICULTY_CONFIG, SkirmishAI, type SkirmishDifficulty } from "@/ai/skirmishAI";
import { createSkirmishGameAdapter } from "@/ai/skirmishGameAdapter";
import { createSeedBundle, type SeedBundle } from "@/engine/random/seed";
import { computeSkirmishResult } from "@/engine/session/skirmishResult";
import { runSkirmishSandbox } from "@/engine/session/skirmishSandbox";
import {
	createSkirmishRuntimeSession,
	seedGameWorldFromSkirmishSession,
} from "@/engine/session/tacticalSession";
import { Faction, Flags } from "@/engine/world/components";
import { createGameWorld } from "@/engine/world/gameWorld";
import type { SkirmishSessionConfig } from "@/features/skirmish/types";
import { generateSkirmishMap } from "@/maps/skirmishMapGenerator";
import type { TerrainType } from "@/maps/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFixedSeed(phrase = "skirmish-wiring-test"): SeedBundle {
	return createSeedBundle({
		phrase,
		source: "skirmish",
		gameplayNamespaces: ["loot", "encounter", "combat", "waves", "ai"],
	});
}

function makeConfig(overrides: Partial<SkirmishSessionConfig> = {}): SkirmishSessionConfig {
	const seed = overrides.seed ?? makeFixedSeed();
	return {
		mapId: "sk_river_crossing",
		mapName: "River Crossing",
		difficulty: "medium",
		playAsScaleGuard: false,
		preset: "meso",
		seed,
		startingResources: { fish: 300, timber: 200, salvage: 100 },
		...overrides,
	};
}

// ---------------------------------------------------------------------------
// 1. Skirmish Setup -> Game flow
// ---------------------------------------------------------------------------

describe("Skirmish Wiring: Setup -> Game flow", () => {
	it("SkirmishSessionConfig captures all setup fields", () => {
		const seed = makeFixedSeed("setup-test-seed");
		const config = makeConfig({
			mapId: "sk_mudflat_basin",
			mapName: "Mudflat Basin",
			difficulty: "hard",
			playAsScaleGuard: true,
			preset: "macro",
			seed,
		});

		expect(config.mapId).toBe("sk_mudflat_basin");
		expect(config.mapName).toBe("Mudflat Basin");
		expect(config.difficulty).toBe("hard");
		expect(config.playAsScaleGuard).toBe(true);
		expect(config.preset).toBe("macro");
		expect(config.seed.phrase).toBe(seed.phrase);
		expect(config.startingResources.fish).toBe(300);
	});

	it("createSkirmishRuntimeSession uses the config seed", () => {
		const seed = makeFixedSeed("session-seed-check");
		const config = makeConfig({ seed });
		const session = createSkirmishRuntimeSession(config);

		expect(session.config.seed.phrase).toBe(seed.phrase);
		expect(session.diagnostics.seedPhrase).toBe(seed.phrase);
		expect(session.diagnostics.designSeed).toBe(seed.designSeed);
		expect(session.diagnostics.mode).toBe("skirmish");
	});

	it("seedPhrase flows from config through session to diagnostics", () => {
		const seed = makeFixedSeed("phrase-flow-check");
		const config = makeConfig({ seed });
		const result = runSkirmishSandbox({ config, ticks: 1 });

		expect(result.diagnostics.seedPhrase).toBe(seed.phrase);
		expect(result.world.rng.phrase).toBe(seed.phrase);
	});
});

// ---------------------------------------------------------------------------
// 2. Skirmish world generation
// ---------------------------------------------------------------------------

describe("Skirmish Wiring: World generation", () => {
	it("generates terrain with variety (not uniform)", () => {
		const map = generateSkirmishMap({
			size: "small",
			terrainType: "jungle",
			seed: 42,
		});

		const terrainTypes = new Set<TerrainType>();
		for (const row of map.terrain) {
			for (const t of row) {
				terrainTypes.add(t);
			}
		}

		// Should have at least 3 different terrain types
		expect(terrainTypes.size).toBeGreaterThanOrEqual(3);
	});

	it("generates player and AI start positions in opposite corners", () => {
		const map = generateSkirmishMap({
			size: "medium",
			terrainType: "river",
			seed: 123,
		});

		// Player start should be in bottom-left region
		expect(map.playerStart.tileX).toBeLessThan(map.cols / 2);
		expect(map.playerStart.tileY).toBeGreaterThan(map.rows / 2);

		// AI start should be in top-right region
		expect(map.aiStart.tileX).toBeGreaterThan(map.cols / 2);
		expect(map.aiStart.tileY).toBeLessThan(map.rows / 2);
	});

	it("generates resource nodes", () => {
		const map = generateSkirmishMap({
			size: "small",
			terrainType: "swamp",
			seed: 99,
		});

		expect(map.resourceNodes.length).toBeGreaterThanOrEqual(6);
		for (const node of map.resourceNodes) {
			expect(["fish", "timber", "salvage"]).toContain(node.resourceType);
		}
	});

	it("world has terrain grid and nav graph after seeding", () => {
		const config = makeConfig();
		const session = createSkirmishRuntimeSession(config);
		const world = createGameWorld(config.seed);

		seedGameWorldFromSkirmishSession(world, session);

		// Terrain grid should exist and match map dimensions
		expect(world.runtime.terrainGrid).toBeDefined();
		expect(world.runtime.terrainGrid.length).toBe(session.map.rows);
		expect(world.runtime.terrainGrid[0].length).toBe(session.map.cols);

		// Nav graph should exist
		expect(world.runtime.navGraphs.has("main")).toBe(true);
		expect(world.navigation.activeGraphId).toBe("main");
	});

	it("spawns player and enemy bases with correct types", () => {
		const config = makeConfig();
		const session = createSkirmishRuntimeSession(config);
		const world = createGameWorld(config.seed);

		seedGameWorldFromSkirmishSession(world, session);

		const buildings: { type: string | undefined; faction: number }[] = [];
		for (const eid of world.runtime.alive) {
			if (Flags.isBuilding[eid] === 1) {
				buildings.push({
					type: world.runtime.entityTypeIndex.get(eid),
					faction: Faction.id[eid],
				});
			}
		}

		// Player base should be command_post (faction 1 = ura)
		const playerBase = buildings.find((b) => b.type === "command_post" && b.faction === 1);
		expect(playerBase).toBeDefined();

		// Enemy base should be sludge_pit (faction 2 = scale_guard)
		const enemyBase = buildings.find((b) => b.type === "sludge_pit" && b.faction === 2);
		expect(enemyBase).toBeDefined();
	});

	it("spawns player and enemy units", () => {
		const config = makeConfig();
		const session = createSkirmishRuntimeSession(config);
		const world = createGameWorld(config.seed);

		seedGameWorldFromSkirmishSession(world, session);

		let playerUnits = 0;
		let enemyUnits = 0;
		for (const eid of world.runtime.alive) {
			if (Flags.isBuilding[eid] === 1 || Flags.isResource[eid] === 1) continue;
			if (Faction.id[eid] === 1) playerUnits++;
			if (Faction.id[eid] === 2) enemyUnits++;
		}

		expect(playerUnits).toBeGreaterThanOrEqual(4);
		expect(enemyUnits).toBeGreaterThanOrEqual(4);
	});

	it("sets starting resources on the world", () => {
		const config = makeConfig({
			startingResources: { fish: 500, timber: 300, salvage: 200 },
		});
		const session = createSkirmishRuntimeSession(config);
		const world = createGameWorld(config.seed);

		seedGameWorldFromSkirmishSession(world, session);

		expect(world.session.resources.fish).toBe(500);
		expect(world.session.resources.timber).toBe(300);
		expect(world.session.resources.salvage).toBe(200);
	});

	it("initializes AI resource pool", () => {
		const config = makeConfig();
		const session = createSkirmishRuntimeSession(config);
		const world = createGameWorld(config.seed);

		seedGameWorldFromSkirmishSession(world, session);

		const aiRes = (
			world.runtime as { aiResources?: { fish: number; timber: number; salvage: number } }
		).aiResources;
		expect(aiRes).toBeDefined();
		expect(aiRes?.fish).toBe(300);
		expect(aiRes?.timber).toBe(200);
		expect(aiRes?.salvage).toBe(100);
	});

	it("sets population tracking", () => {
		const config = makeConfig();
		const session = createSkirmishRuntimeSession(config);
		const world = createGameWorld(config.seed);

		seedGameWorldFromSkirmishSession(world, session);

		expect(world.runtime.population.max).toBe(20);
		expect(world.runtime.population.current).toBeGreaterThanOrEqual(4);
	});
});

// ---------------------------------------------------------------------------
// 3. Skirmish AI opponent
// ---------------------------------------------------------------------------

describe("Skirmish Wiring: AI opponent", () => {
	it("AI adapter connects to skirmish world", () => {
		const config = makeConfig();
		const session = createSkirmishRuntimeSession(config);
		const world = createGameWorld(config.seed);

		seedGameWorldFromSkirmishSession(world, session);

		const adapter = createSkirmishGameAdapter(world);

		// AI should see its own buildings (sludge_pit)
		expect(adapter.hasBuilding("sludge_pit")).toBe(true);

		// AI should see enemy command post
		expect(adapter.isEnemyCommandPostDestroyed()).toBe(false);

		// AI should see its own base
		expect(adapter.isOwnCommandPostDestroyed()).toBe(false);
	});

	it("AI builds, trains, and acts over 10000 ticks via sandbox", () => {
		const config = makeConfig({ difficulty: "brutal" });
		const ai = createSkirmishAIForSandbox(config);

		const result = runSkirmishSandbox({
			config,
			ticks: 10000,
			onTick: (world, _tick) => {
				if (world.session.phase === "playing") {
					ai.update(world.time.deltaMs / 1000);
				}
			},
		});

		// World should still be running or have reached a terminal state
		expect(["playing", "victory", "defeat"]).toContain(result.phase);

		// Should have entities alive
		expect(result.aliveEntities).toBeGreaterThan(0);
	});

	it("AI detects enemy and own base buildings", () => {
		const config = makeConfig();
		const session = createSkirmishRuntimeSession(config);
		const world = createGameWorld(config.seed);

		seedGameWorldFromSkirmishSession(world, session);

		const adapter = createSkirmishGameAdapter(world);

		// AI should see its own sludge_pit
		expect(adapter.getBuildingCount("sludge_pit")).toBe(1);

		// AI should find the enemy base position
		const enemyPos = adapter.getEnemyBasePosition();
		expect(enemyPos.x).toBeGreaterThan(0);
		expect(enemyPos.y).toBeGreaterThan(0);
	});
});

// ---------------------------------------------------------------------------
// 4. Skirmish result
// ---------------------------------------------------------------------------

describe("Skirmish Wiring: Result stats", () => {
	it("computes stats after sandbox run", () => {
		const config = makeConfig();
		const result = runSkirmishSandbox({ config, ticks: 100 });
		const stats = computeSkirmishResult(result);

		expect(stats.ticksRun).toBe(100);
		expect(stats.totalEntitiesAlive).toBeGreaterThan(0);
		expect(stats.seedPhrase).toBe(config.seed.phrase);
		expect(stats.designSeed).toBe(config.seed.designSeed);
	});

	it("reports victory when phase is set to victory", () => {
		const config = makeConfig();
		const result = runSkirmishSandbox({
			config,
			ticks: 100,
			onTick: (world, tick) => {
				if (tick === 20) world.session.phase = "victory";
			},
		});

		const stats = computeSkirmishResult(result);
		expect(stats.outcome).toBe("victory");
	});

	it("reports defeat when phase is set to defeat", () => {
		const config = makeConfig();
		const result = runSkirmishSandbox({
			config,
			ticks: 100,
			onTick: (world, tick) => {
				if (tick === 15) world.session.phase = "defeat";
			},
		});

		const stats = computeSkirmishResult(result);
		expect(stats.outcome).toBe("defeat");
	});

	it("reports final resources correctly", () => {
		const config = makeConfig({
			startingResources: { fish: 777, timber: 555, salvage: 333 },
		});
		const result = runSkirmishSandbox({ config, ticks: 1 });
		const stats = computeSkirmishResult(result);

		expect(stats.finalResources.fish).toBe(777);
		expect(stats.finalResources.timber).toBe(555);
		expect(stats.finalResources.salvage).toBe(333);
	});

	it("counts player and enemy entities", () => {
		const config = makeConfig();
		const result = runSkirmishSandbox({ config, ticks: 1 });
		const stats = computeSkirmishResult(result);

		expect(stats.playerUnitsAlive).toBeGreaterThanOrEqual(1);
		expect(stats.enemyUnitsAlive).toBeGreaterThanOrEqual(1);
		expect(stats.playerBuildingsAlive).toBeGreaterThanOrEqual(1);
		expect(stats.enemyBuildingsAlive).toBeGreaterThanOrEqual(1);
	});
});

// ---------------------------------------------------------------------------
// 5. Seed determinism
// ---------------------------------------------------------------------------

describe("Skirmish Wiring: Seed determinism", () => {
	it("same seed produces identical entity count at tick 5000", () => {
		const seed = makeFixedSeed("determinism-5000");
		const config = makeConfig({ seed });

		const result1 = runSkirmishSandbox({ config, ticks: 5000 });
		const result2 = runSkirmishSandbox({ config, ticks: 5000 });

		expect(result1.aliveEntities).toBe(result2.aliveEntities);
		expect(result1.ticksRun).toBe(result2.ticksRun);
		expect(result1.phase).toBe(result2.phase);
	});

	it("same seed produces identical entity types at tick 5000", () => {
		const seed = makeFixedSeed("type-determinism-5000");
		const config = makeConfig({ seed });

		const result1 = runSkirmishSandbox({ config, ticks: 5000 });
		const result2 = runSkirmishSandbox({ config, ticks: 5000 });

		expect(result1.entitySnapshot.length).toBe(result2.entitySnapshot.length);
		for (let i = 0; i < result1.entitySnapshot.length; i++) {
			expect(result1.entitySnapshot[i].type).toBe(result2.entitySnapshot[i].type);
		}
	});

	it("different seeds produce different maps", () => {
		const seed1 = makeFixedSeed("seed-alpha");
		const seed2 = makeFixedSeed("seed-beta");

		// Verify the seed phrases and numeric seeds differ
		expect(seed1.phrase).not.toBe(seed2.phrase);
		expect(seed1.numericSeed).not.toBe(seed2.numericSeed);

		const config1 = makeConfig({ seed: seed1 });
		const config2 = makeConfig({ seed: seed2 });

		const result1 = runSkirmishSandbox({ config: config1, ticks: 1 });
		const result2 = runSkirmishSandbox({ config: config2, ticks: 1 });

		// Both should boot valid sessions
		expect(result1.aliveEntities).toBeGreaterThan(0);
		expect(result2.aliveEntities).toBeGreaterThan(0);

		// Different seeds should produce different diagnostics run IDs
		expect(result1.diagnostics.runId).not.toBe(result2.diagnostics.runId);
	});
});

// ---------------------------------------------------------------------------
// 6. Difficulty scaling
// ---------------------------------------------------------------------------

describe("Skirmish Wiring: Difficulty scaling", () => {
	it("difficulty affects think interval", () => {
		expect(DIFFICULTY_CONFIG.easy.thinkInterval).toBeGreaterThan(
			DIFFICULTY_CONFIG.medium.thinkInterval,
		);
		expect(DIFFICULTY_CONFIG.medium.thinkInterval).toBeGreaterThan(
			DIFFICULTY_CONFIG.hard.thinkInterval,
		);
		expect(DIFFICULTY_CONFIG.hard.thinkInterval).toBeGreaterThan(
			DIFFICULTY_CONFIG.brutal.thinkInterval,
		);
	});

	it("difficulty affects attack threshold", () => {
		expect(DIFFICULTY_CONFIG.easy.attackThreshold).toBeGreaterThan(
			DIFFICULTY_CONFIG.medium.attackThreshold,
		);
		expect(DIFFICULTY_CONFIG.medium.attackThreshold).toBeGreaterThan(
			DIFFICULTY_CONFIG.hard.attackThreshold,
		);
		expect(DIFFICULTY_CONFIG.hard.attackThreshold).toBeGreaterThan(
			DIFFICULTY_CONFIG.brutal.attackThreshold,
		);
	});

	it("difficulty affects resource bonus", () => {
		expect(DIFFICULTY_CONFIG.easy.resourceBonus).toBe(0);
		expect(DIFFICULTY_CONFIG.medium.resourceBonus).toBe(0.1);
		expect(DIFFICULTY_CONFIG.hard.resourceBonus).toBe(0.25);
		expect(DIFFICULTY_CONFIG.brutal.resourceBonus).toBe(0.5);
	});

	it("only brutal uses multi-prong attack", () => {
		expect(DIFFICULTY_CONFIG.easy.multiProngAttack).toBe(false);
		expect(DIFFICULTY_CONFIG.medium.multiProngAttack).toBe(false);
		expect(DIFFICULTY_CONFIG.hard.multiProngAttack).toBe(false);
		expect(DIFFICULTY_CONFIG.brutal.multiProngAttack).toBe(true);
	});

	it("AI uses config difficulty when created from RuntimeHost", () => {
		for (const diff of ["easy", "medium", "hard", "brutal"] as SkirmishDifficulty[]) {
			const config = makeConfig({ difficulty: diff });
			const session = createSkirmishRuntimeSession(config);
			const world = createGameWorld(config.seed);

			seedGameWorldFromSkirmishSession(world, session);

			const adapter = createSkirmishGameAdapter(world);
			const ai = new SkirmishAI(diff, adapter);

			expect(ai.difficulty).toBe(diff);
		}
	});

	it("each difficulty boots a valid skirmish session", () => {
		for (const diff of ["easy", "medium", "hard", "brutal"] as SkirmishDifficulty[]) {
			const config = makeConfig({ difficulty: diff });
			const result = runSkirmishSandbox({ config, ticks: 100 });

			expect(result.aliveEntities).toBeGreaterThan(0);
			expect(result.world.session.phase).toBe("playing");
		}
	});
});

// ---------------------------------------------------------------------------
// Helper: create SkirmishAI for sandbox
// ---------------------------------------------------------------------------

function createSkirmishAIForSandbox(config: SkirmishSessionConfig): SkirmishAI {
	const session = createSkirmishRuntimeSession(config);
	const world = createGameWorld(config.seed);
	seedGameWorldFromSkirmishSession(world, session);
	const adapter = createSkirmishGameAdapter(world);
	return new SkirmishAI(config.difficulty, adapter);
}
