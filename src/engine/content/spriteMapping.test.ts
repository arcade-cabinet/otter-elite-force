import { describe, expect, it } from "vitest";
import { BUILDING_REGISTRY } from "./buildings";
import {
	getSpriteForBuilding,
	getSpriteForUnit,
	hasBuildingSprite,
	hasUnitSprite,
} from "./spriteMapping";
import { UNIT_REGISTRY } from "./units";

describe("engine/content/spriteMapping", () => {
	it("every unit in UNIT_REGISTRY has a sprite mapping", () => {
		for (const [id] of UNIT_REGISTRY) {
			expect(hasUnitSprite(id), `unit '${id}' missing sprite mapping`).toBe(true);
		}
	});

	it("getSpriteForUnit returns atlas and defaultAnim", () => {
		const mapping = getSpriteForUnit("mudfoot");
		expect(mapping.atlas).toBe("otter");
		expect(mapping.defaultAnim).toBeTruthy();
	});

	it("getSpriteForUnit throws for unknown unit", () => {
		expect(() => getSpriteForUnit("nonexistent")).toThrow("no sprite mapping");
	});

	it("Scale-Guard units map to reptilian atlases", () => {
		const gator = getSpriteForUnit("gator");
		expect(gator.atlas).toBe("crocodile");

		const viper = getSpriteForUnit("viper");
		expect(viper.atlas).toBe("snake");

		const serpent = getSpriteForUnit("serpent_king");
		expect(serpent.atlas).toBe("cobra");
	});

	it("OEF units map to otter atlas", () => {
		const uraUnitIds = [
			"river_rat",
			"mudfoot",
			"shellcracker",
			"sapper",
			"raftsman",
			"mortar_otter",
			"diver",
		];
		for (const id of uraUnitIds) {
			const mapping = getSpriteForUnit(id);
			expect(mapping.atlas, `${id} atlas`).toBe("otter");
		}
	});

	it("every building in BUILDING_REGISTRY has a sprite mapping entry", () => {
		for (const [id] of BUILDING_REGISTRY) {
			expect(hasBuildingSprite(id), `building '${id}' missing sprite mapping`).toBe(true);
		}
	});

	it("most buildings return null (tile-based rendering)", () => {
		const barracks = getSpriteForBuilding("barracks");
		expect(barracks).toBeNull();

		const lodge = getSpriteForBuilding("burrow");
		expect(lodge).toBeNull();
	});

	it("getSpriteForBuilding throws for unknown building", () => {
		expect(() => getSpriteForBuilding("nonexistent")).toThrow("unknown building");
	});

	it("neutral units have valid sprite mappings", () => {
		const boar = getSpriteForUnit("wild_boar");
		expect(boar.atlas).toBe("boar");

		const vulture = getSpriteForUnit("scavenger_vulture");
		expect(vulture.atlas).toBe("vulture");
	});
});
