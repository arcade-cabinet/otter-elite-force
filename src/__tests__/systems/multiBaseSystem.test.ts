/**
 * Multi-Base System Tests
 *
 * Tests for:
 * - Secondary Command Post placement and collection radius
 * - Worker deposit routing to nearest CP within collection radius
 * - Supply caravan movement between CPs
 * - Caravan resource pickup and delivery
 * - Caravan vulnerability (resource loss on death)
 * - Multi-base store tracking
 */

import { createWorld, type World } from "koota";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	CollectionRadius,
	Gatherer,
	IsCommandPost,
	ResourceNode,
	SupplyCaravan,
} from "../../ecs/traits/economy";
import { Faction, IsBuilding, UnitType } from "../../ecs/traits/identity";
import { Position } from "../../ecs/traits/spatial";
import { Health } from "../../ecs/traits/combat";
import { GatheringFrom, OwnedBy } from "../../ecs/relations";
import { initSingletons } from "../../ecs/singletons";
import { ResourcePool } from "../../ecs/traits/state";
import {
	findNearestCPInRadius,
	findNearestCPGlobal,
	canPlaceSecondaryCP,
	createSupplyCaravan,
	tickCaravans,
	tickCaravanPickup,
	tickCaravanDelivery,
	getCaravanCargo,
	multiBaseSystem,
	type CommandPostLocation,
} from "../../systems/multiBaseSystem";

let world: World;

beforeEach(() => {
	world = createWorld();
	initSingletons(world);
});

afterEach(() => {
	world.destroy();
});

// ---------------------------------------------------------------------------
// Helper: spawn a Command Post at a given position
// ---------------------------------------------------------------------------
function spawnCP(x: number, y: number, radius = 10) {
	const factionEntity = world.spawn(Faction);
	const cp = world.spawn(
		IsBuilding,
		IsCommandPost,
		UnitType,
		Position,
		Health,
		CollectionRadius,
		OwnedBy(factionEntity),
	);
	cp.set(UnitType, { type: "command_post" });
	cp.set(Position, { x, y });
	cp.set(Health, { current: 600, max: 600 });
	cp.set(CollectionRadius, { radius });
	return { cp, factionEntity };
}

// Helper: spawn a worker/gatherer at a position
function spawnWorker(x: number, y: number, factionEntity: ReturnType<World["spawn"]>) {
	const worker = world.spawn(UnitType, Position, Gatherer, OwnedBy(factionEntity));
	worker.set(UnitType, { type: "river_rat" });
	worker.set(Position, { x, y });
	return worker;
}

// Helper: spawn a resource node
function spawnResource(x: number, y: number, type = "fish", remaining = 100) {
	const node = world.spawn(Position, ResourceNode);
	node.set(Position, { x, y });
	node.set(ResourceNode, { type, remaining });
	return node;
}

// ============================================================================
// Collection Radius
// ============================================================================

describe("Collection Radius", () => {
	it("should find the nearest CP within its collection radius for a worker", () => {
		const { cp: cp1, factionEntity } = spawnCP(0, 0, 10);
		spawnCP(20, 0, 10); // second CP far away
		const worker = spawnWorker(5, 0, factionEntity);

		const nearest = findNearestCPInRadius(world, worker);
		expect(nearest).toBe(cp1);
	});

	it("should return null when worker is outside all CP collection radii", () => {
		spawnCP(0, 0, 5);
		const { factionEntity } = spawnCP(100, 0, 5);
		const worker = spawnWorker(50, 0, factionEntity);

		const nearest = findNearestCPInRadius(world, worker);
		expect(nearest).toBeNull();
	});

	it("should pick the closer CP when worker is within multiple radii", () => {
		const { factionEntity } = spawnCP(0, 0, 20);
		const { cp: cp2 } = spawnCP(8, 0, 20);
		const worker = spawnWorker(6, 0, factionEntity);

		const nearest = findNearestCPInRadius(world, worker);
		expect(nearest).toBe(cp2);
	});

	it("should fallback to global nearest when no CP has collection radius trait", () => {
		// Spawn a CP without CollectionRadius
		const factionEntity = world.spawn(Faction);
		const cp = world.spawn(
			IsBuilding,
			IsCommandPost,
			UnitType,
			Position,
			Health,
			OwnedBy(factionEntity),
		);
		cp.set(UnitType, { type: "command_post" });
		cp.set(Position, { x: 0, y: 0 });

		const worker = spawnWorker(5, 0, factionEntity);

		const nearest = findNearestCPGlobal(world, worker);
		expect(nearest).toBe(cp);
	});
});

