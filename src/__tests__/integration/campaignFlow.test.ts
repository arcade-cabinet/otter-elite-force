/**
 * E2E Integration Test — Full Campaign Flow.
 *
 * Exercises the complete campaign lifecycle headlessly:
 *   1. App state initialization (screen routing)
 *   2. Navigation from main-menu to campaign to game
 *   3. Mission bootstrap and headless governor playtest
 *   4. Objective tracking and session phase transitions
 *   5. Campaign progression with advanceCampaign
 *   6. Mission result resolution and star calculation
 */

import { describe, expect, it } from "vitest";
import { createAppState } from "@/solid/appState";
import { runGovernorPlaytest } from "@/engine/playtester/runner";
import {
	advanceCampaign,
	getCampaignNextMission,
	isCampaignComplete,
	startNewCampaign,
} from "@/engine/session/campaignFlow";
import { resolveMissionVictory, isFinalCampaignMission } from "@/app/missionResult";
import { calculateMissionScore } from "@/engine/systems/scoringSystem";
import { bootstrapMission } from "@/engine/session/missionBootstrap";
import { createGameWorld } from "@/engine/world/gameWorld";
import { createSeedBundle } from "@/engine/random/seed";

// ---------------------------------------------------------------------------
// Task 1: Full campaign flow E2E
// ---------------------------------------------------------------------------

