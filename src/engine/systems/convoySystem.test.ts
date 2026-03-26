import { describe, expect, it } from "vitest";
import { Position, Speed } from "@/engine/world/components";
import { createGameWorld, spawnUnit } from "@/engine/world/gameWorld";
import { runConvoySystem } from "./convoySystem";

describe("engine/systems/convoySystem", () => {
	it("moves convoy entities along their route", () => {
		const world = createGameWorld();
		world.time.deltaMs = 1000; // 1 second

		const eid = spawnUnit(world, { x: 16, y: 16, faction: "neutral", unitType: "convoy_truck" });
		Speed.value[eid] = 64;
		world.runtime.convoyRoutes.set(eid, [
			{ x: 5, y: 0 },
			{ x: 10, y: 0 },
		]);

		runConvoySystem(world);

		// Should have moved toward first waypoint (5*32+16 = 176)
		expect(Position.x[eid]).toBeGreaterThan(16);
	});

	it("emits convoy-arrived event when route completes", () => {
		const world = createGameWorld();
		world.time.deltaMs = 100;

		// Place entity very close to waypoint
		const eid = spawnUnit(world, { x: 5 * 32 + 16, y: 16, faction: "neutral" });
		Speed.value[eid] = 100;
		world.runtime.convoyRoutes.set(eid, [{ x: 5, y: 0 }]);

		runConvoySystem(world);

		expect(world.events.some((e) => e.type === "convoy-arrived")).toBe(true);
	});

	it("skips dead convoy entities", () => {
		const world = createGameWorld();
		world.time.deltaMs = 100;

		const eid = spawnUnit(world, { x: 16, y: 16, faction: "neutral" });
		world.runtime.convoyRoutes.set(eid, [{ x: 10, y: 10 }]);
		world.runtime.alive.delete(eid);

		runConvoySystem(world);

		expect(world.events).toHaveLength(0);
	});
});
