import { describe, expect, it, beforeEach } from "vitest";
import {
	calculateTimeScore,
	calculateUnitsLostScore,
	calculateBonusScore,
	calculateMissionScore,
	getStarRating,
	MissionStats,
	type MissionScoreInput,
	type MissionScoreResult,
} from "../../systems/scoringSystem";

describe("scoringSystem", () => {
	// -----------------------------------------------------------------------
	// Time score (40% weight)
	// -----------------------------------------------------------------------

	describe("calculateTimeScore", () => {
		it("should return 1.0 for completing at or under par time", () => {
			// Par time 300s, completed in 200s
			expect(calculateTimeScore(200, 300)).toBe(1.0);
		});

		it("should return 1.0 for completing exactly at par time", () => {
			expect(calculateTimeScore(300, 300)).toBe(1.0);
		});

		it("should return 0.5 for completing at double par time", () => {
			// 600s elapsed, 300s par → ratio = 2.0 → score = 1 / 2.0 = 0.5
			expect(calculateTimeScore(600, 300)).toBeCloseTo(0.5, 2);
		});

		it("should degrade gracefully for very slow completions", () => {
			// 3x par time → score = 1/3 ≈ 0.33
			expect(calculateTimeScore(900, 300)).toBeCloseTo(0.333, 2);
		});

		it("should clamp to minimum 0.1 for extremely slow completions", () => {
			// 100x par time → would be 0.01, but clamped to 0.1
			expect(calculateTimeScore(30000, 300)).toBe(0.1);
		});

		it("should handle zero elapsed time as perfect score", () => {
			expect(calculateTimeScore(0, 300)).toBe(1.0);
		});
	});

	// -----------------------------------------------------------------------
	// Units lost score (30% weight)
	// -----------------------------------------------------------------------

	describe("calculateUnitsLostScore", () => {
		it("should return 1.0 for zero units lost", () => {
			expect(calculateUnitsLostScore(0, 10)).toBe(1.0);
		});

		it("should return 0.5 for losing half the units spawned", () => {
			expect(calculateUnitsLostScore(5, 10)).toBeCloseTo(0.5, 2);
		});

		it("should return 0.0 for losing all units spawned", () => {
			expect(calculateUnitsLostScore(10, 10)).toBe(0.0);
		});

		it("should handle zero units spawned (no units scenario)", () => {
			// Edge case: if no units were spawned, losing 0 is perfect
			expect(calculateUnitsLostScore(0, 0)).toBe(1.0);
		});

		it("should clamp if somehow lost more than spawned", () => {
			// Defensive: should not go negative
			expect(calculateUnitsLostScore(15, 10)).toBe(0.0);
		});
	});

	// -----------------------------------------------------------------------
	// Bonus objectives score (30% weight)
	// -----------------------------------------------------------------------

	describe("calculateBonusScore", () => {
		it("should return 1.0 for completing all bonus objectives", () => {
			expect(calculateBonusScore(3, 3)).toBe(1.0);
		});

		it("should return 0.0 for completing no bonus objectives", () => {
			expect(calculateBonusScore(0, 3)).toBe(0.0);
		});

		it("should return proportional score for partial completion", () => {
			expect(calculateBonusScore(1, 3)).toBeCloseTo(0.333, 2);
			expect(calculateBonusScore(2, 3)).toBeCloseTo(0.667, 2);
		});

		it("should return 1.0 when there are no bonus objectives", () => {
			// If mission has no bonus objectives, this component is full marks
			expect(calculateBonusScore(0, 0)).toBe(1.0);
		});
	});

	// -----------------------------------------------------------------------
	// Star rating
	// -----------------------------------------------------------------------

	describe("getStarRating", () => {
		it("should return 3 stars (Gold) for score >= 90%", () => {
			expect(getStarRating(0.9)).toBe(3);
			expect(getStarRating(1.0)).toBe(3);
			expect(getStarRating(0.95)).toBe(3);
		});

		it("should return 2 stars (Silver) for score >= 75%", () => {
			expect(getStarRating(0.75)).toBe(2);
			expect(getStarRating(0.89)).toBe(2);
		});

		it("should return 1 star (Bronze) for score >= 50%", () => {
			expect(getStarRating(0.5)).toBe(1);
			expect(getStarRating(0.74)).toBe(1);
		});

		it("should return 0 stars for score < 50%", () => {
			expect(getStarRating(0.49)).toBe(0);
			expect(getStarRating(0.0)).toBe(0);
		});
	});

	// -----------------------------------------------------------------------
	// Full mission score calculation
	// -----------------------------------------------------------------------

	describe("calculateMissionScore", () => {
		it("should return Gold for a perfect mission", () => {
			const input: MissionScoreInput = {
				elapsedSeconds: 200,
				parTimeSeconds: 300,
				unitsLost: 0,
				unitsSpawned: 10,
				bonusCompleted: 2,
				bonusTotal: 2,
			};

			const result = calculateMissionScore(input);

			// time: 1.0 * 0.4 = 0.4
			// units: 1.0 * 0.3 = 0.3
			// bonus: 1.0 * 0.3 = 0.3
			// total: 1.0
			expect(result.totalScore).toBeCloseTo(1.0, 2);
			expect(result.stars).toBe(3);
			expect(result.timeScore).toBeCloseTo(1.0, 2);
			expect(result.unitsLostScore).toBeCloseTo(1.0, 2);
			expect(result.bonusScore).toBeCloseTo(1.0, 2);
		});

		it("should return Silver for a decent mission", () => {
			const input: MissionScoreInput = {
				elapsedSeconds: 400,
				parTimeSeconds: 300,
				unitsLost: 2,
				unitsSpawned: 10,
				bonusCompleted: 1,
				bonusTotal: 2,
			};

			const result = calculateMissionScore(input);

			// time: (300/400) = 0.75 * 0.4 = 0.3
			// units: (1 - 2/10) = 0.8 * 0.3 = 0.24
			// bonus: (1/2) = 0.5 * 0.3 = 0.15
			// total: 0.69
			expect(result.totalScore).toBeCloseTo(0.69, 1);
			expect(result.stars).toBe(1); // Bronze (>= 50%, < 75%)
		});

		it("should return Bronze for a slow mission with losses", () => {
			const input: MissionScoreInput = {
				elapsedSeconds: 600,
				parTimeSeconds: 300,
				unitsLost: 5,
				unitsSpawned: 10,
				bonusCompleted: 0,
				bonusTotal: 2,
			};

			const result = calculateMissionScore(input);

			// time: (300/600) = 0.5 * 0.4 = 0.2
			// units: (1 - 5/10) = 0.5 * 0.3 = 0.15
			// bonus: 0/2 = 0.0 * 0.3 = 0.0
			// total: 0.35
			expect(result.totalScore).toBeCloseTo(0.35, 1);
			expect(result.stars).toBe(0); // No stars (< 50%)
		});

		it("should handle mission with no bonus objectives as Gold-eligible", () => {
			const input: MissionScoreInput = {
				elapsedSeconds: 250,
				parTimeSeconds: 300,
				unitsLost: 1,
				unitsSpawned: 10,
				bonusCompleted: 0,
				bonusTotal: 0, // No bonus objectives in this mission
			};

			const result = calculateMissionScore(input);

			// time: 1.0 * 0.4 = 0.4
			// units: 0.9 * 0.3 = 0.27
			// bonus: 1.0 (no bonus = full marks) * 0.3 = 0.3
			// total: 0.97
			expect(result.totalScore).toBeCloseTo(0.97, 1);
			expect(result.stars).toBe(3);
		});

		it("should include breakdown scores in result", () => {
			const input: MissionScoreInput = {
				elapsedSeconds: 300,
				parTimeSeconds: 300,
				unitsLost: 3,
				unitsSpawned: 10,
				bonusCompleted: 1,
				bonusTotal: 1,
			};

			const result = calculateMissionScore(input);

			expect(result).toHaveProperty("timeScore");
			expect(result).toHaveProperty("unitsLostScore");
			expect(result).toHaveProperty("bonusScore");
			expect(result).toHaveProperty("totalScore");
			expect(result).toHaveProperty("stars");

			expect(result.timeScore).toBeCloseTo(1.0, 2);
			expect(result.unitsLostScore).toBeCloseTo(0.7, 2);
			expect(result.bonusScore).toBeCloseTo(1.0, 2);
			// total: 1.0*0.4 + 0.7*0.3 + 1.0*0.3 = 0.4 + 0.21 + 0.3 = 0.91
			expect(result.totalScore).toBeCloseTo(0.91, 1);
			expect(result.stars).toBe(3); // Gold
		});

		it("should handle edge case of zero par time gracefully", () => {
			const input: MissionScoreInput = {
				elapsedSeconds: 100,
				parTimeSeconds: 0,
				unitsLost: 0,
				unitsSpawned: 5,
				bonusCompleted: 0,
				bonusTotal: 0,
			};

			// Zero par time should give full time score (no time limit)
			const result = calculateMissionScore(input);
			expect(result.timeScore).toBe(1.0);
		});
	});

	// -----------------------------------------------------------------------
	// MissionStats tracker
	// -----------------------------------------------------------------------

	describe("MissionStats", () => {
		let stats: MissionStats;

		beforeEach(() => {
			stats = new MissionStats(300, 2); // 300s par time, 2 bonus objectives
		});

		it("should initialize with zero counters", () => {
			expect(stats.elapsedSeconds).toBe(0);
			expect(stats.unitsSpawned).toBe(0);
			expect(stats.unitsLost).toBe(0);
			expect(stats.bonusCompleted).toBe(0);
		});

		it("should accumulate elapsed time via tick", () => {
			stats.tick(5);
			stats.tick(3);
			expect(stats.elapsedSeconds).toBe(8);
		});

		it("should track unit spawns", () => {
			stats.recordUnitSpawned();
			stats.recordUnitSpawned();
			stats.recordUnitSpawned();
			expect(stats.unitsSpawned).toBe(3);
		});

		it("should track unit deaths", () => {
			stats.recordUnitSpawned();
			stats.recordUnitSpawned();
			stats.recordUnitLost();
			expect(stats.unitsLost).toBe(1);
		});

		it("should track bonus objective completion", () => {
			stats.recordBonusCompleted();
			expect(stats.bonusCompleted).toBe(1);
		});

		it("should not exceed bonusTotal", () => {
			stats.recordBonusCompleted();
			stats.recordBonusCompleted();
			stats.recordBonusCompleted(); // 3rd call, but only 2 total
			expect(stats.bonusCompleted).toBe(2);
		});

		it("should produce a valid MissionScoreInput", () => {
			stats.tick(150);
			stats.recordUnitSpawned();
			stats.recordUnitSpawned();
			stats.recordUnitLost();
			stats.recordBonusCompleted();

			const input = stats.toScoreInput();

			expect(input.elapsedSeconds).toBe(150);
			expect(input.parTimeSeconds).toBe(300);
			expect(input.unitsSpawned).toBe(2);
			expect(input.unitsLost).toBe(1);
			expect(input.bonusCompleted).toBe(1);
			expect(input.bonusTotal).toBe(2);
		});

		it("should calculate final score via finalize()", () => {
			stats.tick(200); // Under par
			stats.recordUnitSpawned();
			stats.recordBonusCompleted();
			stats.recordBonusCompleted();

			const result = stats.finalize();

			expect(result.stars).toBe(3); // Gold — fast, no losses, all bonus
			expect(result.totalScore).toBeCloseTo(1.0, 1);
		});

		it("should reset all counters", () => {
			stats.tick(100);
			stats.recordUnitSpawned();
			stats.recordUnitLost();
			stats.recordBonusCompleted();

			stats.reset(600, 3); // New par time, new bonus count

			expect(stats.elapsedSeconds).toBe(0);
			expect(stats.unitsSpawned).toBe(0);
			expect(stats.unitsLost).toBe(0);
			expect(stats.bonusCompleted).toBe(0);
			expect(stats.parTimeSeconds).toBe(600);
			expect(stats.bonusTotal).toBe(3);
		});
	});
});
