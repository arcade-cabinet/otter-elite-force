import { describe, expect, it } from "vitest";
import { getResearchDef, RESEARCH_REGISTRY } from "./research";

describe("engine/content/research", () => {
	it("contains 10 research items", () => {
		expect(RESEARCH_REGISTRY.size).toBe(10);
	});

	it("getResearchDef returns a valid definition for known IDs", () => {
		const armor = getResearchDef("improved_armor");
		expect(armor.id).toBe("improved_armor");
		expect(armor.name).toBe("Improved Armor");
		expect(armor.cost.salvage).toBeGreaterThan(0);
	});

	it("getResearchDef throws for unknown ID", () => {
		expect(() => getResearchDef("nonexistent_research")).toThrow("unknown research ID");
	});

	it("all research items have valid costs", () => {
		for (const [id, research] of RESEARCH_REGISTRY) {
			const totalCost = research.cost.fish + research.cost.timber + research.cost.salvage;
			expect(totalCost, `${id} total cost`).toBeGreaterThan(0);
		}
	});

	it("all research items have positive research times", () => {
		for (const [id, research] of RESEARCH_REGISTRY) {
			expect(research.researchTimeMs, `${id} researchTimeMs`).toBeGreaterThan(0);
		}
	});

	it("all research items are researched at the armory", () => {
		for (const [id, research] of RESEARCH_REGISTRY) {
			expect(research.researchedAt, `${id} researchedAt`).toBe("armory");
		}
	});

	it("all research items have valid effect types", () => {
		const validTypes = ["stat_boost", "unlock_building", "unlock_ability"];
		for (const [id, research] of RESEARCH_REGISTRY) {
			expect(validTypes, `${id} effect type`).toContain(research.effect.type);
		}
	});

	it("all research items have at least one target", () => {
		for (const [id, research] of RESEARCH_REGISTRY) {
			expect(research.effect.targets.length, `${id} targets`).toBeGreaterThan(0);
		}
	});
});
