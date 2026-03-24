import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createWorld } from "koota";
import {
	UnitType,
	Faction,
	IsHero,
	IsBuilding,
	IsProjectile,
	IsResource,
} from "@/ecs/traits/identity";
import { Position, Velocity, FacingDirection } from "@/ecs/traits/spatial";
import { Health, Attack, Armor, VisionRadius } from "@/ecs/traits/combat";
import { AIState, SteeringAgent } from "@/ecs/traits/ai";
import { OrderQueue, RallyPoint } from "@/ecs/traits/orders";
import { Gatherer, ResourceNode, ProductionQueue, PopulationCost } from "@/ecs/traits/economy";
import { Concealed, Crouching, DetectionRadius } from "@/ecs/traits/stealth";
import { CanSwim, Submerged } from "@/ecs/traits/water";
import { PhaserSprite } from "@/ecs/traits/phaser";

describe("Koota ECS Traits", () => {
	let world: ReturnType<typeof createWorld>;

	beforeEach(() => {
		world = createWorld();
	});

	afterEach(() => {
		world.destroy();
	});

	describe("Identity traits", () => {
		it("should spawn entity with UnitType and read it back", () => {
			const entity = world.spawn(UnitType);
			expect(entity.has(UnitType)).toBe(true);

			const unitType = entity.get(UnitType);
			expect(unitType.type).toBe("");
		});

		it("should set UnitType value", () => {
			const entity = world.spawn(UnitType);
			entity.set(UnitType, { type: "mudfoot" });

			const unitType = entity.get(UnitType);
			expect(unitType.type).toBe("mudfoot");
		});

		it("should spawn entity with Faction", () => {
			const entity = world.spawn(Faction);
			entity.set(Faction, { id: "ura" });
			expect(entity.get(Faction).id).toBe("ura");
		});

		it("should use tag traits without data", () => {
			const entity = world.spawn(IsHero, IsBuilding);
			expect(entity.has(IsHero)).toBe(true);
			expect(entity.has(IsBuilding)).toBe(true);
			expect(entity.has(IsProjectile)).toBe(false);
			expect(entity.has(IsResource)).toBe(false);
		});
	});

	describe("Spatial traits", () => {
		it("should spawn with Position defaults", () => {
			const entity = world.spawn(Position);
			const pos = entity.get(Position);
			expect(pos.x).toBe(0);
			expect(pos.y).toBe(0);
		});

		it("should update Position", () => {
			const entity = world.spawn(Position);
			entity.set(Position, { x: 5, y: 10 });
			const pos = entity.get(Position);
			expect(pos.x).toBe(5);
			expect(pos.y).toBe(10);
		});

		it("should spawn with Velocity and FacingDirection", () => {
			const entity = world.spawn(Velocity, FacingDirection);
			expect(entity.has(Velocity)).toBe(true);
			expect(entity.has(FacingDirection)).toBe(true);
			expect(entity.get(FacingDirection).angle).toBe(0);
		});
	});

	describe("Combat traits", () => {
		it("should spawn with Health defaults", () => {
			const entity = world.spawn(Health);
			const health = entity.get(Health);
			expect(health.current).toBe(100);
			expect(health.max).toBe(100);
		});

		it("should reduce health", () => {
			const entity = world.spawn(Health);
			entity.set(Health, { current: 50 });
			expect(entity.get(Health).current).toBe(50);
			expect(entity.get(Health).max).toBe(100);
		});

		it("should spawn with Attack defaults", () => {
			const entity = world.spawn(Attack);
			const atk = entity.get(Attack);
			expect(atk.damage).toBe(10);
			expect(atk.range).toBe(1);
			expect(atk.cooldown).toBe(1.0);
			expect(atk.timer).toBe(0);
		});

		it("should spawn with Armor and VisionRadius", () => {
			const entity = world.spawn(Armor, VisionRadius);
			expect(entity.get(Armor).value).toBe(0);
			expect(entity.get(VisionRadius).radius).toBe(5);
		});
	});

	describe("AI traits", () => {
		it("should spawn AIState with AoS defaults", () => {
			const entity = world.spawn(AIState);
			const ai = entity.get(AIState);
			expect(ai.state).toBe("idle");
			expect(ai.target).toBeNull();
			expect(ai.alertLevel).toBe(0);
		});

		it("should mutate AIState object directly", () => {
			const entity = world.spawn(AIState);
			const ai = entity.get(AIState);
			ai.state = "alert";
			ai.alertLevel = 2;
			// AoS traits return a ref so mutations persist
			expect(entity.get(AIState).state).toBe("alert");
			expect(entity.get(AIState).alertLevel).toBe(2);
		});

		it("should spawn SteeringAgent as null", () => {
			const entity = world.spawn(SteeringAgent);
			expect(entity.get(SteeringAgent)).toBeNull();
		});
	});

	describe("Order traits", () => {
		it("should spawn OrderQueue as empty array", () => {
			const entity = world.spawn(OrderQueue);
			const queue = entity.get(OrderQueue);
			expect(Array.isArray(queue)).toBe(true);
			expect(queue).toHaveLength(0);
		});

		it("should push orders to queue", () => {
			const entity = world.spawn(OrderQueue);
			const queue = entity.get(OrderQueue);
			queue.push({ type: "move", targetX: 5, targetY: 10 });
			expect(entity.get(OrderQueue)).toHaveLength(1);
			expect(entity.get(OrderQueue)[0].type).toBe("move");
		});

		it("should spawn RallyPoint with defaults", () => {
			const entity = world.spawn(RallyPoint);
			const rp = entity.get(RallyPoint);
			expect(rp.x).toBe(0);
			expect(rp.y).toBe(0);
		});
	});

	describe("Economy traits", () => {
		it("should spawn Gatherer with defaults", () => {
			const entity = world.spawn(Gatherer);
			const g = entity.get(Gatherer);
			expect(g.carrying).toBe("");
			expect(g.amount).toBe(0);
			expect(g.capacity).toBe(10);
		});

		it("should spawn ResourceNode with defaults", () => {
			const entity = world.spawn(ResourceNode);
			const rn = entity.get(ResourceNode);
			expect(rn.type).toBe("");
			expect(rn.remaining).toBe(100);
		});

		it("should spawn ProductionQueue as empty array", () => {
			const entity = world.spawn(ProductionQueue);
			expect(entity.get(ProductionQueue)).toHaveLength(0);
		});

		it("should spawn PopulationCost with default", () => {
			const entity = world.spawn(PopulationCost);
			expect(entity.get(PopulationCost).cost).toBe(1);
		});
	});

	describe("Stealth traits", () => {
		it("should use Concealed and Crouching as tags", () => {
			const entity = world.spawn(Concealed, Crouching);
			expect(entity.has(Concealed)).toBe(true);
			expect(entity.has(Crouching)).toBe(true);
		});

		it("should spawn DetectionRadius with default", () => {
			const entity = world.spawn(DetectionRadius);
			expect(entity.get(DetectionRadius).radius).toBe(6);
		});
	});

	describe("Water traits", () => {
		it("should use CanSwim and Submerged as tags", () => {
			const entity = world.spawn(CanSwim);
			expect(entity.has(CanSwim)).toBe(true);
			expect(entity.has(Submerged)).toBe(false);

			entity.add(Submerged);
			expect(entity.has(Submerged)).toBe(true);
		});
	});

	describe("Phaser trait", () => {
		it("should spawn PhaserSprite as null", () => {
			const entity = world.spawn(PhaserSprite);
			expect(entity.get(PhaserSprite)).toBeNull();
		});
	});

	describe("Query: spawn entity with Position+UnitType, query it back", () => {
		it("should find entity via world.query", () => {
			const entity = world.spawn(Position, UnitType);
			entity.set(UnitType, { type: "mudfoot" });
			entity.set(Position, { x: 3, y: 7 });

			const results = world.query(Position, UnitType);
			expect(results.length).toBe(1);

			const found = results[0];
			expect(found.get(UnitType).type).toBe("mudfoot");
			expect(found.get(Position).x).toBe(3);
			expect(found.get(Position).y).toBe(7);
		});

		it("should not find entity missing required trait", () => {
			world.spawn(Position); // no UnitType

			const results = world.query(Position, UnitType);
			expect(results.length).toBe(0);
		});
	});
});
