/**
 * US-085: Browser tests — gather, combat, building, training loops
 *
 * Integration tests running in real Chromium via Vitest browser mode.
 * Exercises the ECS systems in a browser environment to verify the
 * core gameplay loops function end-to-end with real DOM and canvas.
 *
 * - worker gathers -> deposit -> ResourcePool increases
 * - unit attacks -> enemy dies
 * - building placed -> construction -> complete
 * - unit queued -> produced -> spawned
 */
import { createWorld, type World } from "koota";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ConstructingAt, GatheringFrom, OwnedBy, Targeting } from "@/ecs/relations";
import { initSingletons } from "@/ecs/singletons";
import { AIState } from "@/ecs/traits/ai";
import { Armor, Attack, Health, VisionRadius } from "@/ecs/traits/combat";
import {
	ConstructionProgress,
	Gatherer,
	ProductionQueue,
	ResourceNode,
} from "@/ecs/traits/economy";
import { Faction, IsBuilding, IsResource, UnitType } from "@/ecs/traits/identity";
import { OrderQueue, RallyPoint } from "@/ecs/traits/orders";
import { Position } from "@/ecs/traits/spatial";
import { CampaignProgress, PopulationState, ResourcePool } from "@/ecs/traits/state";
import { buildingSystem } from "@/systems/buildingSystem";
import { combatSystem, deathSystem } from "@/systems/combatSystem";
import { economySystem, resetFishTrapTimer } from "@/systems/economySystem";
import { productionSystem, queueUnit } from "@/systems/productionSystem";

// ---------------------------------------------------------------------------
// Shared setup
// ---------------------------------------------------------------------------

let world: World;
let uraFaction: ReturnType<World["spawn"]>;

beforeEach(() => {
	world = createWorld();
	initSingletons(world);
	world.set(ResourcePool, { fish: 200, timber: 200, salvage: 200 });
	world.set(PopulationState, { current: 0, max: 30 });
	world.set(CampaignProgress, { missions: {}, currentMission: null, difficulty: "tactical" });
	uraFaction = world.spawn(Faction({ id: "ura" }));
	resetFishTrapTimer();
});

afterEach(() => {
	world.reset();
});

// ---------------------------------------------------------------------------
// Browser test: worker gathers -> deposit -> ResourcePool increases
// ---------------------------------------------------------------------------

describe("Browser: Gather loop", () => {
	it("worker gathers fish and deposits to increase ResourcePool", () => {
		// Command Post at origin
		world.spawn(
			IsBuilding,
			UnitType({ type: "command_post" }),
			Position({ x: 0, y: 0 }),
			Faction({ id: "ura" }),
			OwnedBy(uraFaction),
		);

		// Resource node close to worker
		const fishSpot = world.spawn(
			IsResource,
			Position({ x: 3, y: 0 }),
			ResourceNode({ type: "fish", remaining: 100 }),
		);

		// Worker at the resource node
		world.spawn(
			Position({ x: 3, y: 0 }),
			Gatherer({ carrying: "", amount: 0, capacity: 10 }),
			GatheringFrom(fishSpot),
			Faction({ id: "ura" }),
			OwnedBy(uraFaction),
		);

		const initialFish = world.get(ResourcePool)!.fish;

		// Phase 1: Gather until full
		for (let i = 0; i < 10; i++) {
			economySystem(world, 0.5);
		}

		// Phase 2: Movement and deposit cycles
		for (let i = 0; i < 200; i++) {
			economySystem(world, 0.1);
		}

		// ResourcePool should have increased
		const finalFish = world.get(ResourcePool)!.fish;
		expect(finalFish).toBeGreaterThan(initialFish);
	});
});

// ---------------------------------------------------------------------------
// Browser test: unit attacks -> enemy dies
// ---------------------------------------------------------------------------

