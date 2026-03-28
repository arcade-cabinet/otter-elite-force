/**
 * E2E Integration Test — Skirmish Flow.
 *
 * Exercises the skirmish lifecycle headlessly:
 *   1. Create a skirmish session with a fixed seed
 *   2. Boot GameWorld and run the system pipeline
 *   3. Verify entities exist, resources change, systems run
 *   4. Verify deterministic replay (same seed produces same state)
 */

import { describe, expect, it } from "vitest";
import { createSeedBundle, type SeedBundle } from "@/engine/random/seed";
import { type EntitySnapshot, runSkirmishSandbox } from "@/engine/session/skirmishSandbox";
import { Position } from "@/engine/world/components";
import type { SkirmishSessionConfig } from "@/features/skirmish/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFixedSeed(phrase = "e2e-skirmish-delta"): SeedBundle {
	return createSeedBundle({
		phrase,
		source: "skirmish",
		gameplayNamespaces: ["loot", "encounter", "combat", "waves", "ai"],
	});
}

function makeConfig(seed?: SeedBundle): SkirmishSessionConfig {
	const s = seed ?? makeFixedSeed();
	return {
		mapId: "sk_river_crossing",
		mapName: "River Crossing",
		difficulty: "medium",
		playAsScaleGuard: false,
		preset: "meso",
		seed: s,
		startingResources: { fish: 300, timber: 200, salvage: 100 },
	};
}

// ---------------------------------------------------------------------------
// Task 2: Skirmish flow E2E
// ---------------------------------------------------------------------------

