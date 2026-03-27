/**
 * Floating Text System Tests — W1-08
 *
 * Validates the floating combat/resource text lifecycle:
 * - Spawning with correct properties
 * - Tick removes expired entries
 * - Integration with GameWorld runtime
 */

import { describe, expect, it } from "vitest";
import { createGameWorld, spawnFloatingText, tickFloatingTexts } from "./gameWorld";

describe("engine/world/floatingText", () => {
	it("spawns a floating text entry with correct properties", () => {
		const world = createGameWorld();
		world.time.elapsedMs = 1000;
		spawnFloatingText(world, 100, 200, "-15", "red", 900);

		expect(world.runtime.floatingTexts).toHaveLength(1);
		const ft = world.runtime.floatingTexts[0];
		expect(ft.text).toBe("-15");
		expect(ft.x).toBe(100);
		expect(ft.y).toBe(200);
		expect(ft.color).toBe("red");
		expect(ft.spawnedAtMs).toBe(1000);
		expect(ft.durationMs).toBe(900);
	});

	it("uses default duration of 900ms when not specified", () => {
		const world = createGameWorld();
		world.time.elapsedMs = 500;
		spawnFloatingText(world, 0, 0, "+20", "green");

		expect(world.runtime.floatingTexts[0].durationMs).toBe(900);
	});

	it("tick removes expired floating texts", () => {
		const world = createGameWorld();
		world.time.elapsedMs = 0;

		// Spawn 3 texts at different times
		spawnFloatingText(world, 0, 0, "A", "red", 500);
		world.time.elapsedMs = 200;
		spawnFloatingText(world, 0, 0, "B", "green", 500);
		world.time.elapsedMs = 400;
		spawnFloatingText(world, 0, 0, "C", "yellow", 500);

		expect(world.runtime.floatingTexts).toHaveLength(3);

		// At t=600, only A should be expired (spawned at 0, duration 500)
		world.time.elapsedMs = 600;
		tickFloatingTexts(world);
		expect(world.runtime.floatingTexts).toHaveLength(2);
		expect(world.runtime.floatingTexts.map((ft) => ft.text)).toEqual(["B", "C"]);

		// At t=800, B should also be expired (spawned at 200, duration 500)
		world.time.elapsedMs = 800;
		tickFloatingTexts(world);
		expect(world.runtime.floatingTexts).toHaveLength(1);
		expect(world.runtime.floatingTexts[0].text).toBe("C");

		// At t=1000, all expired
		world.time.elapsedMs = 1000;
		tickFloatingTexts(world);
		expect(world.runtime.floatingTexts).toHaveLength(0);
	});

	it("supports all color types", () => {
		const world = createGameWorld();
		spawnFloatingText(world, 0, 0, "red", "red");
		spawnFloatingText(world, 0, 0, "green", "green");
		spawnFloatingText(world, 0, 0, "yellow", "yellow");
		spawnFloatingText(world, 0, 0, "white", "white");

		expect(world.runtime.floatingTexts).toHaveLength(4);
		expect(world.runtime.floatingTexts.map((ft) => ft.color)).toEqual([
			"red",
			"green",
			"yellow",
			"white",
		]);
	});

	it("multiple floating texts can exist simultaneously", () => {
		const world = createGameWorld();
		for (let i = 0; i < 20; i++) {
			spawnFloatingText(world, i * 10, i * 10, `-${i}`, "red");
		}
		expect(world.runtime.floatingTexts).toHaveLength(20);
	});
});
