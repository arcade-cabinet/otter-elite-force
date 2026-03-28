/**
 * Tests for SolidJS screen navigation flows.
 *
 * Uses createAppState (pure signals, no JSX) to verify
 * that screen transitions work correctly for all navigation paths.
 */

import { describe, expect, it } from "vitest";
import { createAppState } from "../appState";

describe("solid/screens navigation", () => {
	describe("MainMenu navigation", () => {
		it("New Campaign sets mission_1, disables skirmish, and navigates to briefing", () => {
			const app = createAppState();
			// Simulate "New Campaign" button click
			app.setCurrentMissionId("mission_1");
			app.setIsSkirmish(false);
			app.setScreen("briefing");

			expect(app.screen()).toBe("briefing");
			expect(app.currentMissionId()).toBe("mission_1");
			expect(app.isSkirmish()).toBe(false);
		});

		it("Continue navigates to campaign", () => {
			const app = createAppState();
			app.setIsSkirmish(false);
			app.setScreen("campaign");

			expect(app.screen()).toBe("campaign");
			expect(app.isSkirmish()).toBe(false);
		});

		it("Skirmish enables skirmish mode and navigates to skirmish setup", () => {
			const app = createAppState();
			app.setIsSkirmish(true);
			app.setScreen("skirmish");

			expect(app.screen()).toBe("skirmish");
			expect(app.isSkirmish()).toBe(true);
		});

		it("Settings navigates to settings screen", () => {
			const app = createAppState();
			app.setScreen("settings");
			expect(app.screen()).toBe("settings");
		});
	});

	describe("CampaignView navigation", () => {
		it("clicking a mission navigates to briefing with mission ID", () => {
			const app = createAppState();
			app.setScreen("campaign");

			// Simulate mission card click
			app.setCurrentMissionId("mission_3");
			app.setScreen("briefing");

			expect(app.screen()).toBe("briefing");
			expect(app.currentMissionId()).toBe("mission_3");
		});

		it("back button returns to main menu", () => {
			const app = createAppState();
			app.setScreen("campaign");
			app.setScreen("main-menu");
			expect(app.screen()).toBe("main-menu");
		});
	});

	describe("SettingsPanel navigation", () => {
		it("back button returns to main menu", () => {
			const app = createAppState();
			app.setScreen("settings");
			app.setScreen("main-menu");
			expect(app.screen()).toBe("main-menu");
		});
	});

	describe("SkirmishSetup navigation", () => {
		it("launch navigates to game screen", () => {
			const app = createAppState();
			app.setIsSkirmish(true);
			app.setScreen("skirmish");
			app.setScreen("game");
			expect(app.screen()).toBe("game");
		});

		it("back button returns to main menu", () => {
			const app = createAppState();
			app.setIsSkirmish(true);
			app.setScreen("skirmish");
			app.setScreen("main-menu");
			expect(app.screen()).toBe("main-menu");
		});
	});

	describe("BriefingOverlay navigation", () => {
		it("deploy navigates to game screen", () => {
			const app = createAppState();
			app.setCurrentMissionId("mission_1");
			app.setScreen("briefing");
			app.setScreen("game");
			expect(app.screen()).toBe("game");
		});

		it("back button returns to campaign", () => {
			const app = createAppState();
			app.setCurrentMissionId("mission_1");
			app.setScreen("briefing");
			app.setScreen("campaign");
			expect(app.screen()).toBe("campaign");
		});
	});

	describe("PauseOverlay navigation", () => {
		it("resume returns to game screen", () => {
			const app = createAppState();
			app.setScreen("game");
			// PauseOverlay would set screen back to game on resume
			app.setScreen("game");
			expect(app.screen()).toBe("game");
		});

		it("settings navigates to settings from pause", () => {
			const app = createAppState();
			app.setScreen("game");
			app.setScreen("settings");
			expect(app.screen()).toBe("settings");
		});

		it("quit navigates to main menu", () => {
			const app = createAppState();
			app.setScreen("game");
			app.setScreen("main-menu");
			expect(app.screen()).toBe("main-menu");
		});
	});

	describe("MissionResult navigation", () => {
		it("next mission navigates to briefing", () => {
			const app = createAppState();
			app.setScreen("result");
			app.setScreen("briefing");
			expect(app.screen()).toBe("briefing");
		});

		it("retry navigates to briefing", () => {
			const app = createAppState();
			app.setScreen("result");
			app.setScreen("briefing");
			expect(app.screen()).toBe("briefing");
		});

		it("return to campaign navigates to campaign", () => {
			const app = createAppState();
			app.setScreen("result");
			app.setScreen("campaign");
			expect(app.screen()).toBe("campaign");
		});

		it("main menu navigates to main menu", () => {
			const app = createAppState();
			app.setScreen("result");
			app.setScreen("main-menu");
			expect(app.screen()).toBe("main-menu");
		});

		it("mission result data flows through appState", () => {
			const app = createAppState();
			expect(app.missionResult()).toBeNull();

			app.setMissionResult({
				outcome: "victory",
				missionId: "mission_1",
				missionName: "MISSION COMPLETE",
				stars: 3,
				stats: {
					timeElapsed: 120,
					unitsLost: 2,
					resourcesGathered: 500,
					unitsDeployed: 10,
				},
				isFinalMission: false,
			});
			app.setScreen("result");

			expect(app.screen()).toBe("result");
			expect(app.missionResult()).not.toBeNull();
			expect(app.missionResult()?.outcome).toBe("victory");
			expect(app.missionResult()?.stars).toBe(3);
			expect(app.missionResult()?.stats.timeElapsed).toBe(120);
		});

		it("defeat result data flows through appState", () => {
			const app = createAppState();
			app.setMissionResult({
				outcome: "defeat",
				missionId: "mission_3",
				missionName: "MISSION FAILED",
				stars: 0,
				stats: {
					timeElapsed: 60,
					unitsLost: 8,
					resourcesGathered: 100,
					unitsDeployed: 12,
				},
				isFinalMission: false,
			});
			app.setScreen("result");

			expect(app.missionResult()?.outcome).toBe("defeat");
			expect(app.missionResult()?.stars).toBe(0);
		});
	});

	describe("SkirmishResult navigation", () => {
		it("rematch sets skirmish mode and navigates to game", () => {
			const app = createAppState();
			app.setIsSkirmish(true);
			app.setScreen("result");

			// Simulate "Rematch" button
			app.setIsSkirmish(true);
			app.setScreen("game");

			expect(app.screen()).toBe("game");
			expect(app.isSkirmish()).toBe(true);
		});

		it("new setup navigates to skirmish setup", () => {
			const app = createAppState();
			app.setIsSkirmish(true);
			app.setScreen("result");

			// Simulate "New Setup" button
			app.setIsSkirmish(true);
			app.setScreen("skirmish");

			expect(app.screen()).toBe("skirmish");
			expect(app.isSkirmish()).toBe(true);
		});

		it("main menu navigates to main menu", () => {
			const app = createAppState();
			app.setIsSkirmish(true);
			app.setScreen("result");
			app.setScreen("main-menu");
			expect(app.screen()).toBe("main-menu");
		});
	});

	describe("full campaign flow", () => {
		it("menu -> campaign -> briefing -> game -> result -> next mission -> briefing", () => {
			const app = createAppState();

			expect(app.screen()).toBe("main-menu");

			// Continue campaign
			app.setIsSkirmish(false);
			app.setScreen("campaign");
			expect(app.screen()).toBe("campaign");

			// Select mission 1
			app.setCurrentMissionId("mission_1");
			app.setScreen("briefing");
			expect(app.screen()).toBe("briefing");
			expect(app.currentMissionId()).toBe("mission_1");

			// Deploy
			app.setScreen("game");
			expect(app.screen()).toBe("game");

			// Victory
			app.setScreen("result");
			expect(app.screen()).toBe("result");

			// Next mission
			app.setCurrentMissionId("mission_2");
			app.setScreen("briefing");
			expect(app.screen()).toBe("briefing");
			expect(app.currentMissionId()).toBe("mission_2");
		});
	});

	describe("full skirmish flow", () => {
		it("menu -> skirmish -> game -> result -> rematch -> game -> result -> new setup -> skirmish", () => {
			const app = createAppState();

			// Enter skirmish
			app.setIsSkirmish(true);
			app.setScreen("skirmish");
			expect(app.screen()).toBe("skirmish");

			// Launch
			app.setScreen("game");
			expect(app.screen()).toBe("game");

			// Victory
			app.setScreen("result");
			expect(app.screen()).toBe("result");
			expect(app.isSkirmish()).toBe(true);

			// Rematch
			app.setScreen("game");
			expect(app.screen()).toBe("game");

			// Defeat
			app.setScreen("result");
			expect(app.screen()).toBe("result");

			// New setup
			app.setScreen("skirmish");
			expect(app.screen()).toBe("skirmish");
		});
	});

	describe("result screen routing based on skirmish flag", () => {
		it("result screen with isSkirmish=false indicates campaign result", () => {
			const app = createAppState();
			app.setIsSkirmish(false);
			app.setScreen("result");
			expect(app.screen()).toBe("result");
			expect(app.isSkirmish()).toBe(false);
		});

		it("result screen with isSkirmish=true indicates skirmish result", () => {
			const app = createAppState();
			app.setIsSkirmish(true);
			app.setScreen("result");
			expect(app.screen()).toBe("result");
			expect(app.isSkirmish()).toBe(true);
		});
	});
});
