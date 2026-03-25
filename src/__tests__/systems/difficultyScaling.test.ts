/**
 * Tests for US-069: AI difficulty scaling per mode.
 *
 * - Support: enemy damage x0.75, player income x1.25
 * - Tactical: 1.0x baseline
 * - Elite: enemy damage x1.25, player income x0.75
 * - Read from CampaignProgress singleton
 * - Apply in combatSystem and economySystem
 */

import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CampaignProgress } from "@/ecs/traits/state";
import {
	applyEnemyDamageModifier,
	applyPlayerIncomeModifier,
	getDifficultyModifiers,
	getModifiersForDifficulty,
} from "@/systems/difficultyScaling";

describe("US-069: Difficulty Scaling", () => {
	describe("modifier tables", () => {
		it("Support: enemy damage x0.75, player income x1.25", () => {
			const mods = getModifiersForDifficulty("support");
			expect(mods.enemyDamageMultiplier).toBe(0.75);
			expect(mods.playerIncomeMultiplier).toBe(1.25);
			expect(mods.level).toBe("support");
		});

		it("Tactical: 1.0x baseline for all modifiers", () => {
			const mods = getModifiersForDifficulty("tactical");
			expect(mods.enemyDamageMultiplier).toBe(1.0);
			expect(mods.playerIncomeMultiplier).toBe(1.0);
			expect(mods.level).toBe("tactical");
		});

		it("Elite: enemy damage x1.25, player income x0.75", () => {
			const mods = getModifiersForDifficulty("elite");
			expect(mods.enemyDamageMultiplier).toBe(1.25);
			expect(mods.playerIncomeMultiplier).toBe(0.75);
			expect(mods.level).toBe("elite");
		});

		it("unknown difficulty falls back to tactical baseline", () => {
			const mods = getModifiersForDifficulty("nightmare");
			expect(mods.enemyDamageMultiplier).toBe(1.0);
			expect(mods.playerIncomeMultiplier).toBe(1.0);
		});
	});

	describe("applyEnemyDamageModifier", () => {
		it("Support: 10 damage becomes 8 (rounded)", () => {
			const mods = getModifiersForDifficulty("support");
			expect(applyEnemyDamageModifier(10, mods)).toBe(8);
		});

		it("Tactical: 10 damage stays 10", () => {
			const mods = getModifiersForDifficulty("tactical");
			expect(applyEnemyDamageModifier(10, mods)).toBe(10);
		});

		it("Elite: 10 damage becomes 13 (rounded)", () => {
			const mods = getModifiersForDifficulty("elite");
			expect(applyEnemyDamageModifier(10, mods)).toBe(13);
		});

		it("always deals minimum 1 damage", () => {
			const mods = getModifiersForDifficulty("support");
			expect(applyEnemyDamageModifier(0, mods)).toBe(1);
		});

		it("Gator damage (18) on Support = 14", () => {
			const mods = getModifiersForDifficulty("support");
			expect(applyEnemyDamageModifier(18, mods)).toBe(14);
		});

		it("Gator damage (18) on Elite = 23", () => {
			const mods = getModifiersForDifficulty("elite");
			expect(applyEnemyDamageModifier(18, mods)).toBe(23);
		});
	});

	describe("applyPlayerIncomeModifier", () => {
		it("Support: 10 income becomes 13 (rounded)", () => {
			const mods = getModifiersForDifficulty("support");
			expect(applyPlayerIncomeModifier(10, mods)).toBe(13);
		});

		it("Tactical: 10 income stays 10", () => {
			const mods = getModifiersForDifficulty("tactical");
			expect(applyPlayerIncomeModifier(10, mods)).toBe(10);
		});

		it("Elite: 10 income becomes 8 (rounded)", () => {
			const mods = getModifiersForDifficulty("elite");
			expect(applyPlayerIncomeModifier(10, mods)).toBe(8);
		});

		it("never goes below 0", () => {
			const mods = getModifiersForDifficulty("elite");
			expect(applyPlayerIncomeModifier(0, mods)).toBe(0);
		});
	});

	describe("getDifficultyModifiers from CampaignProgress singleton", () => {
		let world: ReturnType<typeof createWorld>;

		beforeEach(() => {
			world = createWorld();
		});

		afterEach(() => {
			world.destroy();
		});

		it("should read difficulty from CampaignProgress world trait", () => {
			world.add(CampaignProgress);
			world.set(CampaignProgress, {
				missions: {},
				currentMission: null,
				difficulty: "elite",
			});

			const mods = getDifficultyModifiers(world);
			expect(mods.enemyDamageMultiplier).toBe(1.25);
			expect(mods.playerIncomeMultiplier).toBe(0.75);
			expect(mods.level).toBe("elite");
		});

		it("should default to tactical when CampaignProgress has default difficulty", () => {
			world.add(CampaignProgress);

			const mods = getDifficultyModifiers(world);
			// Default CampaignProgress.difficulty is "support"
			expect(mods.enemyDamageMultiplier).toBe(0.75);
			expect(mods.level).toBe("support");
		});

		it("should return tactical baseline when CampaignProgress not added", () => {
			const mods = getDifficultyModifiers(world);
			expect(mods.enemyDamageMultiplier).toBe(1.0);
			expect(mods.playerIncomeMultiplier).toBe(1.0);
		});

		it("should update when difficulty changes mid-session", () => {
			world.add(CampaignProgress);
			world.set(CampaignProgress, {
				missions: {},
				currentMission: null,
				difficulty: "support",
			});

			let mods = getDifficultyModifiers(world);
			expect(mods.level).toBe("support");

			world.set(CampaignProgress, {
				missions: {},
				currentMission: null,
				difficulty: "elite",
			});

			mods = getDifficultyModifiers(world);
			expect(mods.level).toBe("elite");
		});
	});

	describe("integration: modifiers with actual unit stats", () => {
		it("Croc Champion (25 dmg) on Support deals 19 base damage", () => {
			const mods = getModifiersForDifficulty("support");
			expect(applyEnemyDamageModifier(25, mods)).toBe(19);
		});

		it("Croc Champion (25 dmg) on Elite deals 31 base damage", () => {
			const mods = getModifiersForDifficulty("elite");
			expect(applyEnemyDamageModifier(25, mods)).toBe(31);
		});

		it("Fish trap income (3 per trap, 4 traps = 12) on Support = 15", () => {
			const mods = getModifiersForDifficulty("support");
			expect(applyPlayerIncomeModifier(12, mods)).toBe(15);
		});

		it("Fish trap income (3 per trap, 4 traps = 12) on Elite = 9", () => {
			const mods = getModifiersForDifficulty("elite");
			expect(applyPlayerIncomeModifier(12, mods)).toBe(9);
		});
	});
});
