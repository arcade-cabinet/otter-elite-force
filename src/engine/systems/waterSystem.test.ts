import { describe, expect, it } from "vitest";
import { Flags, Health, Position } from "@/engine/world/components";
import { createGameWorld, spawnUnit } from "@/engine/world/gameWorld";
import { runWaterSystem } from "./waterSystem";

describe("engine/systems/waterSystem", () => {
	it("submerges swimming entities in water zones", () => {
		const world = createGameWorld();
		world.time.deltaMs = 100;
		world.navigation.width = 64;
		world.navigation.height = 64;
		world.runtime.zoneRects.set("river_zone", { x: 0, y: 0, width: 200, height: 200 });

		const eid = spawnUnit(world, { x: 50, y: 50, faction: "ura" });
		Flags.canSwim[eid] = 1;

		runWaterSystem(world);

		expect(Flags.submerged[eid]).toBe(1);
	});

	it("clears submerged flag when leaving water", () => {
		const world = createGameWorld();
		world.time.deltaMs = 100;
		world.navigation.width = 64;
		world.navigation.height = 64;
		// No water zones

		const eid = spawnUnit(world, { x: 500, y: 500, faction: "ura" });
		Flags.submerged[eid] = 1;
		Flags.canSwim[eid] = 1;

		runWaterSystem(world);

		expect(Flags.submerged[eid]).toBe(0);
	});
});
