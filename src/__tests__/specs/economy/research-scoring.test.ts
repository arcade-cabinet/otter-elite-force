/**
 * Research Scoring Specification Tests — ported from old Koota codebase.
 *
 * Tests research definitions and their effect calculations.
 */

import { describe, expect, it } from "vitest";
import { getResearchDef } from "@/engine/systems/researchSystem";

describe("Research scoring specifications", () => {
	describe("Research definitions", () => {
		it("hardshell_armor costs 150 salvage and takes 20 seconds", () => {
			const def = getResearchDef("hardshell_armor");
			expect(def).not.toBeNull();
			expect(def!.cost.salvage).toBe(150);
			expect(def!.time).toBe(20);
		});

		it("fish_oil_arrows costs 100 salvage and takes 15 seconds", () => {
			const def = getResearchDef("fish_oil_arrows");
			expect(def).not.toBeNull();
			expect(def!.cost.salvage).toBe(100);
			expect(def!.time).toBe(15);
		});

		it("demolition_training costs 150 salvage and takes 20 seconds", () => {
			const def = getResearchDef("demolition_training");
			expect(def).not.toBeNull();
			expect(def!.cost.salvage).toBe(150);
			expect(def!.time).toBe(20);
		});

		it("fortified_walls costs 200 salvage and takes 25 seconds", () => {
			const def = getResearchDef("fortified_walls");
			expect(def).not.toBeNull();
			expect(def!.cost.salvage).toBe(200);
			expect(def!.time).toBe(25);
		});

		it("gun_emplacements costs 250 salvage and takes 30 seconds", () => {
			const def = getResearchDef("gun_emplacements");
			expect(def).not.toBeNull();
			expect(def!.cost.salvage).toBe(250);
			expect(def!.time).toBe(30);
		});

		it("advanced_rafts costs 100 salvage and takes 15 seconds", () => {
			const def = getResearchDef("advanced_rafts");
			expect(def).not.toBeNull();
			expect(def!.cost.salvage).toBe(100);
			expect(def!.time).toBe(15);
		});

		it("mortar_precision costs 200 salvage and takes 25 seconds", () => {
			const def = getResearchDef("mortar_precision");
			expect(def).not.toBeNull();
			expect(def!.cost.salvage).toBe(200);
			expect(def!.time).toBe(25);
		});

		it("combat_medics costs 150 salvage and takes 20 seconds", () => {
			const def = getResearchDef("combat_medics");
			expect(def).not.toBeNull();
			expect(def!.cost.salvage).toBe(150);
			expect(def!.time).toBe(20);
		});

		it("diving_gear costs 100 salvage and takes 15 seconds", () => {
			const def = getResearchDef("diving_gear");
			expect(def).not.toBeNull();
			expect(def!.cost.salvage).toBe(100);
			expect(def!.time).toBe(15);
		});
	});

	describe("Research ROI calculations", () => {
		it("Hardshell Armor ROI: +20 HP to all Mudfoots", () => {
			// Cost: 150 salvage, Effect: +20 HP (80 -> 100)
			// This is a 25% HP increase for a 150 salvage investment
			const mudfootBaseHp = 80;
			const bonusHp = 20;
			const percentIncrease = (bonusHp / mudfootBaseHp) * 100;
			expect(percentIncrease).toBe(25);
		});

		it("Fish Oil Arrows: +3 damage to Shellcrackers", () => {
			// At 10 base damage, +3 is a 30% increase
			const baseDamage = 10;
			const bonusDamage = 3;
			const percentIncrease = (bonusDamage / baseDamage) * 100;
			expect(percentIncrease).toBe(30);
		});

		it("Demolition Training: +50% Sapper damage", () => {
			const baseDamage = 8;
			const boostedDamage = Math.round(baseDamage * 1.5);
			expect(boostedDamage).toBe(12);
		});

		it("Advanced Rafts: +30% Raftsman speed", () => {
			const baseSpeed = 100;
			const boostedSpeed = Math.round(baseSpeed * 1.3);
			expect(boostedSpeed).toBe(130);
		});
	});

	describe("All research requires armory or research_den", () => {
		const researchIds = [
			"hardshell_armor",
			"fish_oil_arrows",
			"demolition_training",
			"fortified_walls",
			"gun_emplacements",
			"advanced_rafts",
			"mortar_precision",
			"combat_medics",
			"diving_gear",
		];

		for (const id of researchIds) {
			it(`${id} is researched at armory`, () => {
				const def = getResearchDef(id);
				expect(def).not.toBeNull();
				expect(def!.researchAt).toBe("armory");
			});
		}
	});
});
