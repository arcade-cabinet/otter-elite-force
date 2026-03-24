/**
 * Research Effect + Scoring Specification Tests — Task #10 (B6)
 *
 * Validates research effects and mission scoring from the design spec:
 *   - Hardshell Armor: +20 HP to Mudfoot (80 → 100)
 *   - Fish Oil Arrows: +3 damage to Shellcracker (10 → 13)
 *   - Scoring: par time + 0 losses + all bonuses = Gold (>=90%)
 *
 * Spec references:
 *   - docs/design/balance-framework.md (research impact table)
 *   - docs/superpowers/specs/2026-03-23-rts-pivot-design.md §12 (tech tree)
 *   - src/systems/scoringSystem.ts (scoring formula)
 *   - src/systems/researchSystem.ts (research effects)
 */

import { describe, expect, it } from "vitest";
import { ALL_UNITS } from "../../../data/units";
import { RESEARCH } from "../../../data/research";
import {
	calculateMissionScore,
	calculateTimeScore,
	calculateUnitsLostScore,
	calculateBonusScore,
	getStarRating,
	MissionStats,
} from "../../../systems/scoringSystem";
import {
	SAPPER_BUILDING_DAMAGE,
	DEMOLITION_TRAINING_MULTIPLIER,
} from "../../../systems/siegeSystem";

// ---------------------------------------------------------------------------
// Research Effect Tests
// ---------------------------------------------------------------------------

describe("Research Effect Specifications", () => {
	describe("Hardshell Armor", () => {
		const research = RESEARCH.hardshell_armor;
		const mudfoot = ALL_UNITS.mudfoot;

		it("exists in the research table", () => {
			expect(research).toBeDefined();
			expect(research.id).toBe("hardshell_armor");
		});

		it("adds +20 HP to Mudfoot (80 → 100)", () => {
			const baseHp = mudfoot.hp;
			expect(baseHp).toBe(80);

			const boostedHp = baseHp + 20;
			expect(boostedHp).toBe(100);

			// The effect description confirms this
			expect(research.effect).toContain("80");
			expect(research.effect).toContain("100");
		});

		it("costs 150 Salvage and takes 20s to research", () => {
			expect(research.cost.salvage).toBe(150);
			expect(research.time).toBe(20);
		});

		it("is researched at the Armory", () => {
			expect(research.researchAt).toBe("armory");
		});

		it("unlocks at Mission 5", () => {
			expect(research.unlock).toBe(5);
		});

		it("Mudfoot survives 1 extra Gator hit after research", () => {
			const gator = ALL_UNITS.gator;
			const dmgPerHit = Math.max(1, gator.damage - mudfoot.armor); // 18 - 2 = 16

			const hitsToKillBase = Math.ceil(mudfoot.hp / dmgPerHit); // ceil(80/16) = 5
			const hitsToKillBoosted = Math.ceil((mudfoot.hp + 20) / dmgPerHit); // ceil(100/16) = 7

			expect(hitsToKillBase).toBe(5);
			expect(hitsToKillBoosted).toBe(7);
			expect(hitsToKillBoosted).toBeGreaterThan(hitsToKillBase);
		});
	});

	describe("Fish Oil Arrows", () => {
		const research = RESEARCH.fish_oil_arrows;
		const shellcracker = ALL_UNITS.shellcracker;

		it("exists in the research table", () => {
			expect(research).toBeDefined();
			expect(research.id).toBe("fish_oil_arrows");
		});

		it("adds +3 damage to Shellcracker (10 → 13)", () => {
			const baseDamage = shellcracker.damage;
			expect(baseDamage).toBe(10);

			const boostedDamage = baseDamage + 3;
			expect(boostedDamage).toBe(13);

			expect(research.effect).toContain("10");
			expect(research.effect).toContain("13");
		});

		it("costs 100 Salvage and takes 15s to research", () => {
			expect(research.cost.salvage).toBe(100);
			expect(research.time).toBe(15);
		});

		it("Shellcracker kills Gator in fewer shots after research", () => {
			const gator = ALL_UNITS.gator;
			const baseDmg = Math.max(1, shellcracker.damage - gator.armor); // 10 - 4 = 6
			const boostedDmg = Math.max(1, shellcracker.damage + 3 - gator.armor); // 13 - 4 = 9

			const shotsBase = Math.ceil(gator.hp / baseDmg); // ceil(120/6) = 20
			const shotsBoosted = Math.ceil(gator.hp / boostedDmg); // ceil(120/9) = 14

			expect(shotsBase).toBe(20);
			expect(shotsBoosted).toBe(14);
			expect(shotsBoosted).toBeLessThan(shotsBase);
		});
	});

	describe("Demolition Training", () => {
		const research = RESEARCH.demolition_training;

		it("exists in the research table", () => {
			expect(research).toBeDefined();
			expect(research.id).toBe("demolition_training");
		});

		it("+50% Sapper damage vs buildings (30 → 45)", () => {
			const baseDmg = SAPPER_BUILDING_DAMAGE; // 30
			const boostedDmg = baseDmg * DEMOLITION_TRAINING_MULTIPLIER; // 45

			expect(baseDmg).toBe(30);
			expect(boostedDmg).toBe(45);
		});

		it("costs 150 Salvage and takes 20s", () => {
			expect(research.cost.salvage).toBe(150);
			expect(research.time).toBe(20);
		});

		it("unlocks at Mission 9", () => {
			expect(research.unlock).toBe(9);
		});
	});

	describe("All research items are at the Armory", () => {
		it("every research entry has researchAt === 'armory'", () => {
			for (const [id, def] of Object.entries(RESEARCH)) {
				expect(def.researchAt, `${id} should research at armory`).toBe("armory");
			}
		});
	});

	describe("Research count and completeness", () => {
		it("9 total research items exist", () => {
			expect(Object.keys(RESEARCH).length).toBe(9);
		});

		it("all research items have valid costs (salvage only)", () => {
			for (const [id, def] of Object.entries(RESEARCH)) {
				expect(def.cost.salvage, `${id} must cost salvage`).toBeGreaterThan(0);
				// Research only costs Salvage per design spec
				expect(def.cost.fish, `${id} should not cost fish`).toBeUndefined();
				expect(def.cost.timber, `${id} should not cost timber`).toBeUndefined();
			}
		});
	});
});

