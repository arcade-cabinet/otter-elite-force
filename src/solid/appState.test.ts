/**
 * Tests for the SolidJS App Shell — verifies screen routing
 * and state transitions between screens.
 */

import { describe, expect, it } from "vitest";
import { createAppState, type ScreenId } from "./appState";

describe("solid/AppShell", () => {
	describe("createAppState", () => {
		it("initializes with main-menu screen", () => {
			const app = createAppState();
			expect(app.screen()).toBe("main-menu");
		});

		it("initializes with null mission ID", () => {
			const app = createAppState();
			expect(app.currentMissionId()).toBeNull();
		});

		it("initializes with skirmish disabled", () => {
			const app = createAppState();
			expect(app.isSkirmish()).toBe(false);
		});

		it("navigates to campaign screen", () => {
			const app = createAppState();
			app.setScreen("campaign");
			expect(app.screen()).toBe("campaign");
		});

		it("navigates to settings screen", () => {
			const app = createAppState();
			app.setScreen("settings");
			expect(app.screen()).toBe("settings");
		});

		it("navigates to skirmish screen", () => {
			const app = createAppState();
			app.setScreen("skirmish");
			expect(app.screen()).toBe("skirmish");
		});

		it("navigates to game screen", () => {
			const app = createAppState();
			app.setScreen("game");
			expect(app.screen()).toBe("game");
		});

		it("navigates to briefing screen", () => {
			const app = createAppState();
			app.setScreen("briefing");
			expect(app.screen()).toBe("briefing");
		});

		it("navigates to result screen", () => {
			const app = createAppState();
			app.setScreen("result");
			expect(app.screen()).toBe("result");
		});

		it("sets mission ID for campaign", () => {
			const app = createAppState();
			app.setCurrentMissionId("mission_3");
			expect(app.currentMissionId()).toBe("mission_3");
		});

		it("clears mission ID", () => {
			const app = createAppState();
			app.setCurrentMissionId("mission_3");
			app.setCurrentMissionId(null);
			expect(app.currentMissionId()).toBeNull();
		});

		it("sets skirmish mode", () => {
			const app = createAppState();
			app.setIsSkirmish(true);
			expect(app.isSkirmish()).toBe(true);
		});

		it("supports full navigation flow: menu -> campaign -> briefing -> game -> result -> menu", () => {
			const app = createAppState();

			// Start at main menu
			expect(app.screen()).toBe("main-menu");

			// Navigate to campaign
			app.setScreen("campaign");
			expect(app.screen()).toBe("campaign");

			// Select mission -> briefing
			app.setCurrentMissionId("mission_1");
			app.setScreen("briefing");
			expect(app.screen()).toBe("briefing");
			expect(app.currentMissionId()).toBe("mission_1");

			// Deploy -> game
			app.setScreen("game");
			expect(app.screen()).toBe("game");

			// Victory -> result
			app.setScreen("result");
			expect(app.screen()).toBe("result");

			// Back to menu
			app.setScreen("main-menu");
			expect(app.screen()).toBe("main-menu");
		});

		it("supports skirmish flow: menu -> skirmish -> game -> result -> menu", () => {
			const app = createAppState();

			app.setIsSkirmish(true);
			app.setScreen("skirmish");
			expect(app.screen()).toBe("skirmish");
			expect(app.isSkirmish()).toBe(true);

			app.setScreen("game");
			expect(app.screen()).toBe("game");

			app.setScreen("result");
			expect(app.screen()).toBe("result");

			app.setScreen("main-menu");
			expect(app.screen()).toBe("main-menu");
		});

		it("all screen types are valid", () => {
			const app = createAppState();
			const screens: ScreenId[] = [
				"main-menu",
				"campaign",
				"settings",
				"skirmish",
				"game",
				"briefing",
				"result",
			];

			for (const screen of screens) {
				app.setScreen(screen);
				expect(app.screen()).toBe(screen);
			}
		});
	});
});
