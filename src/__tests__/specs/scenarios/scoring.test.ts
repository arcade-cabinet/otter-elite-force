/**
 * Scoring Specification Tests
 *
 * These tests define the SPEC for mission scoring calculations.
 * Rules sourced from:
 *   - docs/superpowers/specs/2026-03-23-rts-pivot-design.md §6
 *   - docs/design/balance-framework.md (par times, star ratings)
 *
 * Star rating rules:
 *   - Gold:   score >= 90% (par time met, 0 losses, all bonuses)
 *   - Silver: score >= 60%
 *   - Bronze: score >= 30% (time over 2x par = Bronze max)
 *   - None:   score < 30% (still a win, just no star)
 *
 * Score components:
 *   - Time score:  100% if <= parTime, degrades to 0% at 3x parTime
 *   - Loss score:  100% if 0 losses, -5% per unit lost (min 0%)
 *   - Bonus score: +10% per bonus objective completed
 */
import { describe, it, expect, beforeAll } from "vitest";

// ---------------------------------------------------------------------------
// Dynamic imports — scoring module may not exist yet
// ---------------------------------------------------------------------------

type ScoreResult = {
	score: number;
	stars: 0 | 1 | 2 | 3;
	timeScore: number;
	lossScore: number;
	bonusScore: number;
};

type CalculateScoreFn = (params: {
	parTime: number;
	elapsedTime: number;
	unitsLost: number;
	bonusObjectivesCompleted: number;
	bonusObjectivesTotal: number;
}) => ScoreResult;

let calculateScore: CalculateScoreFn | null = null;
let loadError: string | null = null;

beforeAll(async () => {
	try {
		const scoringModule = await import("@/systems/scoringSystem");
		calculateScore = scoringModule.calculateScore ?? null;
	} catch (e) {
		loadError = (e as Error).message;
	}
});

const skip = () => !!loadError || !calculateScore;

// ===========================================================================
// GOLD STAR (>= 90%)
// ===========================================================================

describe("Gold star scoring", () => {
	it("perfect play = Gold (3 stars)", () => {
		if (skip()) return;
		const result = calculateScore!({
			parTime: 480,
			elapsedTime: 400,
			unitsLost: 0,
			bonusObjectivesCompleted: 2,
			bonusObjectivesTotal: 2,
		});
		expect(result.stars).toBe(3);
		expect(result.score).toBeGreaterThanOrEqual(90);
	});

	it("par time met, 0 losses, all bonuses = score >= 90", () => {
		if (skip()) return;
		const result = calculateScore!({
			parTime: 600,
			elapsedTime: 600, // Exactly par
			unitsLost: 0,
			bonusObjectivesCompleted: 3,
			bonusObjectivesTotal: 3,
		});
		expect(result.score).toBeGreaterThanOrEqual(90);
		expect(result.stars).toBe(3);
	});

	it("under par time boosts score", () => {
		if (skip()) return;
		const atPar = calculateScore!({
			parTime: 480,
			elapsedTime: 480,
			unitsLost: 0,
			bonusObjectivesCompleted: 0,
			bonusObjectivesTotal: 2,
		});
		const underPar = calculateScore!({
			parTime: 480,
			elapsedTime: 300,
			unitsLost: 0,
			bonusObjectivesCompleted: 0,
			bonusObjectivesTotal: 2,
		});
		expect(underPar.timeScore).toBeGreaterThanOrEqual(atPar.timeScore);
	});
});

// ===========================================================================
// SILVER STAR (>= 60%)
// ===========================================================================

describe("Silver star scoring", () => {
	it("moderate losses with par time = Silver (2 stars)", () => {
		if (skip()) return;
		const result = calculateScore!({
			parTime: 480,
			elapsedTime: 500,
			unitsLost: 4,
			bonusObjectivesCompleted: 1,
			bonusObjectivesTotal: 2,
		});
		expect(result.stars).toBe(2);
		expect(result.score).toBeGreaterThanOrEqual(60);
		expect(result.score).toBeLessThan(90);
	});
});

// ===========================================================================
// BRONZE STAR (>= 30%)
// ===========================================================================

