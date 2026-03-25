/**
 * US-053: Star Rating Display on Mission Completion
 *
 * Tests the calculateStarRating function and star threshold logic.
 * Breakdown: Time (40%), Survival (30%), Bonus (30%)
 */

import { describe, expect, it } from "vitest";
import { calculateStarRating } from "@/ui/hud/StarRatingDisplay";

describe("US-053: Star rating calculation", () => {
	it("perfect play = Gold (3 stars, score >= 90)", () => {
		const result = calculateStarRating({
			parTimeMs: 480000,
			elapsedMs: 400000,
			unitsLost: 0,
			totalUnits: 10,
			bonusObjectivesCompleted: 2,
			bonusObjectivesTotal: 2,
		});
		expect(result.stars).toBe(3);
		expect(result.totalScore).toBeGreaterThanOrEqual(90);
	});

	it("at par time with minor losses and partial bonus = Silver (2 stars)", () => {
		const result = calculateStarRating({
			parTimeMs: 480000,
			elapsedMs: 480000,
			unitsLost: 2,
			totalUnits: 10,
			bonusObjectivesCompleted: 1,
			bonusObjectivesTotal: 2,
		});
		// time: 100*0.4=40, survival: 80*0.3=24, bonus: 50*0.3=15 = 79 -> Silver
		expect(result.stars).toBe(2);
		expect(result.totalScore).toBeGreaterThanOrEqual(60);
		expect(result.totalScore).toBeLessThan(90);
	});

	it("over 2x par with heavy losses = Bronze (1 star)", () => {
		const result = calculateStarRating({
			parTimeMs: 480000,
			elapsedMs: 900000,
			unitsLost: 6,
			totalUnits: 10,
			bonusObjectivesCompleted: 0,
			bonusObjectivesTotal: 2,
		});
		expect(result.stars).toBe(1);
		expect(result.totalScore).toBeGreaterThanOrEqual(30);
		expect(result.totalScore).toBeLessThan(60);
	});

	it("terrible performance = 0 stars", () => {
		const result = calculateStarRating({
			parTimeMs: 480000,
			elapsedMs: 1440000,
			unitsLost: 10,
			totalUnits: 10,
			bonusObjectivesCompleted: 0,
			bonusObjectivesTotal: 2,
		});
		expect(result.stars).toBe(0);
		expect(result.totalScore).toBeLessThan(30);
	});

	it("time score is 100 at or under par", () => {
		const result = calculateStarRating({
			parTimeMs: 480000,
			elapsedMs: 400000,
			unitsLost: 0,
			totalUnits: 10,
			bonusObjectivesCompleted: 0,
			bonusObjectivesTotal: 0,
		});
		expect(result.timeScore).toBe(100);
	});

	it("time score degrades to 0 at 3x par", () => {
		const result = calculateStarRating({
			parTimeMs: 480000,
			elapsedMs: 1440000,
			unitsLost: 0,
			totalUnits: 10,
			bonusObjectivesCompleted: 0,
			bonusObjectivesTotal: 0,
		});
		expect(result.timeScore).toBe(0);
	});

	it("survival score is 100 with no losses", () => {
		const result = calculateStarRating({
			parTimeMs: 480000,
			elapsedMs: 480000,
			unitsLost: 0,
			totalUnits: 10,
			bonusObjectivesCompleted: 0,
			bonusObjectivesTotal: 0,
		});
		expect(result.survivalScore).toBe(100);
	});

	it("survival score scales with losses", () => {
		const result = calculateStarRating({
			parTimeMs: 480000,
			elapsedMs: 480000,
			unitsLost: 5,
			totalUnits: 10,
			bonusObjectivesCompleted: 0,
			bonusObjectivesTotal: 0,
		});
		expect(result.survivalScore).toBe(50);
	});

	it("bonus score is proportional to completed bonus objectives", () => {
		const half = calculateStarRating({
			parTimeMs: 480000,
			elapsedMs: 480000,
			unitsLost: 0,
			totalUnits: 10,
			bonusObjectivesCompleted: 1,
			bonusObjectivesTotal: 2,
		});
		expect(half.bonusScore).toBe(50);

		const full = calculateStarRating({
			parTimeMs: 480000,
			elapsedMs: 480000,
			unitsLost: 0,
			totalUnits: 10,
			bonusObjectivesCompleted: 2,
			bonusObjectivesTotal: 2,
		});
		expect(full.bonusScore).toBe(100);
	});

	it("total score is weighted: time 40% + survival 30% + bonus 30%", () => {
		const result = calculateStarRating({
			parTimeMs: 480000,
			elapsedMs: 480000, // time: 100
			unitsLost: 0, // survival: 100
			totalUnits: 10,
			bonusObjectivesCompleted: 0, // bonus: 0
			bonusObjectivesTotal: 2,
		});
		// 100*0.4 + 100*0.3 + 0*0.3 = 70
		expect(result.totalScore).toBe(70);
	});
});
