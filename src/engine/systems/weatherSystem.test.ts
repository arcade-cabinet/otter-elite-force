import { describe, expect, it, beforeEach } from "vitest";
import { Attack, Speed, VisionRadius } from "@/engine/world/components";
import { createGameWorld, spawnUnit } from "@/engine/world/gameWorld";
import { runWeatherSystem, resetWeatherSystem } from "./weatherSystem";

describe("engine/systems/weatherSystem", () => {
	beforeEach(() => {
		resetWeatherSystem();
	});

	it("does not modify stats in clear weather", () => {
		const world = createGameWorld();
		world.runtime.weather = "clear";

		const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
		Speed.value[eid] = 64;
		VisionRadius.value[eid] = 128;

		runWeatherSystem(world);

		expect(Speed.value[eid]).toBe(64);
		expect(VisionRadius.value[eid]).toBe(128);
	});

	it("reduces speed and vision in rain", () => {
		const world = createGameWorld();
		world.runtime.weather = "rain";

		const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
		Speed.value[eid] = 100;
		VisionRadius.value[eid] = 100;

		runWeatherSystem(world);

		expect(Speed.value[eid]).toBeCloseTo(90, 0); // 10% reduction
		expect(VisionRadius.value[eid]).toBeCloseTo(75, 0); // 25% reduction
	});

	it("applies heavy penalties in monsoon", () => {
		const world = createGameWorld();
		world.runtime.weather = "monsoon";

		const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
		Speed.value[eid] = 100;
		VisionRadius.value[eid] = 100;
		Attack.range[eid] = 100;

		runWeatherSystem(world);

		expect(Speed.value[eid]).toBeCloseTo(75, 0); // 25% reduction
		expect(VisionRadius.value[eid]).toBeCloseTo(50, 0); // 50% reduction
		expect(Attack.range[eid]).toBeCloseTo(70, 0); // 30% reduction
	});
});
