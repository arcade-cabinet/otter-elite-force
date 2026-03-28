import { beforeEach, describe, expect, it } from "vitest";
import { createGameWorld } from "@/engine/world/gameWorld";
import { resetWaveTimers, runWaveSpawnerSystem } from "./waveSpawnerSystem";

describe("engine/systems/waveSpawnerSystem", () => {
	beforeEach(() => {
		resetWaveTimers();
	});

	it("does nothing when waveCounter is 0", () => {
		const world = createGameWorld();
		world.time.deltaMs = 16;
		world.runtime.waveCounter = 0;

		const before = world.runtime.alive.size;
		runWaveSpawnerSystem(world);

		expect(world.runtime.alive.size).toBe(before);
	});

	it("does not spawn until cooldown elapsed", () => {
		const world = createGameWorld();
		world.time.deltaMs = 1000; // 1 second
		world.runtime.waveCounter = 1;
		world.runtime.zoneRects.set("enemy_spawn", { x: 500, y: 500, width: 100, height: 100 });

		const before = world.runtime.alive.size;
		// 1 second is less than 30s cooldown
		runWaveSpawnerSystem(world);

		expect(world.runtime.alive.size).toBe(before);
	});
});