describe("E2E: Skirmish flow", () => {
	describe("Session boot and basic state", () => {
		it("boots a skirmish session with entities from config", () => {
			const result = runSkirmishSandbox({
				config: makeConfig(),
				ticks: 1,
			});

			// Should have alive entities from the skirmish map
			expect(result.aliveEntities).toBeGreaterThanOrEqual(10);

			// Should be in playing phase
			expect(result.world.session.phase).toBe("playing");

			// Session should reflect skirmish map
			expect(result.world.session.currentMissionId).toBe("sk_river_crossing");

			// Starting resources should be set
			expect(result.world.session.resources.fish).toBe(300);
			expect(result.world.session.resources.timber).toBe(200);
			expect(result.world.session.resources.salvage).toBe(100);
		});

		it("has valid entity positions after boot", () => {
			const result = runSkirmishSandbox({
				config: makeConfig(),
				ticks: 1,
			});

			expect(result.entitySnapshot.length).toBeGreaterThan(0);

			for (const entity of result.entitySnapshot) {
				expect(typeof entity.x).toBe("number");
				expect(typeof entity.y).toBe("number");
				expect(typeof entity.health).toBe("number");
				expect(typeof entity.eid).toBe("number");
			}
		});
	});

	describe("System pipeline execution", () => {
		it("runs for 10000 ticks without crashing", () => {
			const result = runSkirmishSandbox({
				config: makeConfig(),
				ticks: 10000,
			});

			expect(result.ticksRun).toBeLessThanOrEqual(10000);
			expect(result.ticksRun).toBeGreaterThan(0);

			// World should still have entities (not everything dead)
			expect(result.aliveEntities).toBeGreaterThan(0);

			// Time should have advanced
			expect(result.world.time.elapsedMs).toBeGreaterThan(0);
		});

		it("entities exist and systems run across 10000 ticks", () => {
			const result = runSkirmishSandbox({
				config: makeConfig(),
				ticks: 10000,
			});

			// Systems should have run: time advanced, entities present
			expect(result.world.time.elapsedMs).toBeGreaterThan(0);
			expect(result.aliveEntities).toBeGreaterThan(0);

			// The pipeline ran for the expected number of ticks
			// (may exit early on victory/defeat)
			expect(result.ticksRun).toBeGreaterThan(0);
			expect(result.ticksRun).toBeLessThanOrEqual(10000);

			// Phase should be valid
			expect(["playing", "victory", "defeat"]).toContain(result.phase);

			// Diagnostics should be captured
			expect(result.diagnostics.mode).toBe("skirmish");
		});

		it("tracks elapsed time correctly", () => {
			const ticks = 500;
			const deltaMs = 16;

			const result = runSkirmishSandbox({
				config: makeConfig(),
				ticks,
				deltaMs,
			});

			// If the game ended early, ticksRun < ticks
			expect(result.world.time.elapsedMs).toBe(result.ticksRun * deltaMs);
		});
	});

	describe("Deterministic seed replay", () => {
		it("produces identical entity counts with the same seed", () => {
			const seed = makeFixedSeed("deterministic-replay-test");
			const config = makeConfig(seed);

			const result1 = runSkirmishSandbox({ config, ticks: 60 });
			const result2 = runSkirmishSandbox({ config, ticks: 60 });

			// Same entity count
			expect(result1.aliveEntities).toBe(result2.aliveEntities);

			// Same tick count (both ran to completion or same early exit)
			expect(result1.ticksRun).toBe(result2.ticksRun);

			// Same phase
			expect(result1.phase).toBe(result2.phase);
		});

		it("produces identical entity type sets with the same seed", () => {
			const seed = makeFixedSeed("type-replay-check");
			const config = makeConfig(seed);

			const result1 = runSkirmishSandbox({ config, ticks: 60 });
			const result2 = runSkirmishSandbox({ config, ticks: 60 });

			// Both runs should produce the same number of entities
			expect(result1.entitySnapshot.length).toBe(result2.entitySnapshot.length);

			// Entity types should match pairwise (snapshots are sorted by eid)
			for (let i = 0; i < result1.entitySnapshot.length; i++) {
				expect(result1.entitySnapshot[i].type).toBe(result2.entitySnapshot[i].type);
			}
		});

		it("produces different numeric seeds from different phrases", () => {
			const seed1 = makeFixedSeed("alpha-seed-one");
			const seed2 = makeFixedSeed("beta-seed-two");

			// Different phrases should produce different normalized phrases
			expect(seed1.phrase).not.toBe(seed2.phrase);

			// Different phrases should produce different numeric seeds
			expect(seed1.numericSeed).not.toBe(seed2.numericSeed);

			// Both should still boot valid sessions
			const result1 = runSkirmishSandbox({ config: makeConfig(seed1), ticks: 1 });
			const result2 = runSkirmishSandbox({ config: makeConfig(seed2), ticks: 1 });

			expect(result1.aliveEntities).toBeGreaterThan(0);
			expect(result2.aliveEntities).toBeGreaterThan(0);
		});

		it("longer runs with the same seed remain deterministic", () => {
			const seed = makeFixedSeed("long-run-determinism");
			const config = makeConfig(seed);

			const result1 = runSkirmishSandbox({ config, ticks: 500 });
			const result2 = runSkirmishSandbox({ config, ticks: 500 });

			expect(result1.aliveEntities).toBe(result2.aliveEntities);
			expect(result1.ticksRun).toBe(result2.ticksRun);
			expect(result1.phase).toBe(result2.phase);
			expect(result1.entitySnapshot.length).toBe(result2.entitySnapshot.length);
		});
	});

	describe("Diagnostics and metadata", () => {
		it("captures diagnostics snapshot with seed info", () => {
			const seed = makeFixedSeed("diag-check");
			const result = runSkirmishSandbox({
				config: makeConfig(seed),
				ticks: 10,
			});

			expect(result.diagnostics.mode).toBe("skirmish");
			expect(result.diagnostics.seedPhrase).toBe(seed.phrase);
			expect(result.diagnostics.designSeed).toBe(seed.designSeed);
			expect(result.diagnostics.skirmishPresetId).toBe("meso");
		});

		it("onTick callback is invoked each frame", () => {
			const ticksSeen: number[] = [];
			runSkirmishSandbox({
				config: makeConfig(),
				ticks: 5,
				onTick: (_world, tick) => {
					ticksSeen.push(tick);
				},
			});

			expect(ticksSeen).toEqual([0, 1, 2, 3, 4]);
		});

		it("early exits on forced victory", () => {
			const result = runSkirmishSandbox({
				config: makeConfig(),
				ticks: 1000,
				onTick: (world, tick) => {
					if (tick === 50) {
						world.session.phase = "victory";
					}
				},
			});

			expect(result.ticksRun).toBe(51);
			expect(result.phase).toBe("victory");
		});
	});
});
