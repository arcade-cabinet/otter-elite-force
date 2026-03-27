import { describe, expect, it } from "vitest";
import { BUILDING_REGISTRY, getBuildingDef } from "./buildings";

describe("engine/content/buildings", () => {
	it("contains all expected URA buildings", () => {
		const uraBuildings = [...BUILDING_REGISTRY.values()].filter((b) => b.faction === "ura");
		expect(uraBuildings.length).toBe(12);
	});

	it("contains all expected Scale-Guard buildings", () => {
		const sgBuildings = [...BUILDING_REGISTRY.values()].filter((b) => b.faction === "scale_guard");
		expect(sgBuildings.length).toBe(9);
	});

	it("getBuildingDef returns a valid building for known IDs", () => {
		const barracks = getBuildingDef("barracks");
		expect(barracks.id).toBe("barracks");
		expect(barracks.name).toBe("Barracks");
		expect(barracks.faction).toBe("ura");
		expect(barracks.hp).toBeGreaterThan(0);
	});

	it("getBuildingDef throws for unknown ID", () => {
		expect(() => getBuildingDef("nonexistent_building")).toThrow("unknown building ID");
	});

	it("all buildings have valid stats (hp > 0)", () => {
		for (const [id, building] of BUILDING_REGISTRY) {
			expect(building.hp, `${id} hp`).toBeGreaterThan(0);
		}
	});

	it("all buildings have non-negative costs", () => {
		for (const [id, building] of BUILDING_REGISTRY) {
			expect(building.buildCost.fish, `${id} fish cost`).toBeGreaterThanOrEqual(0);
			expect(building.buildCost.timber, `${id} timber cost`).toBeGreaterThanOrEqual(0);
			expect(building.buildCost.salvage, `${id} salvage cost`).toBeGreaterThanOrEqual(0);
		}
	});

	it("HQ buildings are flagged correctly", () => {
		const lodge = getBuildingDef("burrow");
		expect(lodge.isHQ).toBe(true);
		const commandPost = getBuildingDef("command_post");
		expect(commandPost.isHQ).toBe(true);
		const barracks = getBuildingDef("barracks");
		expect(barracks.isHQ).toBe(false);
	});

	it("lodge has zero build cost (starting building)", () => {
		const lodge = getBuildingDef("burrow");
		expect(lodge.buildCost.fish).toBe(0);
		expect(lodge.buildCost.timber).toBe(0);
		expect(lodge.buildCost.salvage).toBe(0);
	});

	it("lodge has 1000 HP", () => {
		const lodge = getBuildingDef("burrow");
		expect(lodge.hp).toBe(1000);
	});

	it("watchtower has attack capability", () => {
		const tower = getBuildingDef("watchtower");
		expect(tower.attackDamage).toBeGreaterThan(0);
		expect(tower.attackRange).toBeGreaterThan(0);
	});

	it("fish trap has passive income", () => {
		const fishTrap = getBuildingDef("fish_trap");
		expect(fishTrap.passiveIncome).toBeDefined();
		expect(fishTrap.passiveIncome?.resource).toBe("fish");
		expect(fishTrap.passiveIncome?.amount).toBeGreaterThan(0);
	});

	it("field hospital has heal capability", () => {
		const hospital = getBuildingDef("field_hospital");
		expect(hospital.healRate).toBeGreaterThan(0);
		expect(hospital.healRadius).toBeGreaterThan(0);
	});

	it("production buildings list valid unit IDs", () => {
		for (const [id, building] of BUILDING_REGISTRY) {
			if (building.produces.length > 0) {
				for (const unitId of building.produces) {
					expect(typeof unitId, `${id} produces '${unitId}'`).toBe("string");
					expect(unitId.length, `${id} produces empty string`).toBeGreaterThan(0);
				}
			}
		}
	});

	it("mission unlock numbers are within valid range (1-16)", () => {
		for (const [id, building] of BUILDING_REGISTRY) {
			expect(building.unlocksAtMission, `${id} unlocksAtMission`).toBeGreaterThanOrEqual(1);
			expect(building.unlocksAtMission, `${id} unlocksAtMission`).toBeLessThanOrEqual(16);
		}
	});
});
