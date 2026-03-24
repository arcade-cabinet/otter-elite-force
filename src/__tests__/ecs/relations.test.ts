import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createWorld, Not } from "koota";
import { UnitType, Faction, IsBuilding } from "@/ecs/traits/identity";
import { Position } from "@/ecs/traits/spatial";
import { Health } from "@/ecs/traits/combat";
import { Gatherer } from "@/ecs/traits/economy";
import {
	BelongsToSquad,
	OwnedBy,
	Targeting,
	GatheringFrom,
	TrainingAt,
	GarrisonedIn,
} from "@/ecs/relations";

describe("Koota ECS Relations", () => {
	let world: ReturnType<typeof createWorld>;

	beforeEach(() => {
		world = createWorld();
	});

	afterEach(() => {
		world.destroy();
	});

	describe("BelongsToSquad", () => {
		it("should link unit to squad", () => {
			const squad = world.spawn();
			const unit = world.spawn(BelongsToSquad(squad));

			expect(unit.has(BelongsToSquad(squad))).toBe(true);

			const results = world.query(BelongsToSquad(squad));
			expect(results.length).toBe(1);
			expect(results[0]).toBe(unit);
		});

		it("should query all squad members with wildcard", () => {
			const squad = world.spawn();
			const unit1 = world.spawn(BelongsToSquad(squad));
			const unit2 = world.spawn(BelongsToSquad(squad));

			const results = world.query(BelongsToSquad(squad));
			expect(results.length).toBe(2);
		});
	});

	describe("OwnedBy", () => {
		it("should link entity to faction", () => {
			const uraFaction = world.spawn(Faction);
			uraFaction.set(Faction, { id: "ura" });

			const unit = world.spawn(UnitType, Position, OwnedBy(uraFaction));
			unit.set(UnitType, { type: "mudfoot" });

			expect(unit.has(OwnedBy(uraFaction))).toBe(true);

			const owned = world.query(OwnedBy(uraFaction));
			expect(owned.length).toBe(1);
		});
	});

	describe("Targeting (exclusive)", () => {
		it("should only keep latest target", () => {
			const hero = world.spawn(UnitType, Position, Health);
			const enemy1 = world.spawn(UnitType, Position, Health);
			const enemy2 = world.spawn(UnitType, Position, Health);

			hero.add(Targeting(enemy1));
			expect(hero.has(Targeting(enemy1))).toBe(true);

			// Adding a new target should replace the old one (exclusive)
			hero.add(Targeting(enemy2));
			expect(hero.has(Targeting(enemy2))).toBe(true);
			expect(hero.has(Targeting(enemy1))).toBe(false);
		});

		it("should query entities targeting a specific enemy", () => {
			const attacker = world.spawn(UnitType);
			const target = world.spawn(UnitType);

			attacker.add(Targeting(target));

			const results = world.query(Targeting(target));
			expect(results.length).toBe(1);
			expect(results[0]).toBe(attacker);
		});
	});

	describe("GatheringFrom", () => {
		it("should link worker to resource node", () => {
			const tree = world.spawn(Position);
			const worker = world.spawn(Gatherer, Position, GatheringFrom(tree));

			expect(worker.has(GatheringFrom(tree))).toBe(true);

			const gathering = world.query(GatheringFrom(tree));
			expect(gathering.length).toBe(1);
		});

		it("should find idle workers (not gathering)", () => {
			const tree = world.spawn(Position);
			const busyWorker = world.spawn(Gatherer, GatheringFrom(tree));
			const idleWorker = world.spawn(Gatherer);

			const idle = world.query(Gatherer, Not(GatheringFrom("*")));
			expect(idle.length).toBe(1);
			expect(idle[0]).toBe(idleWorker);
		});
	});

	describe("TrainingAt (with store)", () => {
		it("should store training progress data", () => {
			const barracks = world.spawn(IsBuilding, Position);
			const unitBeingTrained = world.spawn();

			barracks.add(TrainingAt(unitBeingTrained));
			barracks.set(TrainingAt(unitBeingTrained), { progress: 0.5, unitType: "mudfoot" });

			const data = barracks.get(TrainingAt(unitBeingTrained));
			expect(data.progress).toBe(0.5);
			expect(data.unitType).toBe("mudfoot");
		});

		it("should update training progress", () => {
			const barracks = world.spawn(IsBuilding);
			const unit = world.spawn();

			barracks.add(TrainingAt(unit, { progress: 0, unitType: "shellcracker" }));
			barracks.set(TrainingAt(unit), { progress: 0.75 });

			expect(barracks.get(TrainingAt(unit)).progress).toBe(0.75);
		});
	});

	describe("GarrisonedIn", () => {
		it("should link unit to building", () => {
			const tower = world.spawn(IsBuilding, Position);
			const unit = world.spawn(UnitType, GarrisonedIn(tower));

			expect(unit.has(GarrisonedIn(tower))).toBe(true);

			const garrisoned = world.query(GarrisonedIn(tower));
			expect(garrisoned.length).toBe(1);
		});

		it("should remove garrison relation", () => {
			const tower = world.spawn(IsBuilding);
			const unit = world.spawn(GarrisonedIn(tower));

			unit.remove(GarrisonedIn(tower));
			expect(unit.has(GarrisonedIn(tower))).toBe(false);
		});
	});

	describe("targetsFor", () => {
		it("should return all targets for a relation", () => {
			const squad1 = world.spawn();
			const squad2 = world.spawn();
			const unit = world.spawn(BelongsToSquad(squad1));

			const targets = unit.targetsFor(BelongsToSquad);
			expect(targets.length).toBe(1);
			expect(targets[0]).toBe(squad1);
		});
	});
});
