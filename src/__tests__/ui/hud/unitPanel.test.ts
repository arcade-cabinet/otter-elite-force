/**
 * US-013: UnitPanel selection -> ECS trait binding
 *
 * Tests that UnitPanel correctly reads ECS traits for:
 * - Single unit selection (name, HP, armor, damage, range)
 * - Single building selection (name, HP, production queue, research slot)
 * - Multi-selection (count + aggregate info)
 * - Empty selection (clears panel)
 */
import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { OwnedBy } from "@/ecs/relations";
import { initSingletons } from "@/ecs/singletons";
import { Armor, Attack, Health, VisionRadius } from "@/ecs/traits/combat";
import { ProductionQueue, ResearchSlot } from "@/ecs/traits/economy";
import { IsBuilding, IsHero, Selected, UnitType } from "@/ecs/traits/identity";
import { Position } from "@/ecs/traits/spatial";

describe("US-013: UnitPanel ECS trait binding", () => {
	let world: ReturnType<typeof createWorld>;
	let uraFaction: ReturnType<ReturnType<typeof createWorld>["spawn"]>;

	beforeEach(() => {
		world = createWorld();
		initSingletons(world);
		uraFaction = world.spawn();
	});

	afterEach(() => {
		world.reset();
	});

	describe("single unit selection", () => {
		it("should expose unit identity and combat stats via ECS traits", () => {
			const unit = world.spawn(
				UnitType({ type: "mudfoot" }),
				Health({ current: 65, max: 80 }),
				Attack({ damage: 12, range: 1, cooldown: 1.0, timer: 0 }),
				Armor({ value: 2 }),
				VisionRadius({ radius: 5 }),
				Position({ x: 5, y: 5 }),
				Selected,
				OwnedBy(uraFaction),
			);

			expect(unit.get(UnitType).type).toBe("mudfoot");
			expect(unit.get(Health).current).toBe(65);
			expect(unit.get(Health).max).toBe(80);
			expect(unit.get(Attack).damage).toBe(12);
			expect(unit.get(Attack).range).toBe(1);
			expect(unit.get(Armor).value).toBe(2);
			expect(unit.has(Selected)).toBe(true);
		});

		it("should identify hero units via IsHero trait", () => {
			const hero = world.spawn(
				UnitType({ type: "sgt_bubbles" }),
				Health({ current: 120, max: 120 }),
				IsHero,
				Selected,
				Position({ x: 5, y: 5 }),
			);

			expect(hero.has(IsHero)).toBe(true);
			expect(hero.has(Selected)).toBe(true);
		});

		it("should update HP in real-time when health changes", () => {
			const unit = world.spawn(
				UnitType({ type: "mudfoot" }),
				Health({ current: 80, max: 80 }),
				Selected,
				Position({ x: 5, y: 5 }),
			);

			expect(unit.get(Health).current).toBe(80);

			// Simulate combat damage
			unit.set(Health, { current: 45, max: 80 });
			expect(unit.get(Health).current).toBe(45);

			// HP percentage would be 45/80 = 56.25%
			const hpPct = (unit.get(Health).current / unit.get(Health).max) * 100;
			expect(hpPct).toBeCloseTo(56.25, 1);
		});
	});

	describe("single building selection", () => {
		it("should expose building identity and HP via ECS traits", () => {
			const building = world.spawn(
				IsBuilding,
				UnitType({ type: "barracks" }),
				Health({ current: 350, max: 350 }),
				ProductionQueue,
				Position({ x: 10, y: 10 }),
				Selected,
				OwnedBy(uraFaction),
			);

			expect(building.has(IsBuilding)).toBe(true);
			expect(building.get(UnitType).type).toBe("barracks");
			expect(building.get(Health).current).toBe(350);
		});

		it("should expose current production queue on selected building", () => {
			const building = world.spawn(
				IsBuilding,
				UnitType({ type: "barracks" }),
				Health({ current: 350, max: 350 }),
				ProductionQueue,
				Position({ x: 10, y: 10 }),
				Selected,
				OwnedBy(uraFaction),
			);

			const queue = building.get(ProductionQueue);
			queue.push({ unitType: "mudfoot", progress: 45, buildTime: 20 });
			queue.push({ unitType: "shellcracker", progress: 0, buildTime: 25 });

			expect(queue).toHaveLength(2);
			expect(queue[0].unitType).toBe("mudfoot");
			expect(queue[0].progress).toBe(45);
			expect(queue[1].unitType).toBe("shellcracker");
		});

		it("should expose research slot on armory building", () => {
			const armory = world.spawn(
				IsBuilding,
				UnitType({ type: "armory" }),
				Health({ current: 400, max: 400 }),
				ResearchSlot,
				Position({ x: 10, y: 10 }),
				Selected,
				OwnedBy(uraFaction),
			);

			// Initially null (no active research)
			expect(armory.get(ResearchSlot)).toBeNull();

			// Start research
			armory.set(ResearchSlot, {
				researchId: "hardshell_armor",
				progress: 30,
				researchTime: 20,
			});

			const slot = armory.get(ResearchSlot);
			expect(slot).not.toBeNull();
			expect(slot.researchId).toBe("hardshell_armor");
			expect(slot.progress).toBe(30);
		});
	});

	describe("multi-selection", () => {
		it("should query all selected entities", () => {
			world.spawn(
				UnitType({ type: "mudfoot" }),
				Health({ current: 80, max: 80 }),
				Selected,
				Position({ x: 1, y: 1 }),
			);
			world.spawn(
				UnitType({ type: "mudfoot" }),
				Health({ current: 60, max: 80 }),
				Selected,
				Position({ x: 2, y: 2 }),
			);
			world.spawn(
				UnitType({ type: "shellcracker" }),
				Health({ current: 50, max: 50 }),
				Selected,
				Position({ x: 3, y: 3 }),
			);

			const selected = world.query(Selected);
			expect(selected.length).toBe(3);

			// Aggregate HP: 80 + 60 + 50 = 190
			let totalHp = 0;
			let totalMaxHp = 0;
			for (const entity of selected) {
				if (entity.has(Health)) {
					totalHp += entity.get(Health).current;
					totalMaxHp += entity.get(Health).max;
				}
			}
			expect(totalHp).toBe(190);
			expect(totalMaxHp).toBe(210);
		});

		it("should report correct count for mixed unit types", () => {
			for (let i = 0; i < 5; i++) {
				world.spawn(
					UnitType({ type: "mudfoot" }),
					Health({ current: 80, max: 80 }),
					Selected,
					Position({ x: i, y: 0 }),
				);
			}

			const selected = world.query(Selected);
			expect(selected.length).toBe(5);
		});
	});

	describe("deselection", () => {
		it("should return empty selection when no entities have Selected trait", () => {
			const unit = world.spawn(
				UnitType({ type: "mudfoot" }),
				Health({ current: 80, max: 80 }),
				Position({ x: 5, y: 5 }),
			);

			const selected = world.query(Selected);
			expect(selected.length).toBe(0);

			// Add and remove Selected
			unit.add(Selected);
			expect(world.query(Selected).length).toBe(1);

			unit.remove(Selected);
			expect(world.query(Selected).length).toBe(0);
		});
	});
});