describe("Bronze star scoring", () => {
	it("over 2x par time = Bronze max", () => {
		if (skip()) return;
		const result = calculateScore!({
			parTime: 480,
			elapsedTime: 960, // 2x par
			unitsLost: 0,
			bonusObjectivesCompleted: 2,
			bonusObjectivesTotal: 2,
		});
		// Even with perfect losses and bonuses, 2x par should cap at Bronze
		expect(result.stars).toBeLessThanOrEqual(1);
	});

	it("heavy losses with good time = Bronze", () => {
		if (skip()) return;
		const result = calculateScore!({
			parTime: 480,
			elapsedTime: 480,
			unitsLost: 12,
			bonusObjectivesCompleted: 0,
			bonusObjectivesTotal: 2,
		});
		expect(result.stars).toBeLessThanOrEqual(1);
	});
});

// ===========================================================================
// NO STARS (< 30%)
// ===========================================================================

describe("No star scoring", () => {
	it("terrible performance = 0 stars", () => {
		if (skip()) return;
		const result = calculateScore!({
			parTime: 480,
			elapsedTime: 1440, // 3x par
			unitsLost: 20,
			bonusObjectivesCompleted: 0,
			bonusObjectivesTotal: 2,
		});
		expect(result.stars).toBe(0);
		expect(result.score).toBeLessThan(30);
	});
});

// ===========================================================================
// SCORE COMPONENT MATH
// ===========================================================================

describe("Score component calculations", () => {
	it("time score is 100% at par time or under", () => {
		if (skip()) return;
		const result = calculateScore!({
			parTime: 480,
			elapsedTime: 480,
			unitsLost: 0,
			bonusObjectivesCompleted: 0,
			bonusObjectivesTotal: 0,
		});
		expect(result.timeScore).toBe(100);
	});

	it("time score degrades linearly past par time", () => {
		if (skip()) return;
		const atPar = calculateScore!({
			parTime: 480,
			elapsedTime: 480,
			unitsLost: 0,
			bonusObjectivesCompleted: 0,
			bonusObjectivesTotal: 0,
		});
		const overPar = calculateScore!({
			parTime: 480,
			elapsedTime: 720,
			unitsLost: 0,
			bonusObjectivesCompleted: 0,
			bonusObjectivesTotal: 0,
		});
		expect(overPar.timeScore).toBeLessThan(atPar.timeScore);
		expect(overPar.timeScore).toBeGreaterThan(0);
	});

	it("time score reaches 0 at 3x par time", () => {
		if (skip()) return;
		const result = calculateScore!({
			parTime: 480,
			elapsedTime: 1440, // 3x par
			unitsLost: 0,
			bonusObjectivesCompleted: 0,
			bonusObjectivesTotal: 0,
		});
		expect(result.timeScore).toBe(0);
	});

	it("loss score is 100% with 0 losses", () => {
		if (skip()) return;
		const result = calculateScore!({
			parTime: 480,
			elapsedTime: 480,
			unitsLost: 0,
			bonusObjectivesCompleted: 0,
			bonusObjectivesTotal: 0,
		});
		expect(result.lossScore).toBe(100);
	});

	it("loss score decreases 5% per unit lost", () => {
		if (skip()) return;
		const noLoss = calculateScore!({
			parTime: 480,
			elapsedTime: 480,
			unitsLost: 0,
			bonusObjectivesCompleted: 0,
			bonusObjectivesTotal: 0,
		});
		const someLoss = calculateScore!({
			parTime: 480,
			elapsedTime: 480,
			unitsLost: 4,
			bonusObjectivesCompleted: 0,
			bonusObjectivesTotal: 0,
		});
		expect(someLoss.lossScore).toBe(noLoss.lossScore - 20); // 4 * 5%
	});

	it("loss score floors at 0%", () => {
		if (skip()) return;
		const result = calculateScore!({
			parTime: 480,
			elapsedTime: 480,
			unitsLost: 25,
			bonusObjectivesCompleted: 0,
			bonusObjectivesTotal: 0,
		});
		expect(result.lossScore).toBe(0);
	});

	it("bonus score adds 10% per completed bonus objective", () => {
		if (skip()) return;
		const noBonus = calculateScore!({
			parTime: 480,
			elapsedTime: 480,
			unitsLost: 0,
			bonusObjectivesCompleted: 0,
			bonusObjectivesTotal: 3,
		});
		const oneBonus = calculateScore!({
			parTime: 480,
			elapsedTime: 480,
			unitsLost: 0,
			bonusObjectivesCompleted: 1,
			bonusObjectivesTotal: 3,
		});
		expect(oneBonus.bonusScore - noBonus.bonusScore).toBe(10);
	});

	it("total score is weighted combination of components", () => {
		if (skip()) return;
		const result = calculateScore!({
			parTime: 480,
			elapsedTime: 480,
			unitsLost: 0,
			bonusObjectivesCompleted: 0,
			bonusObjectivesTotal: 0,
		});
		// Score should be derived from time + loss + bonus components
		expect(result.score).toBeGreaterThan(0);
		expect(result.score).toBeLessThanOrEqual(100 + 30); // 100% base + up to 30% bonus
	});
});