// ============================================================================
// Secondary CP Placement
// ============================================================================

describe("Secondary CP Placement", () => {
	it("should allow placement at a valid predetermined location", () => {
		const locations: CommandPostLocation[] = [
			{ x: 10, y: 10, id: "cp_north" },
			{ x: 20, y: 20, id: "cp_south" },
		];

		expect(canPlaceSecondaryCP(world, locations, "cp_north")).toBe(true);
	});

	it("should reject placement at an invalid location id", () => {
		const locations: CommandPostLocation[] = [{ x: 10, y: 10, id: "cp_north" }];

		expect(canPlaceSecondaryCP(world, locations, "cp_invalid")).toBe(false);
	});

	it("should reject placement if a CP already exists at that location", () => {
		const locations: CommandPostLocation[] = [{ x: 10, y: 10, id: "cp_north" }];

		// Place a CP at that location
		spawnCP(10, 10);

		expect(canPlaceSecondaryCP(world, locations, "cp_north")).toBe(false);
	});
});

// ============================================================================
// Supply Caravan Creation
// ============================================================================

describe("Supply Caravan Creation", () => {
	it("should create a caravan entity with SupplyCaravan trait and route", () => {
		const { cp: cp1, factionEntity } = spawnCP(0, 0);
		const { cp: cp2 } = spawnCP(20, 0);

		const caravan = createSupplyCaravan(world, factionEntity, [cp1, cp2]);

		expect(caravan.has(SupplyCaravan)).toBe(true);
		expect(caravan.has(Position)).toBe(true);
		expect(caravan.has(Health)).toBe(true);
		expect(caravan.has(UnitType)).toBe(true);

		const data = caravan.get(SupplyCaravan);
		expect(data.route.length).toBe(2);
		expect(data.routeIndex).toBe(0);
		expect(data.carrying).toBe("");
		expect(data.amount).toBe(0);
	});

	it("should start the caravan at the position of the first CP in its route", () => {
		const { cp: cp1, factionEntity } = spawnCP(5, 10);
		const { cp: cp2 } = spawnCP(25, 10);

		const caravan = createSupplyCaravan(world, factionEntity, [cp1, cp2]);
		const pos = caravan.get(Position);
		expect(pos.x).toBe(5);
		expect(pos.y).toBe(10);
	});
});

// ============================================================================
// Caravan Movement
// ============================================================================

describe("Caravan Movement", () => {
	it("should move caravan toward the next CP in its route", () => {
		const { cp: cp1, factionEntity } = spawnCP(0, 0);
		const { cp: cp2 } = spawnCP(20, 0);

		const caravan = createSupplyCaravan(world, factionEntity, [cp1, cp2]);
		// Caravan starts at cp1 (0,0), heading to cp2 (20,0)
		const caravanData = caravan.get(SupplyCaravan);
		caravanData.routeIndex = 1; // heading to cp2

		tickCaravans(world, 1.0); // 1 second at speed 3 = 3 tiles

		const pos = caravan.get(Position);
		expect(pos.x).toBeCloseTo(3, 1);
		expect(pos.y).toBeCloseTo(0, 1);
	});

	it("should advance route index when caravan arrives at destination CP", () => {
		const { cp: cp1, factionEntity } = spawnCP(0, 0);
		const { cp: cp2 } = spawnCP(3, 0);

		const caravan = createSupplyCaravan(world, factionEntity, [cp1, cp2]);
		const caravanData = caravan.get(SupplyCaravan);
		caravanData.routeIndex = 1; // heading to cp2

		tickCaravans(world, 2.0); // 2 seconds at speed 3 = 6 tiles, more than enough

		// Should have arrived and wrapped route
		expect(caravanData.routeIndex).toBe(0); // wraps back to cp1
	});

	it("should cycle through route in a loop", () => {
		const { cp: cp1, factionEntity } = spawnCP(0, 0);
		const { cp: cp2 } = spawnCP(2, 0);

		const caravan = createSupplyCaravan(world, factionEntity, [cp1, cp2]);
		const caravanData = caravan.get(SupplyCaravan);
		caravanData.routeIndex = 1;

		// Move enough to arrive at cp2
		tickCaravans(world, 2.0);
		expect(caravanData.routeIndex).toBe(0); // wrapped to cp1

		// Move again toward cp1
		tickCaravans(world, 2.0);
		expect(caravanData.routeIndex).toBe(1); // wrapped back to cp2
	});
});

