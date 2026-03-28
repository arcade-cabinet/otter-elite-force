import { describe, expect, it } from "vitest";
import { Flags, VisionRadius } from "@/engine/world/components";
import { createGameWorld, spawnUnit } from "@/engine/world/gameWorld";
import { runDetectionSystem } from "./detectionSystem";

describe("engine/systems/detectionSystem", () => {
	it("detects player units within enemy vision range", () => {
		const world = createGameWorld();
		const enemy = spawnUnit(world, {
			x: 50,
			y: 50,
			faction: "scale_guard",
			health: { current: 10, max: 10 },
		});
		VisionRadius.value[enemy] = 100;

		spawnUnit(world, { x: 60, y: 50, faction: "ura", health: { current: 10, max: 10 } });

		runDetectionSystem(world);

		expect(world.events.some((e) => e.type === "enemy-detected")).toBe(true);
	});

	it("does not detect units outside vision range", () => {
		const world = createGameWorld();
		const enemy = spawnUnit(world, {
			x: 0,
			y: 0,
			faction: "scale_guard",
			health: { current: 10, max: 10 },
		});
		VisionRadius.value[enemy] = 10;

		spawnUnit(world, { x: 500, y: 500, faction: "ura", health: { current: 10, max: 10 } });

		runDetectionSystem(world);

		expect(world.events.some((e) => e.type === "enemy-detected")).toBe(false);
	});

	it("stealthed units are harder to detect", () => {
		const world = createGameWorld();
		const enemy = spawnUnit(world, {
			x: 50,
			y: 50,
			faction: "scale_guard",
			health: { current: 10, max: 10 },
		});
		VisionRadius.value[enemy] = 30;

		const player = spawnUnit(world, {
			x: 70,
			y: 50,
			faction: "ura",
			health: { current: 10, max: 10 },
		});
		Flags.stealthed[player] = 1;

		// Distance is 20, normal vision 30 would detect, but stealth halves to 15
		runDetectionSystem(world);

		expect(world.events.some((e) => e.type === "enemy-detected")).toBe(false);
	});
});
