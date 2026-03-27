import { beforeEach, describe, expect, it } from "vitest";
import { FACTION_IDS } from "@/engine/content/ids";
import { Faction, Health, Position } from "@/engine/world/components";
import { createGameWorld, spawnBuilding, spawnUnit } from "@/engine/world/gameWorld";
import { createFogGrid, type FogRuntime, FOG_EXPLORED, FOG_UNEXPLORED } from "./fogSystem";
import {
	type TerritoryRuntime,
	FOG_REVEAL_RADIUS,
	registerVillage,
	resetTerritoryState,
	runTerritorySystem,
} from "./territorySystem";

function makeWorld(deltaMs: number) {
	const world = createGameWorld();
	world.time.deltaMs = deltaMs;
	return world;
}

/** Create a village building at the given position. */
function createVillage(
	world: ReturnType<typeof createGameWorld>,
	x: number,
	y: number,
	faction: string = "scale_guard",
) {
	return spawnBuilding(world, {
		x,
		y,
		faction,
		buildingType: "village",
		health: { current: 200, max: 200 },
	});
}

/** Create a combat unit at the given position. */
function createUnit(
	world: ReturnType<typeof createGameWorld>,
	x: number,
	y: number,
	faction: string,
) {
	return spawnUnit(world, {
		x,
		y,
		faction,
		unitType: "militia",
		health: { current: 50, max: 50 },
	});
}