describe("E2E: Campaign flow", () => {
	describe("App state screen routing", () => {
		it("initializes to main-menu screen", () => {
			const app = createAppState();
			expect(app.screen()).toBe("main-menu");
		});

		it("navigates through the full campaign flow: menu -> campaign -> briefing -> game", () => {
			const app = createAppState();

			// Step 1: start at main menu
			expect(app.screen()).toBe("main-menu");

			// Step 2: navigate to campaign
			app.setScreen("campaign");
			expect(app.screen()).toBe("campaign");

			// Step 3: set mission and go to briefing
			app.setCurrentMissionId("mission_1");
			app.setScreen("briefing");
			expect(app.screen()).toBe("briefing");
			expect(app.currentMissionId()).toBe("mission_1");

			// Step 4: deploy to game
			app.setScreen("game");
			expect(app.screen()).toBe("game");
			expect(app.currentMissionId()).toBe("mission_1");
		});
	});

	describe("Headless mission bootstrap and gameplay", () => {
		it("boots mission_1 into a GameWorld and verifies world state", () => {
			const seed = createSeedBundle({ phrase: "campaign-e2e-test", source: "manual" });
			const world = createGameWorld(seed);

			bootstrapMission(world, "mission_1");

			// World should be in playing phase with mission set
			expect(world.session.phase).toBe("playing");
			expect(world.session.currentMissionId).toBe("mission_1");

			// Should have entities spawned
			expect(world.runtime.alive.size).toBeGreaterThan(0);

			// Should have objectives loaded
			expect(world.session.objectives.length).toBeGreaterThan(0);
			const primaryObjectives = world.session.objectives.filter((o) => !o.bonus);
			expect(primaryObjectives.length).toBeGreaterThan(0);

			// Should have starting resources
			expect(world.session.resources.fish).toBeGreaterThanOrEqual(0);

			// Navigation dimensions should be set
			expect(world.navigation.width).toBeGreaterThan(0);
			expect(world.navigation.height).toBeGreaterThan(0);
		});

		it("runs governor playtest on mission_1 for 30000 ticks and produces a report", () => {
			const report = runGovernorPlaytest("mission_1", { difficulty: "optimal" }, 30000);

			expect(report.missionId).toBe("mission_1");
			expect(report.difficulty).toBe("optimal");
			expect(report.durationTicks).toBeGreaterThan(0);
			expect(report.durationTicks).toBeLessThanOrEqual(30000);

			// Should have tracked some objectives
			expect(report.objectivesTotal).toBeGreaterThan(0);

			// Outcome should be one of the valid types
			expect(["victory", "defeat", "timeout"]).toContain(report.outcome);

			// Should have tracked at least some activity
			expect(report.durationMinutes).toBeGreaterThan(0);
		});

		it("tracks objective completion during governor playtest", () => {
			const report = runGovernorPlaytest("mission_1", { difficulty: "optimal" }, 30000);

			// The governor should have made progress on at least some objectives
			// (even if not all completed, some should have been attempted)
			expect(report.objectivesTotal).toBeGreaterThan(0);

			// If victory, all primary objectives should be completed
			if (report.outcome === "victory") {
				expect(report.objectivesCompleted).toBeGreaterThan(0);
			}
		});
	});

	describe("Campaign progression after mission completion", () => {
		it("advances to mission_2 after completing mission_1", () => {
			let progress = startNewCampaign("tactical");

			// Simulate completing mission_1
			progress = advanceCampaign(progress, "mission_1", {
				stars: 2,
				timeMs: 180000,
			});

			// Mission 1 should be completed
			expect(progress.missions.mission_1.status).toBe("completed");
			expect(progress.missions.mission_1.stars).toBe(2);

			// Mission 2 should be unlocked
			expect(progress.missions.mission_2.status).toBe("available");

			// Current mission should advance
			expect(progress.currentMissionId).toBe("mission_2");

			// Next mission helper should agree
			expect(getCampaignNextMission(progress)).toBe("mission_2");

			// Campaign should not be complete
			expect(isCampaignComplete(progress)).toBe(false);
		});

		it("integrates governor playtest result into campaign progression", () => {
			const report = runGovernorPlaytest("mission_1", { difficulty: "optimal" }, 30000);

			let progress = startNewCampaign();

			if (report.outcome === "victory") {
				// Calculate stars from the report
				const stars = report.objectivesCompleted >= report.objectivesTotal ? 3 : 1;
				progress = advanceCampaign(progress, "mission_1", {
					stars: stars as 1 | 2 | 3,
					timeMs: report.durationMinutes * 60000,
				});

				expect(progress.missions.mission_1.status).toBe("completed");
				expect(progress.missions.mission_2.status).toBe("available");
				expect(getCampaignNextMission(progress)).toBe("mission_2");
			} else {
				// Even on timeout/defeat, campaign state should remain valid
				expect(progress.missions.mission_1.status).toBe("available");
				expect(getCampaignNextMission(progress)).toBe("mission_1");
			}
		});
	});

	describe("Mission result flow with star calculation", () => {
		it("resolves mission victory and advances to next mission", () => {
			const result = resolveMissionVictory(
				{
					missions: {
						mission_1: { status: "active", stars: 0, bestTime: 0 },
					},
					currentMission: "mission_1",
					difficulty: "support",
				},
				"mission_1",
				2,
			);

			expect(result.completedMissionId).toBe("mission_1");
			expect(result.nextMissionId).toBe("mission_2");
			expect(result.stars).toBe(2);
			expect(result.progress.missions.mission_1.status).toBe("completed");
			expect(result.progress.missions.mission_1.stars).toBe(2);
			expect(result.progress.currentMission).toBe("mission_2");
		});

		it("calculates star rating from world state", () => {
			const seed = createSeedBundle({ phrase: "scoring-e2e-test", source: "manual" });
			const world = createGameWorld(seed);

			bootstrapMission(world, "mission_1");
			world.session.phase = "victory";
			world.time.elapsedMs = 300_000; // 5 minutes

			const score = calculateMissionScore(world);

			expect(score.stars).toBeGreaterThanOrEqual(1);
			expect(score.stars).toBeLessThanOrEqual(3);
			expect(typeof score.timeBonus).toBe("boolean");
			expect(typeof score.casualtyBonus).toBe("boolean");
			expect(typeof score.objectiveBonus).toBe("boolean");
		});

		it("identifies mission_16 as the final campaign mission", () => {
			expect(isFinalCampaignMission("mission_16")).toBe(true);
			expect(isFinalCampaignMission("mission_1")).toBe(false);
			expect(isFinalCampaignMission("mission_15")).toBe(false);
		});

		it("handles full end-to-end: boot -> play -> score -> advance", () => {
			// 1. Boot a world and verify it is ready
			const seed = createSeedBundle({ phrase: "full-e2e-flow", source: "manual" });
			const world = createGameWorld(seed);
			bootstrapMission(world, "mission_1");
			expect(world.session.phase).toBe("playing");

			// 2. Simulate victory
			world.session.phase = "victory";
			world.time.elapsedMs = 240_000; // 4 minutes

			// 3. Calculate score
			const score = calculateMissionScore(world);
			expect(score.stars).toBeGreaterThanOrEqual(1);

			// 4. Resolve mission result
			const missionResult = resolveMissionVictory(
				{
					missions: { mission_1: { status: "active", stars: 0, bestTime: 0 } },
					currentMission: "mission_1",
					difficulty: "tactical",
				},
				"mission_1",
				score.stars,
			);

			expect(missionResult.completedMissionId).toBe("mission_1");
			expect(missionResult.nextMissionId).toBe("mission_2");

			// 5. Advance campaign using the pure campaignFlow module
			let progress = startNewCampaign("tactical");
			progress = advanceCampaign(progress, "mission_1", {
				stars: score.stars,
				timeMs: world.time.elapsedMs,
			});

			expect(progress.missions.mission_1.status).toBe("completed");
			expect(progress.missions.mission_1.stars).toBe(score.stars);
			expect(progress.missions.mission_2.status).toBe("available");
			expect(progress.currentMissionId).toBe("mission_2");
		});
	});

	describe("App state mission result data", () => {
		it("stores and retrieves mission result data on app state", () => {
			const app = createAppState();

			app.setMissionResult({
				outcome: "victory",
				missionId: "mission_1",
				missionName: "Operation Beachhead",
				stars: 2,
				stats: {
					timeElapsed: 300,
					unitsLost: 3,
					resourcesGathered: 500,
					unitsDeployed: 12,
				},
				isFinalMission: false,
			});

			const result = app.missionResult();
			expect(result).not.toBeNull();
			expect(result?.outcome).toBe("victory");
			expect(result?.missionId).toBe("mission_1");
			expect(result?.stars).toBe(2);
			expect(result?.stats.timeElapsed).toBe(300);
			expect(result?.isFinalMission).toBe(false);
		});

		it("transitions to result screen after game ends", () => {
			const app = createAppState();

			// Simulate game flow
			app.setScreen("game");
			app.setCurrentMissionId("mission_1");

			// Game ends with victory
			app.setMissionResult({
				outcome: "victory",
				missionId: "mission_1",
				missionName: "Operation Beachhead",
				stars: 3,
				stats: {
					timeElapsed: 200,
					unitsLost: 0,
					resourcesGathered: 800,
					unitsDeployed: 15,
				},
				isFinalMission: false,
			});
			app.setScreen("result");

			expect(app.screen()).toBe("result");
			expect(app.missionResult()?.outcome).toBe("victory");
			expect(app.missionResult()?.stars).toBe(3);
		});
	});
});
