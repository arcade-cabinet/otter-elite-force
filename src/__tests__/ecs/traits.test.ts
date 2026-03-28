/**
 * ECS Component/Trait Tests — ported from old Koota codebase.
 *
 * Tests the bitECS SoA component stores that replaced Koota traits.
 */

import { describe, expect, it } from "vitest";
import {
	Armor,
	Attack,
	Construction,
	Content,
	DetectionCone,
	Facing,
	Faction,
	Flags,
	Gatherer,
	Health,
	PopulationState,
	Position,
	ResourceNode,
	ResourceRef,
	Selection,
	Speed,
	SplashRadius,
	SquadRef,
	TargetRef,
	Velocity,
	Veterancy,
	VisionRadius,
} from "@/engine/world/components";
import {
	createGameWorld,
	flushRemovals,
	isAlive,
	markForRemoval,
	spawnBuilding,
	spawnProjectile,
	spawnResource,
	spawnUnit,
} from "@/engine/world/gameWorld";

describe("ECS components (bitECS SoA stores)", () => {
	describe("Position", () => {
		it("stores x and y coordinates", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: 42, y: 99, faction: "ura" });
			expect(Position.x[eid]).toBe(42);
			expect(Position.y[eid]).toBe(99);
		});

		it("supports negative coordinates", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: -10, y: -20, faction: "ura" });
			expect(Position.x[eid]).toBeCloseTo(-10);
			expect(Position.y[eid]).toBeCloseTo(-20);
		});
	});

	describe("Health", () => {
		it("stores current and max HP", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "ura",
				health: { current: 80, max: 100 },
			});
			expect(Health.current[eid]).toBe(80);
			expect(Health.max[eid]).toBe(100);
		});

		it("current can go below zero (death detection)", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "ura",
				health: { current: 5, max: 100 },
			});
			Health.current[eid] -= 10;
			expect(Health.current[eid]).toBe(-5);
		});
	});

	describe("Attack", () => {
		it("stores damage, range, cooldown, timer", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
			Attack.damage[eid] = 12;
			Attack.range[eid] = 48;
			Attack.cooldown[eid] = 1.5;
			Attack.timer[eid] = 0;

			expect(Attack.damage[eid]).toBe(12);
			expect(Attack.range[eid]).toBe(48);
			expect(Attack.cooldown[eid]).toBeCloseTo(1.5);
			expect(Attack.timer[eid]).toBe(0);
		});
	});

	describe("Armor", () => {
		it("stores armor value", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
			Armor.value[eid] = 5;
			expect(Armor.value[eid]).toBe(5);
		});
	});

	describe("Speed", () => {
		it("stores speed value", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
			Speed.value[eid] = 64;
			expect(Speed.value[eid]).toBe(64);
		});
	});

	describe("Faction", () => {
		it("assigns numeric faction IDs", () => {
			const world = createGameWorld();
			const ura = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
			const sg = spawnUnit(world, { x: 10, y: 0, faction: "scale_guard" });
			const neutral = spawnUnit(world, { x: 20, y: 0, faction: "neutral" });

			expect(Faction.id[ura]).toBe(1);
			expect(Faction.id[sg]).toBe(2);
			expect(Faction.id[neutral]).toBe(0);
		});
	});

	describe("Flags", () => {
		it("supports isBuilding flag", () => {
			const world = createGameWorld();
			const building = spawnBuilding(world, {
				x: 0,
				y: 0,
				faction: "ura",
				buildingType: "barracks",
			});
			expect(Flags.isBuilding[building]).toBe(1);
		});

		it("supports isResource flag", () => {
			const world = createGameWorld();
			const resource = spawnResource(world, { x: 0, y: 0, resourceType: "fish_node" });
			expect(Flags.isResource[resource]).toBe(1);
		});

		it("supports isProjectile flag", () => {
			const world = createGameWorld();
			const proj = spawnProjectile(world, { x: 0, y: 0, faction: "ura", damage: 10 });
			expect(Flags.isProjectile[proj]).toBe(1);
		});

		it("supports stealthed flag", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
			Flags.stealthed[eid] = 1;
			expect(Flags.stealthed[eid]).toBe(1);
		});

		it("supports canSwim and submerged flags", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
			Flags.canSwim[eid] = 1;
			Flags.submerged[eid] = 1;
			expect(Flags.canSwim[eid]).toBe(1);
			expect(Flags.submerged[eid]).toBe(1);
		});
	});

	describe("Construction", () => {
		it("stores progress and buildTime", () => {
			const world = createGameWorld();
			const building = spawnBuilding(world, {
				x: 0,
				y: 0,
				faction: "ura",
				buildingType: "barracks",
				construction: { progress: 50, buildTime: 30 },
			});
			expect(Construction.progress[building]).toBe(50);
			expect(Construction.buildTime[building]).toBe(30);
		});
	});

	describe("VisionRadius", () => {
		it("stores vision radius value", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
			VisionRadius.value[eid] = 128;
			expect(VisionRadius.value[eid]).toBe(128);
		});
	});

	describe("Selection", () => {
		it("stores selection state", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
			Selection.selected[eid] = 1;
			expect(Selection.selected[eid]).toBe(1);
			Selection.selected[eid] = 0;
			expect(Selection.selected[eid]).toBe(0);
		});
	});

	describe("Gatherer", () => {
		it("stores amount and capacity", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
			Gatherer.amount[eid] = 5;
			Gatherer.capacity[eid] = 10;
			expect(Gatherer.amount[eid]).toBe(5);
			expect(Gatherer.capacity[eid]).toBe(10);
		});
	});

	describe("ResourceNode", () => {
		it("stores remaining amount", () => {
			const world = createGameWorld();
			const eid = spawnResource(world, { x: 0, y: 0, resourceType: "fish_node" });
			ResourceNode.remaining[eid] = 100;
			expect(ResourceNode.remaining[eid]).toBe(100);
		});
	});

	describe("Veterancy", () => {
		it("stores xp and rank", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
			Veterancy.xp[eid] = 150;
			Veterancy.rank[eid] = 2;
			expect(Veterancy.xp[eid]).toBe(150);
			expect(Veterancy.rank[eid]).toBe(2);
		});
	});

	describe("DetectionCone", () => {
		it("stores range, half angle, suspicion state", () => {
			const world = createGameWorld();
			const eid = spawnUnit(world, { x: 0, y: 0, faction: "scale_guard" });
			DetectionCone.range[eid] = 200;
			DetectionCone.halfAngle[eid] = 45;
			DetectionCone.suspicionTimer[eid] = 0;
			DetectionCone.suspicionThreshold[eid] = 3;
			DetectionCone.alertState[eid] = 0;

			expect(DetectionCone.range[eid]).toBe(200);
			expect(DetectionCone.halfAngle[eid]).toBe(45);
			expect(DetectionCone.alertState[eid]).toBe(0);
		});
	});

	describe("SplashRadius", () => {
		it("stores radius", () => {
			const world = createGameWorld();
			const eid = spawnProjectile(world, { x: 0, y: 0, faction: "ura", damage: 25 });
			SplashRadius.radius[eid] = 96;
			expect(SplashRadius.radius[eid]).toBe(96);
		});
	});
});