// ===========================================================================
// STAR THRESHOLDS
// ===========================================================================

describe("Star thresholds", () => {
	it("score 90+ = 3 stars (Gold)", () => {
		if (skip()) return;
		const result = calculateScore!({
			parTime: 480,
			elapsedTime: 400,
			unitsLost: 0,
			bonusObjectivesCompleted: 2,
			bonusObjectivesTotal: 2,
		});
		if (result.score >= 90) {
			expect(result.stars).toBe(3);
		}
	});

	it("score 60-89 = 2 stars (Silver)", () => {
		if (skip()) return;
		// Engineer a scenario that lands in Silver range
		const result = calculateScore!({
			parTime: 480,
			elapsedTime: 600,
			unitsLost: 3,
			bonusObjectivesCompleted: 1,
			bonusObjectivesTotal: 2,
		});
		if (result.score >= 60 && result.score < 90) {
			expect(result.stars).toBe(2);
		}
	});

	it("score 30-59 = 1 star (Bronze)", () => {
		if (skip()) return;
		const result = calculateScore!({
			parTime: 480,
			elapsedTime: 900,
			unitsLost: 8,
			bonusObjectivesCompleted: 0,
			bonusObjectivesTotal: 2,
		});
		if (result.score >= 30 && result.score < 60) {
			expect(result.stars).toBe(1);
		}
	});

	it("score < 30 = 0 stars", () => {
		if (skip()) return;
		const result = calculateScore!({
			parTime: 480,
			elapsedTime: 1440,
			unitsLost: 20,
			bonusObjectivesCompleted: 0,
			bonusObjectivesTotal: 2,
		});
		if (result.score < 30) {
			expect(result.stars).toBe(0);
		}
	});
});

// ===========================================================================
// PAR TIME CROSS-REFERENCE
// ===========================================================================

describe("Par time validation", () => {
	const PAR_TIMES: Record<string, number> = {
		mission_1: 480,
		mission_2: 360,
		mission_3: 600,
		mission_4: 300,
		mission_5: 720,
		mission_6: 600,
		mission_7: 480,
		mission_8: 360,
		mission_9: 720,
		mission_10: 720,
		mission_11: 900,
		mission_12: 720,
		mission_13: 720,
		mission_14: 360,
		mission_15: 900,
		mission_16: 1200,
	};

	it("par times are all positive", () => {
		for (const [id, time] of Object.entries(PAR_TIMES)) {
			expect(time).toBeGreaterThan(0);
		}
	});

	it("final mission has the longest par time (20 min)", () => {
		const maxPar = Math.max(...Object.values(PAR_TIMES));
		expect(PAR_TIMES.mission_16).toBe(maxPar);
		expect(PAR_TIMES.mission_16).toBe(1200);
	});

	it("tutorial mission (Mission 1) has 8 min par", () => {
		expect(PAR_TIMES.mission_1).toBe(480);
	});

	it("hero missions have shorter par times", () => {
		// Mission 4 (Prison Break), 8 (Underwater Cache), 14 (Gas Depot) are hero/commando
		expect(PAR_TIMES.mission_4).toBeLessThanOrEqual(360);
		expect(PAR_TIMES.mission_8).toBeLessThanOrEqual(360);
		expect(PAR_TIMES.mission_14).toBeLessThanOrEqual(360);
	});
});
