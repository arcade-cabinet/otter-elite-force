/**
 * Integration Tests — End-to-end gameplay loops (US-002, US-003, US-004, US-005).
 *
 * These tests validate that multiple ECS systems work together correctly
 * when ticked in sequence, proving the core gameplay loops function end-to-end.
 */
import { createWorld, type World } from "koota";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ConstructingAt, GatheringFrom, OwnedBy, Targeting } from "../../ecs/relations";
import { initSingletons } from "../../ecs/singletons";
import { AIState } from "../../ecs/traits/ai";
import { Armor, Attack, Health, VisionRadius } from "../../ecs/traits/combat";
import {
	ConstructionProgress,
	Gatherer,
	ProductionQueue,
	ResourceNode,
} from "../../ecs/traits/economy";
import { Faction, IsBuilding, IsResource, UnitType } from "../../ecs/traits/identity";
import { OrderQueue, RallyPoint } from "../../ecs/traits/orders";
import { Position } from "../../ecs/traits/spatial";
import { CampaignProgress, PopulationState, ResourcePool } from "../../ecs/traits/state";
import { buildingSystem } from "../../systems/buildingSystem";
import {
	aggroSystem,
	combatSystem,
	deathSystem,
	projectileSystem,
} from "../../systems/combatSystem";
import { economySystem, resetFishTrapTimer } from "../../systems/economySystem";
import { orderSystem } from "../../systems/orderSystem";
import { productionSystem } from "../../systems/productionSystem";

// ---------------------------------------------------------------------------
// Test world setup
// ---------------------------------------------------------------------------

let world: World;
let uraFaction: ReturnType<World["spawn"]>;

beforeEach(() => {
	world = createWorld();
	initSingletons(world);
	// Set starting resources for building/training
	world.set(ResourcePool, { fish: 200, timber: 200, salvage: 200 });
	world.set(PopulationState, { current: 0, max: 30 });
	// Set tactical difficulty (1.0x baseline) so tests are unaffected by scaling
	world.set(CampaignProgress, { missions: {}, currentMission: null, difficulty: "tactical" });
	uraFaction = world.spawn(Faction({ id: "ura" }));
	resetFishTrapTimer();
});

afterEach(() => {
	world.reset();
});

// ---------------------------------------------------------------------------
// US-002: End-to-end gather loop
// ---------------------------------------------------------------------------

describe("US-002: Gather loop integration", () => {
	it("should complete a full gather cycle: approach → harvest → deposit", () => {
		// Command Post at origin
		world.spawn(
			IsBuilding,
			UnitType({ type: "command_post" }),
			Position({ x: 0, y: 0 }),
			Faction({ id: "ura" }),
			OwnedBy(uraFaction),
		);

		// Resource node very close to worker
		const fishSpot = world.spawn(
			IsResource,
			Position({ x: 3, y: 0 }),
			ResourceNode({ type: "fish", remaining: 100 }),
		);

		// Worker at the resource node (within gather range)
		const worker = world.spawn(
			Position({ x: 3, y: 0 }),
			Gatherer({ carrying: "", amount: 0, capacity: 10 }),
			GatheringFrom(fishSpot),
			Faction({ id: "ura" }),
			OwnedBy(uraFaction),
		);

		// Phase 1: Gather until full (rate = delta * 5, so 0.5s * 5 = 2.5 per tick)
		for (let i = 0; i < 10; i++) {
			economySystem(world, 0.5);
		}

		const gatherer = worker.get(Gatherer);
		expect(gatherer.carrying).toBe("fish");
		// Worker should be full (10 capacity) or heading to deposit
		expect(gatherer.amount).toBeLessThanOrEqual(10);

		// Phase 2: Worker walks to Command Post and deposits
		// Simulate many ticks for movement + deposit
		for (let i = 0; i < 200; i++) {
			economySystem(world, 0.1);
		}

		const pool = world.get(ResourcePool)!;
		expect(pool.fish).toBeGreaterThan(200); // Starting 200 + deposited
	});

	it("should deplete resource nodes over time", () => {
		const node = world.spawn(
			IsResource,
			Position({ x: 5, y: 5 }),
			ResourceNode({ type: "timber", remaining: 15 }),
		);

		world.spawn(
			Position({ x: 5, y: 5 }),
			Gatherer({ carrying: "", amount: 0, capacity: 10 }),
			GatheringFrom(node),
		);

		// Gather for several seconds
		for (let i = 0; i < 20; i++) {
			economySystem(world, 0.5);
		}

		const nodeData = node.get(ResourceNode);
		expect(nodeData.remaining).toBeLessThan(15);
	});

	it("should generate passive income from Fish Traps concurrently", () => {
		world.spawn(IsBuilding, UnitType({ type: "fish_trap" }), OwnedBy(uraFaction));
		world.spawn(IsBuilding, UnitType({ type: "fish_trap" }), OwnedBy(uraFaction));

		// Tick 10+ seconds for passive income
		for (let i = 0; i < 20; i++) {
			economySystem(world, 0.5);
		}

		// 2 traps × 3 fish per 10s = 6 fish
		expect(world.get(ResourcePool)!.fish).toBe(200 + 6);
	});
});

