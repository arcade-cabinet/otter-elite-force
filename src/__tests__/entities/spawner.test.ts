/**
 * Entity Spawner Tests — ported from old Koota codebase.
 *
 * Tests entity spawning functions (spawnUnit, spawnBuilding, spawnResource, spawnProjectile).
 */

import { describe, expect, it } from "vitest";
import {
	Armor,
	Attack,
	Construction,
	Content,
	Faction,
	Flags,
	Gatherer,
	Health,
	Position,
	Speed,
	TargetRef,
	VisionRadius,
} from "@/engine/world/components";
import {
	createGameWorld,
	isAlive,
	spawnUnit,
	spawnBuilding,
	spawnResource,
	spawnProjectile,
} from "@/engine/world/gameWorld";

describe("Entity spawner", () => {
	describe("spawnUnit", () => {
		it("creates a unit at the specified position", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: 100, y: 200, faction: "ura" });
			expect(Position.x[eid]).toBe(100);
			expect(Position.y[eid]).toBe(200);
		});

		it("assigns faction correctly", () => {
			const world = createGameWorld();
			const ura = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
			const sg = spawnUnit(world, { x: 10, y: 0, faction: "scale_guard" });
			expect(Faction.id[ura]).toBe(1);
			expect(Faction.id[sg]).toBe(2);
		});

		it("sets health from options", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura", health: { current: 80, max: 100 } });
			expect(Health.current[eid]).toBe(80);
			expect(Health.max[eid]).toBe(100);
		});

		it("defaults health to 1/1 if not specified", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
			expect(Health.current[eid]).toBe(1);
			expect(Health.max[eid]).toBe(1);
		});

		it("is alive after spawning", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
			expect(isAlive(world, eid)).toBe(true);
		});

		it("stores unitType in entity type index", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura", unitType: "mudfoot" });
			expect(world.runtime.entityTypeIndex.get(eid)).toBe("mudfoot");
		});

		it("stores scriptId in script tag index", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura", scriptId: "commander" });
			expect(world.runtime.scriptTagIndex.get("commander")).toBe(eid);
		});

		it("wires template stats when stats option is provided", () => {
			const world = createGameWorld();
			// Stats use tile-based units: speed=2 tiles/s, range=1 tile, visionRadius=5 tiles
			const eid = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "ura",
				stats: {
					hp: 80,
					armor: 2,
					speed: 2,
					attackDamage: 12,
					attackRange: 1,
					attackCooldownMs: 1.2,
					visionRadius: 5,
					popCost: 1,
				},
			});

			expect(Health.max[eid]).toBe(80);
			expect(Armor.value[eid]).toBe(2);
			// Speed, range, visionRadius are converted from tiles to pixels (* 32)
			expect(Speed.value[eid]).toBe(64);
			expect(Attack.damage[eid]).toBe(12);
			expect(Attack.range[eid]).toBe(32);
			expect(Attack.cooldown[eid]).toBeCloseTo(1.2, 5);
			expect(VisionRadius.value[eid]).toBe(160);
		});

		it("grants gather capacity for worker-like units", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "ura",
				stats: {
					hp: 40,
					armor: 0,
					speed: 80,
					attackDamage: 5,
					attackRange: 32,
					attackCooldownMs: 1500,
					visionRadius: 6,
					popCost: 1,
				},
				abilities: ["gather", "build"],
			});

			expect(Gatherer.capacity[eid]).toBe(10);
		});

		it("registers abilities in entityAbilities map", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "ura",
				abilities: ["heal", "snipe"],
			});

			const abilities = world.runtime.entityAbilities.get(eid);
			expect(abilities).toContain("heal");
			expect(abilities).toContain("snipe");
		});

		it("sets canSwim flag from flags option", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "ura",
				flags: { canSwim: true },
			});
			expect(Flags.canSwim[eid]).toBe(1);
		});

		it("zeroes out stale SoA fields on fresh spawn", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
			expect(Attack.damage[eid]).toBe(0);
			expect(Attack.range[eid]).toBe(0);
			expect(Armor.value[eid]).toBe(0);
			expect(Speed.value[eid]).toBe(0);
		});
	});

	describe("spawnBuilding", () => {
		it("creates a building with isBuilding flag set", () => {
			const world = createGameWorld();
			const eid = spawnBuilding(world, {
				x: 100,
				y: 200,
				faction: "ura",
				buildingType: "barracks",
			});
			expect(Flags.isBuilding[eid]).toBe(1);
		});

		it("sets construction progress and build time", () => {
			const world = createGameWorld();
			const eid = spawnBuilding(world, {
				x: 0,
				y: 0,
				faction: "ura",
				buildingType: "barracks",
				construction: { progress: 50, buildTime: 30 },
			});
			expect(Construction.progress[eid]).toBe(50);
			expect(Construction.buildTime[eid]).toBe(30);
		});

		it("defaults construction to complete (progress=100)", () => {
			const world = createGameWorld();
			const eid = spawnBuilding(world, {
				x: 0,
				y: 0,
				faction: "ura",
				buildingType: "barracks",
			});
			expect(Construction.progress[eid]).toBe(100);
		});

		it("stores buildingType in entity type index", () => {
			const world = createGameWorld();
			const eid = spawnBuilding(world, {
				x: 0,
				y: 0,
				faction: "ura",
				buildingType: "watchtower",
			});
			expect(world.runtime.entityTypeIndex.get(eid)).toBe("watchtower");
		});

		it("wires template stats when stats option is provided", () => {
			const world = createGameWorld();
			// Stats use tile-based units: visionRadius=8 tiles, attackRange=6 tiles
			const eid = spawnBuilding(world, {
				x: 0,
				y: 0,
				faction: "ura",
				buildingType: "watchtower",
				stats: {
					hp: 200,
					armor: 1,
					visionRadius: 8,
					attackDamage: 8,
					attackRange: 6,
					attackCooldownMs: 2,
					populationCapacity: 0,
				},
			});

			expect(Health.max[eid]).toBe(200);
			expect(Armor.value[eid]).toBe(1);
			// Range and visionRadius converted from tiles to pixels (* 32)
			expect(VisionRadius.value[eid]).toBe(256);
			expect(Attack.damage[eid]).toBe(8);
			expect(Attack.range[eid]).toBe(192);
		});
	});

	describe("spawnResource", () => {
		it("creates a resource with isResource flag set", () => {
			const world = createGameWorld();
			const eid = spawnResource(world, { x: 50, y: 75, resourceType: "fish_node" });
			expect(Flags.isResource[eid]).toBe(1);
		});

		it("stores resourceType in entity type index", () => {
			const world = createGameWorld();
			const eid = spawnResource(world, { x: 0, y: 0, resourceType: "timber_node" });
			expect(world.runtime.entityTypeIndex.get(eid)).toBe("timber_node");
		});

		it("supports scriptId", () => {
			const world = createGameWorld();
			const eid = spawnResource(world, { x: 0, y: 0, resourceType: "fish_node", scriptId: "bonus_fish" });
			expect(world.runtime.scriptTagIndex.get("bonus_fish")).toBe(eid);
		});
	});

	describe("spawnProjectile", () => {
		it("creates a projectile with isProjectile flag set", () => {
			const world = createGameWorld();
			const eid = spawnProjectile(world, { x: 10, y: 20, faction: "ura", damage: 15 });
			expect(Flags.isProjectile[eid]).toBe(1);
		});

		it("sets attack damage on projectile", () => {
			const world = createGameWorld();
			const eid = spawnProjectile(world, { x: 0, y: 0, faction: "ura", damage: 25 });
			expect(Attack.damage[eid]).toBe(25);
		});

		it("sets target entity reference", () => {
			const world = createGameWorld();
			const target = spawnUnit(world, { x: 50, y: 50, faction: "scale_guard" });
			const proj = spawnProjectile(world, { x: 0, y: 0, faction: "ura", damage: 10, targetEid: target });

			expect(TargetRef.eid[proj]).toBe(target);
		});
	});

	describe("spawn counts", () => {
		it("increments alive count for each spawn", () => {
			const world = createGameWorld();
			expect(world.runtime.alive.size).toBe(0);

			spawnUnit(world, { x: 0, y: 0, faction: "ura" });
			expect(world.runtime.alive.size).toBe(1);

			spawnBuilding(world, { x: 10, y: 0, faction: "ura", buildingType: "barracks" });
			expect(world.runtime.alive.size).toBe(2);

			spawnResource(world, { x: 20, y: 0, resourceType: "fish_node" });
			expect(world.runtime.alive.size).toBe(3);

			spawnProjectile(world, { x: 30, y: 0, faction: "ura", damage: 5 });
			expect(world.runtime.alive.size).toBe(4);
		});
	});
});
