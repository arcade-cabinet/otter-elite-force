import { describe, expect, it } from "vitest";
import { BALANCE } from "./balance";

describe("engine/content/balance", () => {
	it("gathering rates are positive", () => {
		expect(BALANCE.gathering.fishPerTrip).toBeGreaterThan(0);
		expect(BALANCE.gathering.timberPerTrip).toBeGreaterThan(0);
		expect(BALANCE.gathering.salvagePerTrip).toBeGreaterThan(0);
		expect(BALANCE.gathering.tripDurationMs).toBeGreaterThan(0);
	});

	it("return speed multiplier is between 0 and 1", () => {
		expect(BALANCE.gathering.returnSpeedMultiplier).toBeGreaterThan(0);
		expect(BALANCE.gathering.returnSpeedMultiplier).toBeLessThanOrEqual(1);
	});

	it("starting resources are non-negative", () => {
		for (const preset of Object.values(BALANCE.startingResources)) {
			expect(preset.fish).toBeGreaterThanOrEqual(0);
			expect(preset.timber).toBeGreaterThanOrEqual(0);
			expect(preset.salvage).toBeGreaterThanOrEqual(0);
		}
	});

	it("population caps make sense", () => {
		expect(BALANCE.population.lodgeCap).toBeLessThan(BALANCE.population.maxCap);
		expect(BALANCE.population.commandPostCap).toBeLessThanOrEqual(BALANCE.population.maxCap);
		expect(BALANCE.population.lodgeCap).toBeGreaterThan(0);
	});

	it("retreat threshold is between 0 and 100", () => {
		expect(BALANCE.combat.retreatHealthPercent).toBeGreaterThan(0);
		expect(BALANCE.combat.retreatHealthPercent).toBeLessThan(100);
	});

	it("lodge destruction means defeat", () => {
		expect(BALANCE.combat.lodgeDestroyedDefeat).toBe(true);
	});

	it("difficulty modifiers are reasonable", () => {
		// Support is easier
		expect(BALANCE.difficulty.support.enemyDamageMultiplier).toBeLessThan(1);
		expect(BALANCE.difficulty.support.resourceMultiplier).toBeGreaterThan(1);

		// Tactical is baseline
		expect(BALANCE.difficulty.tactical.enemyDamageMultiplier).toBe(1);
		expect(BALANCE.difficulty.tactical.resourceMultiplier).toBe(1);

		// Elite is harder
		expect(BALANCE.difficulty.elite.enemyDamageMultiplier).toBeGreaterThan(1);
		expect(BALANCE.difficulty.elite.resourceMultiplier).toBeLessThan(1);
	});

	it("economy rates are sensible relative to unit costs", () => {
		// A fish trap should produce meaningful income
		// 3 fish per 10 seconds = 18 fish/min
		const fishPerMinute =
			(BALANCE.economy.fishTrapIncome / BALANCE.economy.fishTrapIntervalMs) * 60000;
		expect(fishPerMinute).toBeGreaterThanOrEqual(10);
		expect(fishPerMinute).toBeLessThanOrEqual(30);
	});
});
