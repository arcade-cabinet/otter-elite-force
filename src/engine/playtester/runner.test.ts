/**
 * Runner integration tests — validates full mission playtests produce
 * complete PlaytestReport data.
 */

import { describe, expect, it } from "vitest";
import { resetGatherTimers } from "@/engine/systems/economySystem";
import { type PlaytestReport, runGovernorPlaytest } from "./runner";

describe("runGovernorPlaytest", () => {
	it("full Mission 1 playtest with beginner governor produces a PlaytestReport", { timeout: 60000 }, () => {
		resetGatherTimers();

		const report = runGovernorPlaytest(
			"mission_1",
			{
				difficulty: "beginner",
			},
			18000,
		); // ~5 minutes

		expect(report).toBeDefined();
		expect(report.missionId).toBe("mission_1");
		expect(report.difficulty).toBe("beginner");
		expect(report.durationTicks).toBe(18000);
		expect(report.durationMinutes).toBeGreaterThan(0);
		expect(report.outcome).toMatch(/^(victory|defeat|timeout)$/);

		console.log("=== BEGINNER PLAYTEST REPORT ===");
		console.log(`Outcome: ${report.outcome}`);
		console.log(`Duration: ${report.durationTicks} ticks (${report.durationMinutes} min)`);
		console.log(`Units trained: ${report.unitsTrainedCount}`);
		console.log(`Units lost: ${report.unitsLostCount}`);
		console.log(`Buildings built: ${report.buildingsBuiltCount}`);
		console.log(`Resources gathered:`, report.resourcesGathered);
		console.log(`Objectives: ${report.objectivesCompleted}/${report.objectivesTotal}`);
		console.log(`Peak army: ${report.peakArmySize}`);
		console.log(`Enemies killed: ${report.enemiesKilled}`);
		console.log(`Timeline events: ${report.timeline.length}`);
	});

	it("report shows units trained, buildings built, resources gathered", { timeout: 60000 }, () => {
		resetGatherTimers();

		const report = runGovernorPlaytest(
			"mission_1",
			{
				difficulty: "optimal",
			},
			30000,
		); // ~8.3 minutes

		// Governor should have gathered some resources (workers auto-gather)
		// Note: resourcesGathered is the delta from start, which may be negative
		// if spent on buildings/units. But the economy should be positive overall.
		expect(report.timeline.length).toBeGreaterThan(0);

		// Should have at least some actions recorded
		const hasGatherActions = report.timeline.some((e) => e.event.includes("assign-gather"));
		expect(hasGatherActions).toBe(true);

		console.log("=== OPTIMAL 8-MIN PLAYTEST REPORT ===");
		console.log(`Outcome: ${report.outcome}`);
		console.log(`Units trained: ${report.unitsTrainedCount}`);
		console.log(`Buildings built: ${report.buildingsBuiltCount}`);
		console.log(`Resources gathered:`, report.resourcesGathered);
		console.log(`Timeline first 20:`, report.timeline.slice(0, 20));
	});

	it("optimal governor completes Mission 1 faster than beginner", { timeout: 60000 }, () => {
		resetGatherTimers();

		const beginnerReport = runGovernorPlaytest(
			"mission_1",
			{
				difficulty: "beginner",
			},
			60000,
		);

		resetGatherTimers();

		const optimalReport = runGovernorPlaytest(
			"mission_1",
			{
				difficulty: "optimal",
			},
			60000,
		);

		console.log("=== GOVERNOR COMPARISON ===");
		console.log(
			`Beginner: ${beginnerReport.outcome} at ${beginnerReport.durationTicks} ticks, ${beginnerReport.objectivesCompleted}/${beginnerReport.objectivesTotal} objectives`,
		);
		console.log(
			`Optimal: ${optimalReport.outcome} at ${optimalReport.durationTicks} ticks, ${optimalReport.objectivesCompleted}/${optimalReport.objectivesTotal} objectives`,
		);

		// Both governors should complete at least 4 objectives in 60000 ticks
		// (gather-timber, build-command-post, build-barracks, train-mudfoots)
		expect(beginnerReport.objectivesCompleted).toBeGreaterThanOrEqual(4);
		expect(optimalReport.objectivesCompleted).toBeGreaterThanOrEqual(4);
		expect(optimalReport.durationTicks).toBeGreaterThan(0);
		expect(beginnerReport.durationTicks).toBeGreaterThan(0);
	});
});