// ============================================================================
// Caravan Pickup & Delivery
// ============================================================================

describe("Caravan Pickup & Delivery", () => {
	it("should pick up resources from the CP stockpile when arriving at source CP", () => {
		const { cp: cp1, factionEntity } = spawnCP(0, 0);
		const { cp: cp2 } = spawnCP(20, 0);

		// Seed the global resource pool with fish
		world.set(ResourcePool, { fish: 50, timber: 0, salvage: 0 });

		const caravan = createSupplyCaravan(world, factionEntity, [cp1, cp2]);
		const caravanData = caravan.get(SupplyCaravan);

		// Simulate arriving at cp1 (source) — pick up fish
		tickCaravanPickup(caravanData, "fish", 50);

		expect(caravanData.carrying).toBe("fish");
		expect(caravanData.amount).toBe(20); // capacity is 20
	});

	it("should pick up only available amount if less than capacity", () => {
		const { cp: cp1, factionEntity } = spawnCP(0, 0);
		spawnCP(20, 0);

		const caravan = createSupplyCaravan(world, factionEntity, [cp1]);
		const caravanData = caravan.get(SupplyCaravan);

		tickCaravanPickup(caravanData, "timber", 8);

		expect(caravanData.carrying).toBe("timber");
		expect(caravanData.amount).toBe(8); // only 8 available
	});

	it("should deposit resources at the destination CP", () => {
		const { factionEntity } = spawnCP(0, 0);
		spawnCP(20, 0);

		const caravan = world.spawn(UnitType, Position, Health, SupplyCaravan, OwnedBy(factionEntity));
		const caravanData = caravan.get(SupplyCaravan);
		caravanData.carrying = "fish";
		caravanData.amount = 15;

		tickCaravanDelivery(caravanData, world);

		expect(caravanData.carrying).toBe("");
		expect(caravanData.amount).toBe(0);

		// Resources should be deposited to the world ResourcePool
		expect(world.get(ResourcePool)!.fish).toBe(15);
	});

	it("should not pick up if caravan already carrying resources", () => {
		const { factionEntity } = spawnCP(0, 0);

		const caravan = world.spawn(UnitType, Position, Health, SupplyCaravan, OwnedBy(factionEntity));
		const caravanData = caravan.get(SupplyCaravan);
		caravanData.carrying = "fish";
		caravanData.amount = 10;

		tickCaravanPickup(caravanData, "timber", 50);

		// Should still be carrying fish, not timber
		expect(caravanData.carrying).toBe("fish");
		expect(caravanData.amount).toBe(10);
	});
});

// ============================================================================
// Caravan Vulnerability
// ============================================================================

describe("Caravan Vulnerability", () => {
	it("should lose all carried resources when caravan is killed", () => {
		const { cp: cp1, factionEntity } = spawnCP(0, 0);
		const { cp: cp2 } = spawnCP(20, 0);

		world.set(ResourcePool, { fish: 100, timber: 0, salvage: 0 });

		const caravan = createSupplyCaravan(world, factionEntity, [cp1, cp2]);
		const caravanData = caravan.get(SupplyCaravan);
		caravanData.carrying = "fish";
		caravanData.amount = 20;

		// Deduct from pool to simulate pickup
		world.set(ResourcePool, { fish: 80, timber: 0, salvage: 0 });
		expect(world.get(ResourcePool)!.fish).toBe(80);

		// Cargo query should report 20 fish
		expect(getCaravanCargo(caravan)).toEqual({ type: "fish", amount: 20 });

		// Kill the caravan
		caravan.set(Health, { current: 0, max: 50 });

		// Caravan still has the cargo data, but it's "lost" — system should clean up
		// The resources are gone from the pool and NOT delivered
		expect(world.get(ResourcePool)!.fish).toBe(80);
	});

	it("should return zero cargo for an empty caravan", () => {
		const { factionEntity } = spawnCP(0, 0);
		const caravan = createSupplyCaravan(world, factionEntity, []);
		expect(getCaravanCargo(caravan)).toEqual({ type: "", amount: 0 });
	});
});

