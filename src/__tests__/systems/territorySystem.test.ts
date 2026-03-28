/**
 * Territory System Tests — ported from old Koota codebase.
 *
 * Tests zone control tracking by faction.
 */

import { describe, expect, it } from "vitest";
import { createGameWorld, spawnUnit } from "@/engine/world/gameWorld";
import { runTerritorySystem } from "@/engine/systems/territorySystem";

function makeWorld() {
	const world = createGameWorld();
	world.time.deltaMs = 16;
	return world;
}

describe("engine/systems/territorySystem", () => {
	it("reports ura control when more ura units in zone", () => {
		const world = makeWorld();
		world.runtime.zoneRects.set("zone_a", { x: 0, y: 0, width: 200, height: 200 });

		spawnUnit(world, { x: 50, y: 50, faction: "ura" });
		spawnUnit(world, { x: 60, y: 60, faction: "ura" });
		spawnUnit(world, { x: 70, y: 70, faction: "scale_guard" });

		runTerritorySystem(world);

		const control = world.events.find((e) => e.type === "zone-control");
		expect(control?.payload?.controller).toBe("ura");
		expect(control?.payload?.uraCount).toBe(2);
		expect(control?.payload?.scaleCount).toBe(1);
	});

	it("reports scale_guard control when more scale_guard units in zone", () => {
		const world = makeWorld();
		world.runtime.zoneRects.set("zone_a", { x: 0, y: 0, width: 200, height: 200 });

		spawnUnit(world, { x: 50, y: 50, faction: "ura" });
		spawnUnit(world, { x: 60, y: 60, faction: "scale_guard" });
		spawnUnit(world, { x: 70, y: 70, faction: "scale_guard" });
		spawnUnit(world, { x: 80, y: 80, faction: "scale_guard" });

		runTerritorySystem(world);

		const control = world.events.find((e) => e.type === "zone-control");
		expect(control?.payload?.controller).toBe("scale_guard");
	});

	it("reports contested when equal units in zone", () => {
		const world = makeWorld();
		world.runtime.zoneRects.set("zone_a", { x: 0, y: 0, width: 200, height: 200 });

		spawnUnit(world, { x: 50, y: 50, faction: "ura" });
		spawnUnit(world, { x: 60, y: 60, faction: "scale_guard" });

		runTerritorySystem(world);

		const control = world.events.find((e) => e.type === "zone-control");
		expect(control?.payload?.controller).toBe("contested");
	});

	it("reports contested when no units in zone", () => {
		const world = makeWorld();
		world.runtime.zoneRects.set("zone_a", { x: 0, y: 0, width: 200, height: 200 });

		// Units outside zone
		spawnUnit(world, { x: 500, y: 500, faction: "ura" });

		runTerritorySystem(world);

		const control = world.events.find((e) => e.type === "zone-control");
		expect(control?.payload?.controller).toBe("contested");
		expect(control?.payload?.uraCount).toBe(0);
		expect(control?.payload?.scaleCount).toBe(0);
	});

	it("tracks multiple zones independently", () => {
		const world = makeWorld();
		world.runtime.zoneRects.set("zone_a", { x: 0, y: 0, width: 100, height: 100 });
		world.runtime.zoneRects.set("zone_b", { x: 200, y: 200, width: 100, height: 100 });

		spawnUnit(world, { x: 50, y: 50, faction: "ura" }); // in zone_a
		spawnUnit(world, { x: 250, y: 250, faction: "scale_guard" }); // in zone_b

		runTerritorySystem(world);

		const controls = world.events.filter((e) => e.type === "zone-control");
		expect(controls).toHaveLength(2);

		const zoneA = controls.find((e) => e.payload?.zoneId === "zone_a");
		const zoneB = controls.find((e) => e.payload?.zoneId === "zone_b");
		expect(zoneA?.payload?.controller).toBe("ura");
		expect(zoneB?.payload?.controller).toBe("scale_guard");
	});

	it("ignores units outside zone boundaries", () => {
		const world = makeWorld();
		world.runtime.zoneRects.set("zone_a", { x: 0, y: 0, width: 100, height: 100 });

		spawnUnit(world, { x: 150, y: 50, faction: "ura" }); // outside
		spawnUnit(world, { x: 50, y: 150, faction: "ura" }); // outside
		spawnUnit(world, { x: 50, y: 50, faction: "scale_guard" }); // inside

		runTerritorySystem(world);

		const control = world.events.find((e) => e.type === "zone-control");
		expect(control?.payload?.controller).toBe("scale_guard");
		expect(control?.payload?.uraCount).toBe(0);
		expect(control?.payload?.scaleCount).toBe(1);
	});

	it("does nothing when no zones are defined", () => {
		const world = makeWorld();
		spawnUnit(world, { x: 50, y: 50, faction: "ura" });

		runTerritorySystem(world);

		expect(world.events.filter((e) => e.type === "zone-control")).toHaveLength(0);
	});
});