describe("Browser: Combat loop", () => {
	it("unit attacks enemy until enemy dies", () => {
		const attacker = world.spawn(
			Position({ x: 0, y: 0 }),
			Faction({ id: "ura" }),
			Attack({ damage: 25, range: 1, cooldown: 0.5, timer: 0 }),
			Health({ current: 100, max: 100 }),
		);

		const target = world.spawn(
			Position({ x: 0.5, y: 0 }),
			Faction({ id: "scale_guard" }),
			Health({ current: 30, max: 30 }),
			Armor({ value: 0 }),
		);

		// Set targeting
		attacker.add(Targeting(target));

		// Tick combat until target HP drops to 0 or below
		for (let i = 0; i < 20; i++) {
			combatSystem(world, 0.5);
			deathSystem(world, 0.5);
		}

		// Target should be dead (entity destroyed by deathSystem or HP <= 0)
		const targetHealth = target.isAlive() ? target.get(Health) : null;
		if (targetHealth) {
			expect(targetHealth.current).toBeLessThanOrEqual(0);
		} else {
			// Entity was destroyed by deathSystem — this is the expected path
			expect(target.isAlive()).toBe(false);
		}
	});

	it("combat respects armor reducing damage", () => {
		const attacker = world.spawn(
			Position({ x: 0, y: 0 }),
			Faction({ id: "ura" }),
			Attack({ damage: 10, range: 1, cooldown: 1.0, timer: 0 }),
			Health({ current: 80, max: 80 }),
		);

		const defender = world.spawn(
			Position({ x: 1, y: 0 }),
			Faction({ id: "scale_guard" }),
			Health({ current: 120, max: 120 }),
			Armor({ value: 4 }),
		);

		attacker.add(Targeting(defender));
		combatSystem(world, 1.1);

		const defenderHealth = defender.get(Health)!;
		// damage = max(1, 10 - 4) = 6
		expect(defenderHealth.current).toBe(114);
	});
});

// ---------------------------------------------------------------------------
// Browser test: building placed -> construction -> complete
// ---------------------------------------------------------------------------

describe("Browser: Building loop", () => {
	it("building construction progresses to completion", () => {
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

		// Worker at the build site
		world.spawn(
			Position({ x: 5, y: 5 }),
			Faction({ id: "ura" }),
			ConstructingAt(building),
		);

		// Tick building system for enough time to complete
		for (let i = 0; i < 60; i++) {
			buildingSystem(world, 0.1);
		}

		// Building should be complete (ConstructionProgress removed)
		expect(building.has(ConstructionProgress)).toBe(false);
		// Should have gained production capability
		expect(building.has(ProductionQueue)).toBe(true);
		expect(building.has(RallyPoint)).toBe(true);
	});

	it("building gains production capabilities on completion", () => {
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

		buildingSystem(world, 1);

		expect(building.has(ProductionQueue)).toBe(true);
		expect(building.has(RallyPoint)).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Browser test: unit queued -> produced -> spawned
// ---------------------------------------------------------------------------

describe("Browser: Training loop", () => {
	it("unit queued at barracks is produced and spawned", () => {
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

		// Queue a mudfoot
		const result = queueUnit(barracks, "mudfoot", world);
		expect(result).toBe(true);

		// Count entities before production
		const unitsBefore = world.query(Position, Faction).length;

		// Tick production until complete (mudfoot buildTime varies, allow generous time)
		for (let i = 0; i < 200; i++) {
			productionSystem(world, 0.1);
		}

		// Queue should be empty
		expect(barracks.get(ProductionQueue)!.length).toBe(0);

		// New entity should exist
		const unitsAfter = world.query(Position, Faction).length;
		expect(unitsAfter).toBeGreaterThan(unitsBefore);
	});

	it("production deducts resources from ResourcePool", () => {
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

		const result = queueUnit(barracks, "mudfoot", world);
		expect(result).toBe(true);

		const pool = world.get(ResourcePool)!;
		// Mudfoot costs 80 fish + 20 salvage
		expect(pool.fish).toBe(20);
		expect(pool.salvage).toBe(30);
	});

	it("respects population cap", () => {
		world.set(PopulationState, { current: 30, max: 30 });

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

		const result = queueUnit(barracks, "mudfoot", world);
		expect(result).toBe(false); // Should fail — at pop cap
	});
});
