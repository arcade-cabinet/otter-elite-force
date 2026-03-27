import { describe, expect, it } from "vitest";
import { getUnitDef, UNIT_REGISTRY } from "./units";

describe("engine/content/units", () => {
	it("contains all expected URA units", () => {
		const uraUnits = [...UNIT_REGISTRY.values()].filter((u) => u.faction === "ura");
		// 7 base units + 6 heroes = 13
		expect(uraUnits.length).toBe(13);
	});

	it("contains all expected Scale-Guard units", () => {
		const sgUnits = [...UNIT_REGISTRY.values()].filter((u) => u.faction === "scale_guard");
		expect(sgUnits.length).toBe(8);
	});

	it("contains neutral units", () => {
		const neutralUnits = [...UNIT_REGISTRY.values()].filter((u) => u.faction === "neutral");
		expect(neutralUnits.length).toBeGreaterThanOrEqual(2);
	});

	it("getUnitDef returns a valid unit for known IDs", () => {
		const mudfoot = getUnitDef("mudfoot");
		expect(mudfoot.id).toBe("mudfoot");
		expect(mudfoot.name).toBe("Mudfoot");
		expect(mudfoot.faction).toBe("ura");
		expect(mudfoot.hp).toBeGreaterThan(0);
		expect(mudfoot.attackDamage).toBeGreaterThan(0);
	});

	it("getUnitDef throws for unknown ID", () => {
		expect(() => getUnitDef("nonexistent_unit")).toThrow("unknown unit ID");
	});

	it("all units have valid stats (hp > 0, speed >= 0)", () => {
		for (const [id, unit] of UNIT_REGISTRY) {
			expect(unit.hp, `${id} hp`).toBeGreaterThan(0);
			expect(unit.speed, `${id} speed`).toBeGreaterThanOrEqual(0);
			expect(unit.visionRadius, `${id} visionRadius`).toBeGreaterThanOrEqual(0);
		}
	});

	it("all units have non-negative costs", () => {
		for (const [id, unit] of UNIT_REGISTRY) {
			expect(unit.trainCost.fish, `${id} fish cost`).toBeGreaterThanOrEqual(0);
			expect(unit.trainCost.timber, `${id} timber cost`).toBeGreaterThanOrEqual(0);
			expect(unit.trainCost.salvage, `${id} salvage cost`).toBeGreaterThanOrEqual(0);
		}
	});

	it("all units have a valid animal sprite reference", () => {
		const validAnimals = [
			"otter",
			"crocodile",
			"snake",
			"cobra",
			"boar",
			"fox",
			"squirrel",
			"hedgehog",
			"vulture",
			"porcupine",
			"skunk",
			"naked_mole_rat",
		];
		for (const [id, unit] of UNIT_REGISTRY) {
			expect(validAnimals, `${id} animal '${unit.animal}'`).toContain(unit.animal);
		}
	});

	it("all trainable units reference a valid building", () => {
		const validBuildings = [
			"none",
			"command_post",
			"barracks",
			"armory",
			"dock",
			"spawning_pool",
			"siphon",
		];
		for (const [id, unit] of UNIT_REGISTRY) {
			expect(validBuildings, `${id} trainedAt '${unit.trainedAt}'`).toContain(unit.trainedAt);
		}
	});

	it("heroes have popCost of 0", () => {
		const heroes = [...UNIT_REGISTRY.values()].filter((u) => u.category === "hero");
		for (const hero of heroes) {
			expect(hero.popCost, `${hero.id} popCost`).toBe(0);
		}
	});

	it("worker units can swim", () => {
		const riverRat = getUnitDef("river_rat");
		expect(riverRat.canSwim).toBe(true);
	});

	it("divers can stealth", () => {
		const diverUnit = getUnitDef("diver");
		expect(diverUnit.canStealth).toBe(true);
	});

	it("mission unlock numbers are within valid range (1-16)", () => {
		for (const [id, unit] of UNIT_REGISTRY) {
			expect(unit.unlocksAtMission, `${id} unlocksAtMission`).toBeGreaterThanOrEqual(1);
			expect(unit.unlocksAtMission, `${id} unlocksAtMission`).toBeLessThanOrEqual(16);
		}
	});
});
