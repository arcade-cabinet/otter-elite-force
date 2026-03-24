/**
 * Tests for the Save/Load System.
 *
 * Verifies:
 * - serializeWorld captures all serializable traits and relations
 * - deserializeWorld recreates entities with correct trait values
 * - Round-trip: spawn → serialize → reset → deserialize → verify
 * - Non-serializable traits (PhaserSprite, SteeringAgent) are skipped
 * - Relations (Targeting, GatheringFrom, OwnedBy) survive round-trip
 *
 * NOTE: Koota has a 16-world limit, so we reuse the same world via
 * world.reset() instead of creating new worlds for deserialization.
 */
import { createWorld, type World } from "koota";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AIState, SteeringAgent } from "../../ecs/traits/ai";
import { Attack, Armor, Health, VisionRadius } from "../../ecs/traits/combat";
import { Gatherer, ResourceNode, ConstructionProgress } from "../../ecs/traits/economy";
import {
	Faction,
	IsBuilding,
	IsHero,
	IsProjectile,
	IsResource,
	IsSiphon,
	IsVillage,
	UnitType,
	Selected,
} from "../../ecs/traits/identity";
import { OrderQueue } from "../../ecs/traits/orders";
import { Position, Velocity, FacingDirection } from "../../ecs/traits/spatial";
import { Concealed, Crouching, DetectionRadius } from "../../ecs/traits/stealth";
import { CanSwim, Submerged } from "../../ecs/traits/water";
import { Targeting, GatheringFrom, OwnedBy } from "../../ecs/relations";
import {
	serializeWorld,
	deserializeWorld,
	type SerializedWorld,
} from "../../systems/saveLoadSystem";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let world: World;

beforeEach(() => {
	world = createWorld();
});

afterEach(() => {
	world.destroy();
});

/** Helper: count non-world entities (world entity has id 0). */
function gameEntityCount(w: World): number {
	return w.entities.filter((e) => e.id() !== 0).length;
}

// ---------------------------------------------------------------------------
// serializeWorld
// ---------------------------------------------------------------------------

describe("saveLoadSystem — serializeWorld", () => {
	it("should serialize entities with SoA traits", () => {
		world.spawn(
			Position({ x: 5, y: 10 }),
			Health({ current: 80, max: 100 }),
			Faction({ id: "ura" }),
			UnitType({ type: "mudfoot" }),
		);

		const data = serializeWorld(world);
		expect(data.entities).toHaveLength(1);

		const e = data.entities[0];
		expect(e.traits.Position).toEqual({ x: 5, y: 10 });
		expect(e.traits.Health).toEqual({ current: 80, max: 100 });
		expect(e.traits.Faction).toEqual({ id: "ura" });
		expect(e.traits.UnitType).toEqual({ type: "mudfoot" });
	});

	it("should serialize tag traits as empty objects", () => {
		world.spawn(IsBuilding, IsResource, Position({ x: 0, y: 0 }));

		const data = serializeWorld(world);
		expect(data.entities[0].tags).toContain("IsBuilding");
		expect(data.entities[0].tags).toContain("IsResource");
	});

	it("should serialize AoS traits (OrderQueue, AIState)", () => {
		const entity = world.spawn(OrderQueue, AIState, Position({ x: 0, y: 0 }));
		const queue = entity.get(OrderQueue);
		queue.push({ type: "move", targetX: 10, targetY: 5 });
		entity.set(AIState, { state: "moving", target: null, alertLevel: 0 });

		const data = serializeWorld(world);
		const e = data.entities[0];
		expect(e.traits.OrderQueue).toEqual([{ type: "move", targetX: 10, targetY: 5 }]);
		expect(e.traits.AIState).toEqual({ state: "moving", target: null, alertLevel: 0 });
	});

	it("should skip PhaserSprite and SteeringAgent traits", () => {
		world.spawn(Position({ x: 0, y: 0 }), SteeringAgent);

		const data = serializeWorld(world);
		const e = data.entities[0];
		expect(e.traits).not.toHaveProperty("SteeringAgent");
		expect(e.traits).not.toHaveProperty("PhaserSprite");
	});

	it("should serialize multiple entities", () => {
		world.spawn(Position({ x: 1, y: 2 }), UnitType({ type: "mudfoot" }));
		world.spawn(Position({ x: 3, y: 4 }), UnitType({ type: "gator" }));
		world.spawn(Position({ x: 5, y: 6 }), IsBuilding);

		const data = serializeWorld(world);
		expect(data.entities).toHaveLength(3);
	});
});

