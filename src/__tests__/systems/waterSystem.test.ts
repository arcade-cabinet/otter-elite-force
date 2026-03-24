import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createWorld } from "koota";
import { CanSwim, Submerged } from "@/ecs/traits/water";
import { Position } from "@/ecs/traits/spatial";
import { Health } from "@/ecs/traits/combat";
import { UnitType, Faction } from "@/ecs/traits/identity";
import { GarrisonedIn } from "@/ecs/relations";
import {
	canEnterWater,
	submerge,
	surface,
	isVisibleToSurface,
	filterVisibleTargets,
	getGarrisonCount,
	boardTransport,
	disembarkTransport,
	syncGarrisonPositions,
	waterSystem,
} from "@/systems/waterSystem";

describe("Water Traversal System", () => {
	let world: ReturnType<typeof createWorld>;

	beforeEach(() => {
		world = createWorld();
	});

	afterEach(() => {
		world.destroy();
	});

	describe("canEnterWater", () => {
		it("should return true for entities with CanSwim", () => {
			const diver = world.spawn(CanSwim, UnitType, Position);
			expect(canEnterWater(diver)).toBe(true);
		});

		it("should return false for entities without CanSwim", () => {
			const mudfoot = world.spawn(UnitType, Position);
			expect(canEnterWater(mudfoot)).toBe(false);
		});
	});

	describe("submerge / surface", () => {
		it("should submerge an entity with CanSwim", () => {
			const diver = world.spawn(CanSwim, UnitType, Position);
			expect(submerge(diver)).toBe(true);
			expect(diver.has(Submerged)).toBe(true);
		});

		it("should not submerge entity without CanSwim", () => {
			const mudfoot = world.spawn(UnitType, Position);
			expect(submerge(mudfoot)).toBe(false);
			expect(mudfoot.has(Submerged)).toBe(false);
		});

		it("should not submerge an already submerged entity", () => {
			const diver = world.spawn(CanSwim, Submerged, UnitType);
			expect(submerge(diver)).toBe(false);
		});

		it("should surface a submerged entity", () => {
			const diver = world.spawn(CanSwim, Submerged, UnitType);
			expect(surface(diver)).toBe(true);
			expect(diver.has(Submerged)).toBe(false);
		});

		it("should not surface an entity that is not submerged", () => {
			const diver = world.spawn(CanSwim, UnitType);
			expect(surface(diver)).toBe(false);
		});
	});

	describe("visibility", () => {
		it("should report submerged entities as invisible to surface", () => {
			const diver = world.spawn(CanSwim, Submerged, UnitType);
			expect(isVisibleToSurface(diver)).toBe(false);
		});

		it("should report surface entities as visible", () => {
			const mudfoot = world.spawn(UnitType, Position);
			expect(isVisibleToSurface(mudfoot)).toBe(true);
		});
	});

	describe("filterVisibleTargets", () => {
		it("should filter out submerged entities for surface observers", () => {
			const surfaceUnit = world.spawn(UnitType, Position, Health);
			const submergedUnit = world.spawn(CanSwim, Submerged, UnitType, Position, Health);
			const anotherSurface = world.spawn(UnitType, Position, Health);

			const targets = [surfaceUnit, submergedUnit, anotherSurface];
			const visible = filterVisibleTargets(targets, false);

			expect(visible).toHaveLength(2);
			expect(visible).toContain(surfaceUnit);
			expect(visible).toContain(anotherSurface);
			expect(visible).not.toContain(submergedUnit);
		});

		it("should show all entities for submerged observers", () => {
			const surfaceUnit = world.spawn(UnitType, Position, Health);
			const submergedUnit = world.spawn(CanSwim, Submerged, UnitType, Position, Health);

			const targets = [surfaceUnit, submergedUnit];
			const visible = filterVisibleTargets(targets, true);

			expect(visible).toHaveLength(2);
		});
	});

	describe("garrison / boarding", () => {
		it("should board a unit onto a raft", () => {
			const raft = world.spawn(UnitType, Position, CanSwim);
			raft.set(UnitType, { type: "raftsman" });
			const mudfoot = world.spawn(UnitType, Position);

			const result = boardTransport(world, mudfoot, raft);
			expect(result).toBe(true);
			expect(mudfoot.has(GarrisonedIn(raft))).toBe(true);
		});

		it("should respect max capacity (4 by default)", () => {
			const raft = world.spawn(UnitType, Position, CanSwim);
			const units = Array.from({ length: 5 }, () => world.spawn(UnitType, Position));

			for (let i = 0; i < 4; i++) {
				expect(boardTransport(world, units[i], raft)).toBe(true);
			}
			// 5th should fail
			expect(boardTransport(world, units[4], raft)).toBe(false);
		});

		it("should respect custom capacity (e.g., 6 with Advanced Rafts)", () => {
			const raft = world.spawn(UnitType, Position, CanSwim);
			const units = Array.from({ length: 7 }, () => world.spawn(UnitType, Position));

			for (let i = 0; i < 6; i++) {
				expect(boardTransport(world, units[i], raft, 6)).toBe(true);
			}
			expect(boardTransport(world, units[6], raft, 6)).toBe(false);
		});

		it("should not allow a unit to board two transports", () => {
			const raft1 = world.spawn(UnitType, Position, CanSwim);
			const raft2 = world.spawn(UnitType, Position, CanSwim);
			const mudfoot = world.spawn(UnitType, Position);

			expect(boardTransport(world, mudfoot, raft1)).toBe(true);
			expect(boardTransport(world, mudfoot, raft2)).toBe(false);
		});

		it("should get garrison count", () => {
			const raft = world.spawn(UnitType, Position, CanSwim);
			const u1 = world.spawn(UnitType, Position);
			const u2 = world.spawn(UnitType, Position);

			expect(getGarrisonCount(world, raft)).toBe(0);
			boardTransport(world, u1, raft);
			expect(getGarrisonCount(world, raft)).toBe(1);
			boardTransport(world, u2, raft);
			expect(getGarrisonCount(world, raft)).toBe(2);
		});
	});

	describe("disembark", () => {
		it("should disembark a unit and place it at transport position", () => {
			const raft = world.spawn(UnitType, Position, CanSwim);
			raft.set(Position, { x: 10, y: 5 });
			const mudfoot = world.spawn(UnitType, Position);
			mudfoot.set(Position, { x: 0, y: 0 });

			boardTransport(world, mudfoot, raft);
			const result = disembarkTransport(mudfoot, raft);

			expect(result).toBe(true);
			expect(mudfoot.has(GarrisonedIn(raft))).toBe(false);
			const pos = mudfoot.get(Position);
			expect(pos.x).toBe(10);
			expect(pos.y).toBe(5);
		});

		it("should fail if unit is not garrisoned in the transport", () => {
			const raft = world.spawn(UnitType, Position, CanSwim);
			const mudfoot = world.spawn(UnitType, Position);

			expect(disembarkTransport(mudfoot, raft)).toBe(false);
		});
	});

	describe("syncGarrisonPositions", () => {
		it("should move garrisoned units to transport position", () => {
			const raft = world.spawn(UnitType, Position, CanSwim);
			raft.set(Position, { x: 3, y: 7 });
			const u1 = world.spawn(UnitType, Position);
			const u2 = world.spawn(UnitType, Position);

			boardTransport(world, u1, raft);
			boardTransport(world, u2, raft);

			// Move the raft
			raft.set(Position, { x: 8, y: 12 });
			syncGarrisonPositions(world, raft);

			expect(u1.get(Position).x).toBe(8);
			expect(u1.get(Position).y).toBe(12);
			expect(u2.get(Position).x).toBe(8);
			expect(u2.get(Position).y).toBe(12);
		});
	});

	describe("waterSystem (per-frame tick)", () => {
		it("should sync raftsman passengers each frame", () => {
			const raft = world.spawn(UnitType, Position, CanSwim);
			raft.set(UnitType, { type: "raftsman" });
			raft.set(Position, { x: 5, y: 5 });

			const passenger = world.spawn(UnitType, Position);
			boardTransport(world, passenger, raft);

			// Move raft
			raft.set(Position, { x: 10, y: 15 });

			// Tick water system
			waterSystem(world);

			expect(passenger.get(Position).x).toBe(10);
			expect(passenger.get(Position).y).toBe(15);
		});
	});
});