// ---------------------------------------------------------------------------
// US-003: End-to-end build loop
// ---------------------------------------------------------------------------

describe("US-003: Build loop integration", () => {
	it("should complete construction when worker is near an incomplete building", () => {
		// Spawn an incomplete building
		const building = world.spawn(
			IsBuilding,
			UnitType({ type: "barracks" }),
			Position({ x: 5, y: 5 }),
			Health({ current: 500, max: 500 }),
			Armor({ value: 2 }),
			Faction({ id: "ura" }),
			ConstructionProgress({ progress: 0, buildTime: 10 }),
			OwnedBy(uraFaction),
		);

		// Worker right next to the building with ConstructingAt relation
		const worker = world.spawn(
			Position({ x: 5, y: 5 }),
			Faction({ id: "ura" }),
			OrderQueue,
			AIState({ state: "building", target: null, alertLevel: 0 }),
			ConstructingAt(building),
		);

		// Tick buildingSystem for 10 seconds (should reach 100%)
		for (let i = 0; i < 100; i++) {
			buildingSystem(world, 0.1);
		}

		// Building should be complete (ConstructionProgress removed)
		expect(building.has(ConstructionProgress)).toBe(false);
	});

	it("should activate building on completion (add ProductionQueue for training buildings)", () => {
		const building = world.spawn(
			IsBuilding,
			UnitType({ type: "barracks" }),
			Position({ x: 5, y: 5 }),
			Health({ current: 500, max: 500 }),
			Armor({ value: 2 }),
			Faction({ id: "ura" }),
			ConstructionProgress({ progress: 95, buildTime: 10 }),
			OwnedBy(uraFaction),
		);

		world.spawn(
			Position({ x: 5, y: 5 }),
			ConstructingAt(building),
		);

		// One tick should push past 100%
		buildingSystem(world, 1);

		// Barracks should now have a production queue
		expect(building.has(ProductionQueue)).toBe(true);
		expect(building.has(RallyPoint)).toBe(true);
	});

	it("should complete full build cycle: placement → construction → activation", () => {
		// Spawn an incomplete building at (5,5)
		const building = world.spawn(
			IsBuilding,
			UnitType({ type: "barracks" }),
			Position({ x: 5, y: 5 }),
			Health({ current: 500, max: 500 }),
			Armor({ value: 2 }),
			Faction({ id: "ura" }),
			ConstructionProgress({ progress: 0, buildTime: 5 }),
			OwnedBy(uraFaction),
		);

		// Worker at the build site with ConstructingAt already set
		world.spawn(
			Position({ x: 5, y: 5 }),
			Faction({ id: "ura" }),
			ConstructingAt(building),
		);

		// Tick buildingSystem until complete
		for (let i = 0; i < 60; i++) {
			buildingSystem(world, 0.1);
		}

		// Building should be complete and activated
		expect(building.has(ConstructionProgress)).toBe(false);
		expect(building.has(ProductionQueue)).toBe(true);
		expect(building.has(RallyPoint)).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// US-004: End-to-end train loop
// ---------------------------------------------------------------------------

describe("US-004: Train loop integration", () => {
	it("should train a unit and spawn it at the building", () => {
		// Complete barracks with production queue
		const barracks = world.spawn(
			IsBuilding,
			UnitType({ type: "barracks" }),
			Position({ x: 5, y: 5 }),
			Health({ current: 500, max: 500 }),
			Faction({ id: "ura" }),
			ProductionQueue,
			RallyPoint({ x: 7, y: 5 }),
			OwnedBy(uraFaction),
		);

		// Manually queue a unit (mimicking what queueUnit() does)
		const queue = barracks.get(ProductionQueue)!;
		queue.push({ unitType: "mudfoot", progress: 0, buildTime: 5 });

		// Count entities before training
		const unitsBefore = world.query(Position, Faction).length;

		// Tick production for 5+ seconds
		for (let i = 0; i < 60; i++) {
			productionSystem(world, 0.1);
		}

		// Queue should be empty (unit trained)
		expect(barracks.get(ProductionQueue)!.length).toBe(0);

		// New entity should have been spawned
		const unitsAfter = world.query(Position, Faction).length;
		expect(unitsAfter).toBeGreaterThan(unitsBefore);
	});

	it("should respect population cap when queueing units", async () => {
		world.set(PopulationState, { current: 29, max: 30 });

		const barracks = world.spawn(
			IsBuilding,
			UnitType({ type: "barracks" }),
			Position({ x: 5, y: 5 }),
			Health({ current: 500, max: 500 }),
			Faction({ id: "ura" }),
			ProductionQueue,
			RallyPoint({ x: 7, y: 5 }),
			OwnedBy(uraFaction),
		);

		const { queueUnit } = await import("../../systems/productionSystem");
		const result1 = queueUnit(barracks, "mudfoot", world);
		expect(result1).toBe(true); // Should succeed (29 + 1 = 30)

		const result2 = queueUnit(barracks, "mudfoot", world);
		expect(result2).toBe(false); // Should fail (30 + 1 > 30)
	});

	it("should deduct resources when queueing a unit", async () => {
		// Mudfoot costs 80 fish + 20 salvage
		world.set(ResourcePool, { fish: 100, timber: 50, salvage: 50 });

		const barracks = world.spawn(
			IsBuilding,
			UnitType({ type: "barracks" }),
			Position({ x: 5, y: 5 }),
			Health({ current: 500, max: 500 }),
			Faction({ id: "ura" }),
			ProductionQueue,
			RallyPoint({ x: 7, y: 5 }),
			OwnedBy(uraFaction),
		);

		const { queueUnit } = await import("../../systems/productionSystem");
		const result = queueUnit(barracks, "mudfoot", world);
		expect(result).toBe(true);

		const pool = world.get(ResourcePool)!;
		// Fish should be 100 - 80 = 20, salvage should be 50 - 20 = 30
		expect(pool.fish).toBe(20);
		expect(pool.salvage).toBe(30);
	});
});

// ---------------------------------------------------------------------------
// US-005: End-to-end combat loop
// ---------------------------------------------------------------------------

describe("US-005: Combat loop integration", () => {
	it("should deal melee damage when attacker is in range of target", () => {
		const attacker = world.spawn(
			Position({ x: 0, y: 0 }),
			Faction({ id: "ura" }),
			Attack({ damage: 10, range: 1, cooldown: 0.5, timer: 0 }),
			Health({ current: 100, max: 100 }),
		);

		const target = world.spawn(
			Position({ x: 0.5, y: 0 }),
			Faction({ id: "scale_guard" }),
			Health({ current: 50, max: 50 }),
			Armor({ value: 2 }),
		);

		// Set targeting relation
		attacker.add(Targeting(target));

		// Tick combat — should apply damage on first tick (timer starts at 0)
		combatSystem(world, 0.5);

		const targetHealth = target.get(Health)!;
		// Damage = max(1, 10 - 2) = 8
		expect(targetHealth.current).toBe(42);
	});

	it("should spawn projectiles for ranged attacks", () => {
		world.spawn(
			Position({ x: 0, y: 0 }),
			Faction({ id: "ura" }),
			Attack({ damage: 15, range: 5, cooldown: 1, timer: 0 }),
			Health({ current: 100, max: 100 }),
			Targeting(
				world.spawn(
					Position({ x: 3, y: 0 }),
					Faction({ id: "scale_guard" }),
					Health({ current: 80, max: 80 }),
				),
			),
		);

		const projectilesBefore = world.query(Position).length;

		combatSystem(world, 1);

		// A projectile should have been spawned
		const projectilesAfter = world.query(Position).length;
		expect(projectilesAfter).toBeGreaterThan(projectilesBefore);
	});

	it("should auto-acquire targets via aggroSystem", () => {
		const uraUnit = world.spawn(
			Position({ x: 0, y: 0 }),
			Faction({ id: "ura" }),
			Attack({ damage: 10, range: 1, cooldown: 1, timer: 0 }),
			Health({ current: 100, max: 100 }),
			VisionRadius({ radius: 5 }),
		);

		world.spawn(
			Position({ x: 3, y: 0 }),
			Faction({ id: "scale_guard" }),
			Health({ current: 50, max: 50 }),
		);

		// Run aggro system — should auto-target the nearby enemy
		aggroSystem(world);

		expect(uraUnit.has(Targeting("*"))).toBe(true);
	});

	it("should destroy dead entities via deathSystem", () => {
		const deadUnit = world.spawn(
			Position({ x: 0, y: 0 }),
			Health({ current: 0, max: 50 }),
			Faction({ id: "scale_guard" }),
		);

		const attacker = world.spawn(
			Position({ x: 1, y: 0 }),
			Attack({ damage: 10, range: 1, cooldown: 1, timer: 0 }),
			Targeting(deadUnit),
		);

		const dead = deathSystem(world);

		expect(dead.length).toBe(1);
		// Targeting should be cleared
		expect(attacker.has(Targeting("*"))).toBe(false);
	});

	it("should complete a full combat cycle: aggro → attack → death", () => {
		const uraUnit = world.spawn(
			Position({ x: 0, y: 0 }),
			Faction({ id: "ura" }),
			Attack({ damage: 50, range: 1, cooldown: 0.1, timer: 0 }),
			Health({ current: 100, max: 100 }),
			VisionRadius({ radius: 5 }),
		);

		const enemy = world.spawn(
			Position({ x: 0.5, y: 0 }),
			Faction({ id: "scale_guard" }),
			Health({ current: 20, max: 20 }),
		);

		// Tick the combat pipeline: aggro → combat → projectile → death
		aggroSystem(world);
		combatSystem(world, 0.1);
		projectileSystem(world, 0.1);
		deathSystem(world);

		// Enemy should be dead (50 damage > 20 HP)
		expect(enemy.isAlive()).toBe(false);

		// Targeting should be cleared
		expect(uraUnit.has(Targeting("*"))).toBe(false);
	});

	it("should move projectiles toward target and deal damage on arrival", () => {
		const target = world.spawn(
			Position({ x: 10, y: 0 }),
			Faction({ id: "scale_guard" }),
			Health({ current: 80, max: 80 }),
		);

		const ranged = world.spawn(
			Position({ x: 0, y: 0 }),
			Faction({ id: "ura" }),
			Attack({ damage: 20, range: 12, cooldown: 1, timer: 0 }),
			Health({ current: 100, max: 100 }),
			Targeting(target),
		);

		// Spawn projectile via combat tick
		combatSystem(world, 1);

		// Advance projectile over several ticks
		for (let i = 0; i < 50; i++) {
			projectileSystem(world, 0.1);
		}

		// Target should have taken damage (projectile arrived)
		const hp = target.get(Health)!;
		expect(hp.current).toBeLessThan(80);
	});
});