// ---------------------------------------------------------------------------
// serializeWorld — Relations
// ---------------------------------------------------------------------------

describe("saveLoadSystem — Relation serialization", () => {
	it("should serialize Targeting relation", () => {
		const enemy = world.spawn(
			Position({ x: 10, y: 10 }),
			Health({ current: 100, max: 100 }),
			Faction({ id: "scale_guard" }),
		);
		const unit = world.spawn(
			Position({ x: 0, y: 0 }),
			Attack({ damage: 10, range: 1, cooldown: 1, timer: 0 }),
			Faction({ id: "ura" }),
		);
		unit.add(Targeting(enemy));

		const data = serializeWorld(world);
		const unitData = data.entities.find((e) => e.traits.Attack);
		expect(unitData?.relations).toHaveLength(1);
		expect(unitData?.relations[0].type).toBe("Targeting");
		expect(unitData?.relations[0].targetEntityIndex).toBeTypeOf("number");
	});

	it("should serialize GatheringFrom relation", () => {
		const resource = world.spawn(
			Position({ x: 5, y: 5 }),
			IsResource,
			ResourceNode({ type: "fish", remaining: 100 }),
		);
		const gatherer = world.spawn(
			Position({ x: 0, y: 0 }),
			Gatherer({ carrying: "fish", amount: 5, capacity: 10 }),
		);
		gatherer.add(GatheringFrom(resource));

		const data = serializeWorld(world);
		const gathererData = data.entities.find((e) => e.traits.Gatherer);
		expect(gathererData?.relations.some((r) => r.type === "GatheringFrom")).toBe(true);
	});

	it("should serialize OwnedBy relation", () => {
		const factionEntity = world.spawn(Faction({ id: "ura" }));
		const building = world.spawn(
			Position({ x: 0, y: 0 }),
			IsBuilding,
			UnitType({ type: "command_post" }),
		);
		building.add(OwnedBy(factionEntity));

		const data = serializeWorld(world);
		const buildingData = data.entities.find((e) => e.tags.includes("IsBuilding"));
		expect(buildingData?.relations.some((r) => r.type === "OwnedBy")).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// deserializeWorld (using world.reset() to stay within Koota's 16-world limit)
// ---------------------------------------------------------------------------

describe("saveLoadSystem — deserializeWorld", () => {
	it("should recreate entities from serialized data", () => {
		world.spawn(
			Position({ x: 5, y: 10 }),
			Health({ current: 80, max: 100 }),
			Faction({ id: "ura" }),
			UnitType({ type: "mudfoot" }),
		);

		const data = serializeWorld(world);
		world.reset();
		deserializeWorld(world, data);

		const entities = world.query(Position);
		expect(entities).toHaveLength(1);

		const entity = entities[0];
		expect(entity.get(Position)).toEqual({ x: 5, y: 10 });
		expect(entity.get(Health)).toEqual({ current: 80, max: 100 });
		expect(entity.get(Faction)).toEqual({ id: "ura" });
		expect(entity.get(UnitType)).toEqual({ type: "mudfoot" });
	});

	it("should recreate tag traits", () => {
		world.spawn(Position({ x: 0, y: 0 }), IsBuilding, IsResource);

		const data = serializeWorld(world);
		world.reset();
		deserializeWorld(world, data);

		const entities = world.query(IsBuilding);
		expect(entities).toHaveLength(1);
		expect(entities[0].has(IsResource)).toBe(true);
	});

	it("should recreate AoS traits (OrderQueue, AIState)", () => {
		const entity = world.spawn(OrderQueue, AIState, Position({ x: 3, y: 7 }));
		const queue = entity.get(OrderQueue);
		queue.push({ type: "attack", targetEntity: 99 });
		entity.set(AIState, { state: "attacking", target: 99, alertLevel: 2 });

		const data = serializeWorld(world);
		world.reset();
		deserializeWorld(world, data);

		const entities = world.query(OrderQueue, AIState);
		expect(entities).toHaveLength(1);

		const newQueue = entities[0].get(OrderQueue);
		expect(newQueue).toHaveLength(1);
		expect(newQueue[0].type).toBe("attack");

		const newAI = entities[0].get(AIState);
		expect(newAI.state).toBe("attacking");
		expect(newAI.alertLevel).toBe(2);
	});
});

// ---------------------------------------------------------------------------
// Round-trip test
// ---------------------------------------------------------------------------

describe("saveLoadSystem — Round-trip", () => {
	it("should preserve entity count and trait values through serialize/deserialize", () => {
		world.spawn(
			Position({ x: 1, y: 2 }),
			Health({ current: 50, max: 100 }),
			Faction({ id: "ura" }),
			UnitType({ type: "mudfoot" }),
			Armor({ value: 3 }),
			VisionRadius({ radius: 7 }),
			Attack({ damage: 12, range: 1, cooldown: 1.5, timer: 0.3 }),
		);

		world.spawn(
			Position({ x: 10, y: 20 }),
			Health({ current: 200, max: 200 }),
			Faction({ id: "scale_guard" }),
			UnitType({ type: "gator" }),
		);

		world.spawn(
			Position({ x: 5, y: 5 }),
			IsResource,
			ResourceNode({ type: "fish", remaining: 75 }),
		);

		world.spawn(
			Position({ x: 8, y: 8 }),
			IsBuilding,
			IsSiphon,
			Health({ current: 500, max: 500 }),
			Faction({ id: "scale_guard" }),
			UnitType({ type: "siphon" }),
		);

		const data = serializeWorld(world);
		world.reset();
		deserializeWorld(world, data);

		// Verify entity count (excluding world entity)
		expect(gameEntityCount(world)).toBe(4);

		// Verify specific trait values
		const units = world.query(UnitType, Position);
		expect(units.length).toBe(3); // mudfoot, gator, siphon

		const resources = world.query(IsResource, ResourceNode);
		expect(resources.length).toBe(1);
		expect(resources[0].get(ResourceNode)).toEqual({ type: "fish", remaining: 75 });

		const siphons = world.query(IsSiphon);
		expect(siphons.length).toBe(1);
		expect(siphons[0].get(Health)).toEqual({ current: 500, max: 500 });

		// Verify combat unit
		const attackers = world.query(Attack, Armor);
		expect(attackers.length).toBe(1);
		expect(attackers[0].get(Attack)).toEqual({
			damage: 12,
			range: 1,
			cooldown: 1.5,
			timer: 0.3,
		});
		expect(attackers[0].get(Armor)).toEqual({ value: 3 });
	});

	it("should preserve relations through round-trip", () => {
		const enemy = world.spawn(
			Position({ x: 10, y: 10 }),
			Health({ current: 100, max: 100 }),
			Faction({ id: "scale_guard" }),
			UnitType({ type: "gator" }),
		);
		const unit = world.spawn(
			Position({ x: 0, y: 0 }),
			Health({ current: 80, max: 80 }),
			Faction({ id: "ura" }),
			UnitType({ type: "mudfoot" }),
			Attack({ damage: 10, range: 1, cooldown: 1, timer: 0 }),
		);
		unit.add(Targeting(enemy));

		const data = serializeWorld(world);
		world.reset();
		deserializeWorld(world, data);

		const attackers = world.query(Attack, Targeting("*"));
		expect(attackers.length).toBe(1);

		const targets = attackers[0].targetsFor(Targeting);
		expect(targets.length).toBe(1);
		expect(targets[0].get(UnitType)).toEqual({ type: "gator" });
	});

	it("should preserve water traits (CanSwim, Submerged)", () => {
		world.spawn(
			Position({ x: 3, y: 3 }),
			UnitType({ type: "diver" }),
			Faction({ id: "ura" }),
			CanSwim,
			Submerged,
		);

		const data = serializeWorld(world);
		world.reset();
		deserializeWorld(world, data);

		const divers = world.query(CanSwim, Submerged);
		expect(divers.length).toBe(1);
	});

	it("should preserve stealth traits (Concealed, Crouching, DetectionRadius)", () => {
		world.spawn(
			Position({ x: 2, y: 2 }),
			UnitType({ type: "sniper" }),
			Faction({ id: "ura" }),
			Concealed,
			DetectionRadius({ radius: 8 }),
		);

		const data = serializeWorld(world);
		world.reset();
		deserializeWorld(world, data);

		const stealthed = world.query(Concealed, DetectionRadius);
		expect(stealthed.length).toBe(1);
		expect(stealthed[0].get(DetectionRadius)).toEqual({ radius: 8 });
	});
});

// ---------------------------------------------------------------------------
// JSON serialization
// ---------------------------------------------------------------------------

describe("saveLoadSystem — JSON fidelity", () => {
	it("should produce valid JSON from serializeWorld", () => {
		world.spawn(Position({ x: 1, y: 2 }), Health({ current: 50, max: 100 }));

		const data = serializeWorld(world);
		const json = JSON.stringify(data);
		const parsed = JSON.parse(json) as SerializedWorld;

		expect(parsed.entities).toHaveLength(1);
		expect(parsed.entities[0].traits.Position).toEqual({ x: 1, y: 2 });
	});

	it("should round-trip through JSON string", () => {
		world.spawn(
			Position({ x: 7, y: 9 }),
			Health({ current: 42, max: 50 }),
			Faction({ id: "ura" }),
			UnitType({ type: "river_rat" }),
		);

		const data = serializeWorld(world);
		const json = JSON.stringify(data);
		const parsed = JSON.parse(json) as SerializedWorld;

		world.reset();
		deserializeWorld(world, parsed);

		const entities = world.query(Position, Health);
		expect(entities).toHaveLength(1);
		expect(entities[0].get(Health)).toEqual({ current: 42, max: 50 });
		expect(entities[0].get(UnitType)).toEqual({ type: "river_rat" });
	});
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("saveLoadSystem — Edge cases", () => {
	it("should handle empty world", () => {
		const data = serializeWorld(world);
		expect(data.entities).toHaveLength(0);

		world.reset();
		deserializeWorld(world, data);
		expect(gameEntityCount(world)).toBe(0);
	});

	it("should handle entities with only tag traits", () => {
		world.spawn(IsBuilding, IsSiphon);

		const data = serializeWorld(world);
		expect(data.entities).toHaveLength(1);
		expect(data.entities[0].tags).toContain("IsBuilding");
		expect(data.entities[0].tags).toContain("IsSiphon");

		world.reset();
		deserializeWorld(world, data);
		expect(world.query(IsBuilding, IsSiphon).length).toBe(1);
	});

	it("should not recreate SteeringAgent on deserialization", () => {
		world.spawn(Position({ x: 0, y: 0 }), SteeringAgent);

		const data = serializeWorld(world);
		world.reset();
		deserializeWorld(world, data);

		const entities = world.query(Position);
		expect(entities).toHaveLength(1);
		expect(entities[0].has(SteeringAgent)).toBe(false);
	});
});