describe("Entity lifecycle (spawn, alive, remove, flush)", () => {
	it("spawned entity is alive", () => {
		const world = createGameWorld();
		const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
		expect(isAlive(world, eid)).toBe(true);
	});

	it("entity marked for removal is still alive until flush", () => {
		const world = createGameWorld();
		const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
		markForRemoval(world, eid);
		expect(isAlive(world, eid)).toBe(true);
	});

	it("entity is dead after flush", () => {
		const world = createGameWorld();
		const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
		markForRemoval(world, eid);
		flushRemovals(world);
		expect(isAlive(world, eid)).toBe(false);
	});

	it("flush clears runtime maps for removed entities", () => {
		const world = createGameWorld();
		const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura", unitType: "mudfoot" });
		world.runtime.orderQueues.set(eid, [{ type: "move", targetX: 100, targetY: 0 }]);

		markForRemoval(world, eid);
		flushRemovals(world);

		expect(world.runtime.orderQueues.has(eid)).toBe(false);
		expect(world.runtime.entityTypeIndex.has(eid)).toBe(false);
	});

	it("multiple entities can be spawned and tracked", () => {
		const world = createGameWorld();
		const ids: number[] = [];
		for (let i = 0; i < 10; i++) {
			ids.push(spawnUnit(world, { x: i * 10, y: 0, faction: "ura" }));
		}
		expect(world.runtime.alive.size).toBe(10);

		// Remove half
		for (let i = 0; i < 5; i++) {
			markForRemoval(world, ids[i]);
		}
		flushRemovals(world);

		expect(world.runtime.alive.size).toBe(5);
		for (let i = 0; i < 5; i++) {
			expect(isAlive(world, ids[i])).toBe(false);
		}
		for (let i = 5; i < 10; i++) {
			expect(isAlive(world, ids[i])).toBe(true);
		}
	});
});
