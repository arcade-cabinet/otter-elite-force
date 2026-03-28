import { describe, expect, it } from "vitest";
import { Faction, Flags, Health, Position, Speed } from "@/engine/world/components";
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

	it("stops convoy when enemy is within detection radius", () => {
		const world = createGameWorld();
		world.time.deltaMs = 1000;

		// Spawn a neutral convoy
		const convoy = spawnUnit(world, { x: 100, y: 100, faction: "ura" });
		Speed.value[convoy] = 64;
		Health.current[convoy] = 50;
		Health.max[convoy] = 50;
		world.runtime.convoyRoutes.set(convoy, [{ x: 10, y: 0 }]);
		world.runtime.convoyDetectionRadius.set(convoy, 200);

		// Spawn enemy within detection radius
		const enemy = spawnUnit(world, { x: 150, y: 100, faction: "scale_guard" });
		Health.current[enemy] = 30;
		Health.max[enemy] = 30;

		const startX = Position.x[convoy];
		runConvoySystem(world);

		// Convoy should be stopped
		expect(world.runtime.convoyStopped.get(convoy)).toBe(true);
		// Convoy should NOT have moved
		expect(Position.x[convoy]).toBe(startX);
	});

	it("resumes convoy when enemies are cleared", () => {
		const world = createGameWorld();
		world.time.deltaMs = 1000;

		const convoy = spawnUnit(world, { x: 100, y: 100, faction: "ura" });
		Speed.value[convoy] = 64;
		Health.current[convoy] = 50;
		Health.max[convoy] = 50;
		world.runtime.convoyRoutes.set(convoy, [{ x: 10, y: 0 }]);
		world.runtime.convoyDetectionRadius.set(convoy, 200);

		// Pre-set stopped state
		world.runtime.convoyStopped.set(convoy, true);

		// No enemies alive -- convoy should resume
		runConvoySystem(world);

		expect(world.runtime.convoyStopped.get(convoy)).toBe(false);
		// Convoy should have moved since it resumed
		expect(Position.x[convoy]).toBeGreaterThan(100);
	});

	it("emits convoy-destroyed event when health reaches zero", () => {
		const world = createGameWorld();
		world.time.deltaMs = 100;

		const convoy = spawnUnit(world, { x: 100, y: 100, faction: "neutral" });
		Health.current[convoy] = 0;
		Health.max[convoy] = 50;
		world.runtime.convoyRoutes.set(convoy, [{ x: 10, y: 10 }]);

		runConvoySystem(world);

		const destroyedEvent = world.events.find((e) => e.type === "convoy-destroyed");
		expect(destroyedEvent).toBeDefined();
		expect(destroyedEvent?.payload?.eid).toBe(convoy);
	});

	it("emits convoy-waypoint-reached event per waypoint", () => {
		const world = createGameWorld();
		world.time.deltaMs = 100;

		// Place entity right at first waypoint
		const eid = spawnUnit(world, {
			x: 3 * 32 + 16,
			y: 0 * 32 + 16,
			faction: "neutral",
		});
		Speed.value[eid] = 100;
		world.runtime.convoyRoutes.set(eid, [
			{ x: 3, y: 0 },
			{ x: 10, y: 0 },
		]);

		runConvoySystem(world);

		const waypointEvent = world.events.find((e) => e.type === "convoy-waypoint-reached");
		expect(waypointEvent).toBeDefined();
	});

	it("ignores dead enemies when detecting threats", () => {
		const world = createGameWorld();
		world.time.deltaMs = 1000;

		const convoy = spawnUnit(world, { x: 100, y: 100, faction: "ura" });
		Speed.value[convoy] = 64;
		Health.current[convoy] = 50;
		Health.max[convoy] = 50;
		world.runtime.convoyRoutes.set(convoy, [{ x: 10, y: 0 }]);
		world.runtime.convoyDetectionRadius.set(convoy, 200);

		// Spawn dead enemy within range
		const deadEnemy = spawnUnit(world, { x: 120, y: 100, faction: "scale_guard" });
		Health.current[deadEnemy] = 0;
		Health.max[deadEnemy] = 30;

		runConvoySystem(world);

		// Should NOT be stopped -- enemy is dead
		expect(world.runtime.convoyStopped.get(convoy)).toBeFalsy();
	});
});
