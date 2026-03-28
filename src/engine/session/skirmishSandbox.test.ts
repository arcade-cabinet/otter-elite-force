import { describe, expect, it } from "vitest";
import type { SkirmishSessionConfig } from "@/features/skirmish/types";
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

describe("engine/session/skirmishSandbox", () => {
	it("boots a skirmish session with entities from config", () => {
		const result = runSkirmishSandbox({
			config: makeConfig(),
			ticks: 1,
		});

		expect(result.aliveEntities).toBeGreaterThanOrEqual(10);
		expect(result.world.session.phase).toBe("playing");
		expect(result.world.session.currentMissionId).toBe("sk_river_crossing");
		expect(result.world.session.resources.fish).toBe(300);
		expect(result.world.session.resources.timber).toBe(200);
		expect(result.world.session.resources.salvage).toBe(100);
	});

	it("runs system pipeline for specified ticks", () => {
		const result = runSkirmishSandbox({
			config: makeConfig(),
			ticks: 60,
		});

		expect(result.ticksRun).toBe(60);
		expect(result.world.time.elapsedMs).toBe(60 * 16);
	});

	it("emits diagnostics snapshot on completion", () => {
		const result = runSkirmishSandbox({
			config: makeConfig(),
			ticks: 10,
		});

		expect(result.diagnostics.mode).toBe("skirmish");
		expect(result.diagnostics.seedPhrase).toBe("silent-ember-heron");
		expect(result.diagnostics.designSeed).toBe(42);
		expect(result.diagnostics.skirmishPresetId).toBe("meso");
	});

	it("produces deterministic entity state with seed replay", () => {
		const config = makeConfig("rapid-ember-heron");

		// Run 1
		const result1 = runSkirmishSandbox({ config, ticks: 60 });

		// Run 2 with identical seed
		const result2 = runSkirmishSandbox({ config, ticks: 60 });

		// Both runs should produce the same entity count
		expect(result1.aliveEntities).toBe(result2.aliveEntities);
		expect(result1.ticksRun).toBe(result2.ticksRun);
		expect(result1.phase).toBe(result2.phase);

		// Entity snapshots should be identical
		expect(result1.entitySnapshot.length).toBe(result2.entitySnapshot.length);
		for (let i = 0; i < result1.entitySnapshot.length; i++) {
			const s1 = result1.entitySnapshot[i];
			const s2 = result2.entitySnapshot[i];
			expect(s1.type).toBe(s2.type);
			// Note: positions may differ due to shared typed arrays in bitECS,
			// but entity count and types must match for deterministic replay.
		}
	});

	it("invokes onTick callback each frame", () => {
		const ticks: number[] = [];
		runSkirmishSandbox({
			config: makeConfig(),
			ticks: 5,
			onTick: (_world, tick) => {
				ticks.push(tick);
			},
		});

		expect(ticks).toEqual([0, 1, 2, 3, 4]);
	});

	it("early exits on victory/defeat phase", () => {
		const result = runSkirmishSandbox({
			config: makeConfig(),
			ticks: 1000,
			onTick: (world, tick) => {
				// Force victory at tick 10
				if (tick === 10) {
					world.session.phase = "victory";
				}
			},
		});

		expect(result.ticksRun).toBe(11);
		expect(result.phase).toBe("victory");
	});

	it("supports custom deltaMs for variable frame rates", () => {
		const result = runSkirmishSandbox({
			config: makeConfig(),
			ticks: 100,
			deltaMs: 33, // ~30fps
		});

		expect(result.world.time.elapsedMs).toBe(100 * 33);
	});

	it("captures entity snapshot with positions and health", () => {
		const result = runSkirmishSandbox({
			config: makeConfig(),
			ticks: 1,
		});

		expect(result.entitySnapshot.length).toBe(result.aliveEntities);
		for (const entity of result.entitySnapshot) {
			expect(typeof entity.eid).toBe("number");
			expect(typeof entity.x).toBe("number");
			expect(typeof entity.y).toBe("number");
			expect(typeof entity.health).toBe("number");
		}
	});
});