describe("engine/systems/territorySystem", () => {
	it("liberates village when garrison is cleared", () => {
		const world = makeWorld(1000);

		const villageEid = createVillage(world, 10, 10);

		// Create garrison enemies
		const guard1 = createUnit(world, 11, 10, "scale_guard");
		const guard2 = createUnit(world, 12, 10, "scale_guard");

		registerVillage(world, villageEid, [guard1, guard2]);

		// Kill all garrison units
		world.runtime.alive.delete(guard1);
		world.runtime.alive.delete(guard2);

		runTerritorySystem(world);

		// Village should now be ura faction
		expect(Faction.id[villageEid]).toBe(FACTION_IDS.ura);

		// village-liberated event should be emitted
		const liberatedEvents = world.events.filter((e) => e.type === "village-liberated");
		expect(liberatedEvents).toHaveLength(1);
		expect(liberatedEvents[0].payload?.eid).toBe(villageEid);
	});

	it("does not liberate village when garrison is still alive", () => {
		const world = makeWorld(1000);

		const villageEid = createVillage(world, 10, 10);
		const guard1 = createUnit(world, 11, 10, "scale_guard");

		registerVillage(world, villageEid, [guard1]);

		runTerritorySystem(world);

		// Village should remain scale_guard
		expect(Faction.id[villageEid]).toBe(FACTION_IDS.scale_guard);
	});

	it("recaptures village when enemy approaches and no friendlies nearby", () => {
		const world = makeWorld(1000);

		const villageEid = createVillage(world, 10, 10, "ura");

		// Register as already-liberated village
		registerVillage(world, villageEid, []);
		const runtime = world.runtime as unknown as TerritoryRuntime;
		runtime.villages![0].liberated = true;

		// Place an enemy within defense radius (5 tiles)
		createUnit(world, 12, 10, "scale_guard");

		// No friendly units nearby
		runTerritorySystem(world);

		// Village should flip back to scale_guard
		expect(Faction.id[villageEid]).toBe(FACTION_IDS.scale_guard);

		const recaptureEvents = world.events.filter((e) => e.type === "village-recaptured");
		expect(recaptureEvents).toHaveLength(1);
	});

	it("does not recapture village when friendly units defend it", () => {
		const world = makeWorld(1000);

		const villageEid = createVillage(world, 10, 10, "ura");

		registerVillage(world, villageEid, []);
		const runtime = world.runtime as unknown as TerritoryRuntime;
		runtime.villages![0].liberated = true;

		// Both enemy and friendly within defense radius
		createUnit(world, 12, 10, "scale_guard");
		createUnit(world, 11, 10, "ura");

		runTerritorySystem(world);

		// Village should remain ura
		expect(Faction.id[villageEid]).toBe(FACTION_IDS.ura);
	});

	it("heals friendly units within 3 tiles of liberated village", () => {
		const world = makeWorld(1000); // 1s

		const villageEid = createVillage(world, 10, 10, "ura");

		registerVillage(world, villageEid, []);
		const runtime = world.runtime as unknown as TerritoryRuntime;
		runtime.villages![0].liberated = true;

		// Place a damaged friendly unit within 3 tiles
		const friendly = createUnit(world, 11, 10, "ura");
		Health.current[friendly] = 30;
		Health.max[friendly] = 50;

		runTerritorySystem(world);

		// Should heal +1 HP per second = +1 HP after 1s delta
		expect(Health.current[friendly]).toBeCloseTo(31, 0);
	});

	it("does not heal beyond max HP", () => {
		const world = makeWorld(5000); // 5s

		const villageEid = createVillage(world, 10, 10, "ura");

		registerVillage(world, villageEid, []);
		const runtime = world.runtime as unknown as TerritoryRuntime;
		runtime.villages![0].liberated = true;

		// Almost full health
		const friendly = createUnit(world, 11, 10, "ura");
		Health.current[friendly] = 49;
		Health.max[friendly] = 50;

		runTerritorySystem(world);

		expect(Health.current[friendly]).toBe(50); // Capped at max
	});

	it("does not heal units outside healing radius", () => {
		const world = makeWorld(1000);

		const villageEid = createVillage(world, 10, 10, "ura");

		registerVillage(world, villageEid, []);
		const runtime = world.runtime as unknown as TerritoryRuntime;
		runtime.villages![0].liberated = true;

		// Unit outside 3-tile radius
		const farUnit = createUnit(world, 20, 20, "ura");
		Health.current[farUnit] = 30;
		Health.max[farUnit] = 50;

		runTerritorySystem(world);

		expect(Health.current[farUnit]).toBe(30); // No heal
	});

	it("does not heal enemy units", () => {
		const world = makeWorld(1000);

		const villageEid = createVillage(world, 10, 10, "ura");

		registerVillage(world, villageEid, []);
		const runtime = world.runtime as unknown as TerritoryRuntime;
		runtime.villages![0].liberated = true;

		const enemy = createUnit(world, 11, 10, "scale_guard");
		Health.current[enemy] = 30;
		Health.max[enemy] = 50;

		runTerritorySystem(world);

		expect(Health.current[enemy]).toBe(30);
	});

	it("provides passive fish income from liberated villages", () => {
		const world = makeWorld(10000); // 10s -- should trigger one income tick

		const villageEid = createVillage(world, 10, 10, "ura");

		registerVillage(world, villageEid, []);
		const runtime = world.runtime as unknown as TerritoryRuntime;
		runtime.villages![0].liberated = true;

		runTerritorySystem(world);

		// +1 fish per 10s per village
		expect(world.session.resources.fish).toBe(1);

		const incomeEvents = world.events.filter((e) => e.type === "passive-income");
		expect(incomeEvents.length).toBeGreaterThan(0);
		expect(incomeEvents[0].payload?.source).toBe("village");
	});

	it("provides scaled income for multiple liberated villages", () => {
		const world = makeWorld(10000);

		const v1 = createVillage(world, 10, 10, "ura");
		const v2 = createVillage(world, 20, 20, "ura");

		registerVillage(world, v1, []);
		registerVillage(world, v2, []);

		const runtime = world.runtime as unknown as TerritoryRuntime;
		runtime.villages![0].liberated = true;
		runtime.villages![1].liberated = true;

		runTerritorySystem(world);

		// 2 villages * 1 fish = 2 fish
		expect(world.session.resources.fish).toBe(2);
	});

	it("reveals fog around liberated village", () => {
		const world = makeWorld(1000);
		world.navigation.width = 30;
		world.navigation.height = 30;
		(world.runtime as unknown as FogRuntime).fogGrid = createFogGrid(30, 30);

		const villageEid = createVillage(world, 15, 15, "ura");

		registerVillage(world, villageEid, []);
		const runtime = world.runtime as unknown as TerritoryRuntime;
		runtime.villages![0].liberated = true;

		runTerritorySystem(world);

		const fogGrid = (world.runtime as unknown as FogRuntime).fogGrid!;
		// Center tile should be explored
		expect(fogGrid[15 * 30 + 15]).toBe(FOG_EXPLORED);
		// Edge of reveal should be explored (within 5 tiles)
		expect(fogGrid[12 * 30 + 15]).toBe(FOG_EXPLORED);
	});

	it("only reveals fog once per liberation", () => {
		const world = makeWorld(100);
		world.navigation.width = 30;
		world.navigation.height = 30;
		(world.runtime as unknown as FogRuntime).fogGrid = createFogGrid(30, 30);

		const villageEid = createVillage(world, 15, 15, "ura");
		registerVillage(world, villageEid, []);
		const runtime = world.runtime as unknown as TerritoryRuntime;
		runtime.villages![0].liberated = true;

		runTerritorySystem(world);

		// Second tick should not re-reveal (fogRevealed flag set)
		expect(runtime.villages![0].fogRevealed).toBe(true);
	});

	it("emits zone-control events for zoneRects", () => {
		const world = makeWorld(1000);

		world.runtime.zoneRects.set("zone_a", { x: 0, y: 0, width: 20, height: 20 });

		createUnit(world, 5, 5, "ura");
		createUnit(world, 6, 5, "ura");
		createUnit(world, 7, 5, "scale_guard");

		runTerritorySystem(world);

		const zoneEvents = world.events.filter((e) => e.type === "zone-control");
		expect(zoneEvents).toHaveLength(1);
		expect(zoneEvents[0].payload?.zoneId).toBe("zone_a");
		expect(zoneEvents[0].payload?.controller).toBe("ura"); // 2 ura vs 1 scale
	});

	it("resets territory state cleanly", () => {
		const world = makeWorld(0);
		const villageEid = createVillage(world, 10, 10);
		registerVillage(world, villageEid, []);

		resetTerritoryState(world);

		const runtime = world.runtime as unknown as TerritoryRuntime;
		expect(runtime.villages).toBeUndefined();
		expect(runtime.villageIncomeTimer).toBeUndefined();
	});
});