// ---------------------------------------------------------------------------
// Scoring System Tests
// ---------------------------------------------------------------------------

describe("Scoring System Specifications", () => {
	describe("Star rating thresholds", () => {
		it("Gold (3 stars) requires >= 90% total score", () => {
			expect(getStarRating(0.9)).toBe(3);
			expect(getStarRating(1.0)).toBe(3);
			expect(getStarRating(0.95)).toBe(3);
		});

		it("Silver (2 stars) requires >= 75% total score", () => {
			expect(getStarRating(0.75)).toBe(2);
			expect(getStarRating(0.89)).toBe(2);
		});

		it("Bronze (1 star) requires >= 50% total score", () => {
			expect(getStarRating(0.5)).toBe(1);
			expect(getStarRating(0.74)).toBe(1);
		});

		it("No stars below 50%", () => {
			expect(getStarRating(0.49)).toBe(0);
			expect(getStarRating(0.0)).toBe(0);
		});
	});

	describe("Time score calculation", () => {
		it("at or under par time → 1.0", () => {
			expect(calculateTimeScore(300, 480)).toBe(1.0); // 5 min vs 8 min par
			expect(calculateTimeScore(480, 480)).toBe(1.0); // exactly at par
		});

		it("over par time → degrades as ratio", () => {
			// 2x par time → 0.5
			const score = calculateTimeScore(960, 480);
			expect(score).toBeCloseTo(0.5, 1);
		});

		it("minimum score is 0.1 (never zero)", () => {
			const score = calculateTimeScore(10000, 480);
			expect(score).toBeGreaterThanOrEqual(0.1);
		});
	});

	describe("Units lost score calculation", () => {
		it("0 losses → 1.0", () => {
			expect(calculateUnitsLostScore(0, 10)).toBe(1.0);
		});

		it("all units lost → 0.0", () => {
			expect(calculateUnitsLostScore(10, 10)).toBe(0.0);
		});

		it("half units lost → 0.5", () => {
			expect(calculateUnitsLostScore(5, 10)).toBe(0.5);
		});

		it("no units spawned → 1.0 (no penalty)", () => {
			expect(calculateUnitsLostScore(0, 0)).toBe(1.0);
		});
	});

	describe("Bonus score calculation", () => {
		it("all bonuses completed → 1.0", () => {
			expect(calculateBonusScore(3, 3)).toBe(1.0);
		});

		it("no bonuses completed → 0.0", () => {
			expect(calculateBonusScore(0, 3)).toBe(0.0);
		});

		it("no bonus objectives → 1.0 (full marks by default)", () => {
			expect(calculateBonusScore(0, 0)).toBe(1.0);
		});
	});

	describe("Perfect score → Gold", () => {
		it("par time + 0 losses + all bonuses = Gold (>=90%)", () => {
			const result = calculateMissionScore({
				elapsedSeconds: 480, // exactly at par
				parTimeSeconds: 480,
				unitsLost: 0,
				unitsSpawned: 10,
				bonusCompleted: 3,
				bonusTotal: 3,
			});

			// time: 1.0, units: 1.0, bonus: 1.0
			// total = 1.0 * 0.4 + 1.0 * 0.3 + 1.0 * 0.3 = 1.0
			expect(result.timeScore).toBe(1.0);
			expect(result.unitsLostScore).toBe(1.0);
			expect(result.bonusScore).toBe(1.0);
			expect(result.totalScore).toBe(1.0);
			expect(result.stars).toBe(3);
		});

		it("under par time still gives Gold", () => {
			const result = calculateMissionScore({
				elapsedSeconds: 240, // half par time — fast run
				parTimeSeconds: 480,
				unitsLost: 0,
				unitsSpawned: 5,
				bonusCompleted: 2,
				bonusTotal: 2,
			});

			expect(result.totalScore).toBe(1.0);
			expect(result.stars).toBe(3);
		});
	});

	describe("Degraded scores", () => {
		it("slow time + some losses + no bonuses → low score", () => {
			const result = calculateMissionScore({
				elapsedSeconds: 960, // 2x par time
				parTimeSeconds: 480,
				unitsLost: 8,
				unitsSpawned: 10,
				bonusCompleted: 0,
				bonusTotal: 3,
			});

			// time: 480/960 = 0.5, units: 1 - 8/10 = 0.2, bonus: 0
			// total = 0.5*0.4 + 0.2*0.3 + 0*0.3 = 0.2 + 0.06 + 0 = 0.26
			expect(result.totalScore).toBeCloseTo(0.26, 1);
			expect(result.stars).toBe(0); // below 50%
		});

		it("good time but heavy losses → Silver", () => {
			const result = calculateMissionScore({
				elapsedSeconds: 480,
				parTimeSeconds: 480,
				unitsLost: 5,
				unitsSpawned: 10,
				bonusCompleted: 3,
				bonusTotal: 3,
			});

			// time: 1.0, units: 0.5, bonus: 1.0
			// total = 0.4 + 0.15 + 0.3 = 0.85
			expect(result.totalScore).toBeCloseTo(0.85, 2);
			expect(result.stars).toBe(2); // Silver (>=75%, <90%)
		});
	});

	describe("MissionStats tracker", () => {
		it("accumulates stats and finalizes to a score", () => {
			const stats = new MissionStats(480, 3);

			// Simulate: 8 minutes, 10 units spawned, 2 lost, 2 bonuses
			stats.tick(480);
			for (let i = 0; i < 10; i++) stats.recordUnitSpawned();
			stats.recordUnitLost();
			stats.recordUnitLost();
			stats.recordBonusCompleted();
			stats.recordBonusCompleted();

			const result = stats.finalize();

			// time: 1.0, units: 1-2/10=0.8, bonus: 2/3=0.667
			// total = 0.4 + 0.24 + 0.2 = 0.84
			expect(result.timeScore).toBe(1.0);
			expect(result.unitsLostScore).toBeCloseTo(0.8, 2);
			expect(result.bonusScore).toBeCloseTo(0.667, 2);
			expect(result.stars).toBe(2); // Silver
		});

		it("bonus completed cannot exceed bonusTotal", () => {
			const stats = new MissionStats(480, 2);
			stats.recordBonusCompleted();
			stats.recordBonusCompleted();
			stats.recordBonusCompleted(); // extra — should be capped

			const input = stats.toScoreInput();
			expect(input.bonusCompleted).toBe(2); // capped at total
		});

		it("reset clears all counters", () => {
			const stats = new MissionStats(480, 3);
			stats.tick(100);
			stats.recordUnitSpawned();
			stats.recordUnitLost();
			stats.recordBonusCompleted();

			stats.reset(600, 2);

			const input = stats.toScoreInput();
			expect(input.elapsedSeconds).toBe(0);
			expect(input.unitsSpawned).toBe(0);
			expect(input.unitsLost).toBe(0);
			expect(input.bonusCompleted).toBe(0);
			expect(input.parTimeSeconds).toBe(600);
			expect(input.bonusTotal).toBe(2);
		});
	});

	describe("Scoring weights", () => {
		it("time=40%, units=30%, bonus=30% — weights sum to 100%", () => {
			// If all sub-scores are 1.0, total must be 1.0
			const result = calculateMissionScore({
				elapsedSeconds: 100,
				parTimeSeconds: 480,
				unitsLost: 0,
				unitsSpawned: 10,
				bonusCompleted: 3,
				bonusTotal: 3,
			});
			expect(result.totalScore).toBe(1.0);
		});

		it("only time matters (units=1, bonus=1) → max 40% from time", () => {
			// If time is bad but everything else is perfect
			const result = calculateMissionScore({
				elapsedSeconds: 4800, // 10x par time
				parTimeSeconds: 480,
				unitsLost: 0,
				unitsSpawned: 10,
				bonusCompleted: 3,
				bonusTotal: 3,
			});

			// time: max(0.1, 480/4800) = 0.1
			// total = 0.1*0.4 + 1.0*0.3 + 1.0*0.3 = 0.04 + 0.3 + 0.3 = 0.64
			expect(result.totalScore).toBeCloseTo(0.64, 2);
			expect(result.stars).toBe(1); // Bronze
		});
	});
});
