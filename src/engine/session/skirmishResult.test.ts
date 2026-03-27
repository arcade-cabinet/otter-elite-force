/**
 * Tests for skirmish result statistics computation.
 */

import { describe, expect, it } from "vitest";
import type { SkirmishSessionConfig } from "@/features/skirmish/types";
import { computeSkirmishResult } from "./skirmishResult";
import { runSkirmishSandbox } from "./skirmishSandbox";

function makeConfig(phrase = "silent-ember-heron"): SkirmishSessionConfig {
	return {
		mapId: "sk_river_crossing",
		mapName: "River Crossing",
		difficulty: "medium",
		playAsScaleGuard: false,
		preset: "meso",
		seed: {
			phrase,
			source: "skirmish",
			numericSeed: 42,
			designSeed: 42,
			gameplaySeeds: { loot: 1, encounter: 2, combat: 3 },
		},
		startingResources: { fish: 300, timber: 200, salvage: 100 },
	};
}

describe("engine/session/skirmishResult", () => {
	it("computes result stats from a playing skirmish", () => {
		const sandboxResult = runSkirmishSandbox({
			config: makeConfig(),
			ticks: 60,
		});

		const stats = computeSkirmishResult(sandboxResult);

		expect(stats.outcome).toBe("timeout"); // Still playing = timeout
		expect(stats.ticksRun).toBe(60);
		expect(stats.durationSeconds).toBe(Math.round((60 * 16) / 1000));
		expect(stats.totalEntitiesAlive).toBeGreaterThan(0);
		expect(stats.playerUnitsAlive).toBeGreaterThanOrEqual(0);
		expect(stats.enemyUnitsAlive).toBeGreaterThanOrEqual(0);
		expect(stats.seedPhrase).toBe("silent-ember-heron");
		expect(stats.designSeed).toBe(42);
	});

	it("reports victory when phase is victory", () => {
		const sandboxResult = runSkirmishSandbox({
			config: makeConfig(),
			ticks: 100,
			onTick: (world, tick) => {
				if (tick === 10) {
					world.session.phase = "victory";
				}
			},
		});

		const stats = computeSkirmishResult(sandboxResult);

		expect(stats.outcome).toBe("victory");
		expect(stats.ticksRun).toBe(11);
	});

	it("reports defeat when phase is defeat", () => {
		const sandboxResult = runSkirmishSandbox({
			config: makeConfig(),
			ticks: 100,
			onTick: (world, tick) => {
				if (tick === 5) {
					world.session.phase = "defeat";
				}
			},
		});

		const stats = computeSkirmishResult(sandboxResult);

		expect(stats.outcome).toBe("defeat");
	});

	it("reports final resources", () => {
		const sandboxResult = runSkirmishSandbox({
			config: makeConfig(),
			ticks: 1,
		});

		const stats = computeSkirmishResult(sandboxResult);

		expect(stats.finalResources.fish).toBe(300);
		expect(stats.finalResources.timber).toBe(200);
		expect(stats.finalResources.salvage).toBe(100);
	});

	it("counts player and enemy entities separately", () => {
		const sandboxResult = runSkirmishSandbox({
			config: makeConfig(),
			ticks: 1,
		});

		const stats = computeSkirmishResult(sandboxResult);

		// Skirmish spawns: 1 player base, 4 player units, 1 enemy base, 4 enemy units, resources
		expect(stats.playerBuildingsAlive).toBeGreaterThanOrEqual(1);
		expect(stats.enemyBuildingsAlive).toBeGreaterThanOrEqual(1);
		expect(stats.playerUnitsAlive).toBeGreaterThanOrEqual(1);
		expect(stats.enemyUnitsAlive).toBeGreaterThanOrEqual(1);
	});

	it("deterministic seed replay produces identical result stats", () => {
		const config = makeConfig("replay-test-seed");

		const result1 = runSkirmishSandbox({ config, ticks: 60 });
		const result2 = runSkirmishSandbox({ config, ticks: 60 });

		const stats1 = computeSkirmishResult(result1);
		const stats2 = computeSkirmishResult(result2);

		expect(stats1.ticksRun).toBe(stats2.ticksRun);
		expect(stats1.totalEntitiesAlive).toBe(stats2.totalEntitiesAlive);
		expect(stats1.playerUnitsAlive).toBe(stats2.playerUnitsAlive);
		expect(stats1.enemyUnitsAlive).toBe(stats2.enemyUnitsAlive);
		expect(stats1.outcome).toBe(stats2.outcome);
		expect(stats1.seedPhrase).toBe(stats2.seedPhrase);
	});
});