// ============================================================================
// Full System Tick
// ============================================================================

describe("multiBaseSystem integration", () => {
	it("should process caravan movement and delivery in a single tick", () => {
		const { cp: cp1, factionEntity } = spawnCP(0, 0);
		const { cp: cp2 } = spawnCP(2, 0);

		world.set(ResourcePool, { fish: 50, timber: 0, salvage: 0 });

		const caravan = createSupplyCaravan(world, factionEntity, [cp1, cp2]);
		const caravanData = caravan.get(SupplyCaravan);

		// Manually load cargo and set heading to cp2
		caravanData.carrying = "fish";
		caravanData.amount = 15;
		caravanData.routeIndex = 1;

		// Tick enough to arrive at cp2 (2 tiles at speed 3 = ~0.67s)
		multiBaseSystem(world, 1.0);

		// Should have arrived and delivered
		expect(caravanData.amount).toBe(0);
		expect(caravanData.carrying).toBe("");
		expect(world.get(ResourcePool)!.fish).toBe(65); // 50 + 15
	});

	it("should skip dead caravans", () => {
		const { cp: cp1, factionEntity } = spawnCP(0, 0);
		const { cp: cp2 } = spawnCP(20, 0);

		const caravan = createSupplyCaravan(world, factionEntity, [cp1, cp2]);
		const caravanData = caravan.get(SupplyCaravan);
		caravanData.routeIndex = 1;

		caravan.set(Health, { current: 0, max: 50 });

		const posBefore = { ...caravan.get(Position) };
		multiBaseSystem(world, 1.0);
		const posAfter = caravan.get(Position);

		// Dead caravan should not move
		expect(posAfter.x).toBe(posBefore.x);
		expect(posAfter.y).toBe(posBefore.y);
	});

	it("should handle caravan with destroyed destination CP gracefully", () => {
		const { cp: cp1, factionEntity } = spawnCP(0, 0);
		const { cp: cp2 } = spawnCP(20, 0);

		const caravan = createSupplyCaravan(world, factionEntity, [cp1, cp2]);
		const caravanData = caravan.get(SupplyCaravan);
		caravanData.routeIndex = 1;

		// Destroy cp2
		cp2.set(Health, { current: 0, max: 600 });

		// System should skip and advance to next valid CP
		multiBaseSystem(world, 1.0);

		// Should have skipped to next route point (cp1)
		expect(caravanData.routeIndex).toBe(0);
	});

	it("should handle multiple caravans independently", () => {
		const { cp: cp1, factionEntity } = spawnCP(0, 0);
		const { cp: cp2 } = spawnCP(10, 0);

		const caravan1 = createSupplyCaravan(world, factionEntity, [cp1, cp2]);
		const caravan2 = createSupplyCaravan(world, factionEntity, [cp2, cp1]);

		const data1 = caravan1.get(SupplyCaravan);
		const data2 = caravan2.get(SupplyCaravan);
		data1.routeIndex = 1; // heading to cp2
		data2.routeIndex = 1; // heading to cp1

		multiBaseSystem(world, 1.0);

		const pos1 = caravan1.get(Position);
		const pos2 = caravan2.get(Position);

		// Caravan1 should have moved right (toward cp2 at 10,0)
		expect(pos1.x).toBeGreaterThan(0);
		// Caravan2 should have moved left (toward cp1 at 0,0) — started at cp2 (10,0)
		expect(pos2.x).toBeLessThan(10);
	});
});
