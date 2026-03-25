/**
 * CampaignProgress Serialization Specification Tests
 *
 * Defines the behavioral contract for CampaignProgress trait and
 * its serialization/deserialization lifecycle (Koota ↔ persistence).
 *
 * Sources:
 *   - docs/superpowers/specs/2026-03-24-ui-spdsl-architecture-design.md §7
 *   - src/ecs/traits/state.ts (CampaignProgress, UserSettings, TerritoryState)
 *   - docs/architecture/testing-strategy.md (Layer 1: spec tests)
 */

import { createWorld, type World } from "koota";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { initSingletons, resetSessionState } from "@/ecs/singletons";
import { CampaignProgress, TerritoryState, UserSettings } from "@/ecs/traits/state";

let world: World;

beforeEach(() => {
	world = createWorld();
	initSingletons(world);
});

afterEach(() => {
	world.destroy();
});

// ===========================================================================
// SPECIFICATION
// ===========================================================================

describe("CampaignProgress trait", () => {
	describe("initialization", () => {
		it("is added to the world by initSingletons", () => {
			expect(world.has(CampaignProgress)).toBe(true);
		});

		it("starts with empty missions, null currentMission, support difficulty", () => {
			const progress = world.get(CampaignProgress)!;
			expect(progress.missions).toEqual({});
			expect(progress.currentMission).toBeNull();
			expect(progress.difficulty).toBe("support");
		});
	});

	describe("mission completion", () => {
		it("can record a completed mission with stars and time", () => {
			const progress = world.get(CampaignProgress)!;
			progress.missions.mission_1 = {
				status: "completed",
				stars: 3,
				bestTime: 420000,
			};
			expect(world.get(CampaignProgress)!.missions.mission_1).toEqual({
				status: "completed",
				stars: 3,
				bestTime: 420000,
			});
		});

		it("can track multiple missions", () => {
			const progress = world.get(CampaignProgress)!;
			progress.missions.mission_1 = { status: "completed", stars: 3, bestTime: 420000 };
			progress.missions.mission_2 = { status: "completed", stars: 2, bestTime: 600000 };
			progress.missions.mission_3 = { status: "unlocked", stars: 0, bestTime: 0 };
			expect(Object.keys(world.get(CampaignProgress)!.missions)).toHaveLength(3);
		});

		it("updates bestTime only when new time is better", () => {
			const progress = world.get(CampaignProgress)!;
			progress.missions.mission_1 = { status: "completed", stars: 2, bestTime: 600000 };
			// Replay with better time
			const existing = progress.missions.mission_1;
			const newTime = 420000;
			if (newTime < existing.bestTime) {
				existing.bestTime = newTime;
			}
			expect(progress.missions.mission_1.bestTime).toBe(420000);
		});

		it("updates stars when new stars are higher", () => {
			const progress = world.get(CampaignProgress)!;
			progress.missions.mission_1 = { status: "completed", stars: 1, bestTime: 600000 };
			// Replay with better score
			const existing = progress.missions.mission_1;
			const newStars = 3;
			if (newStars > existing.stars) {
				existing.stars = newStars;
			}
			expect(progress.missions.mission_1.stars).toBe(3);
		});
	});

	describe("difficulty", () => {
		it("can set difficulty to tactical", () => {
			const progress = world.get(CampaignProgress)!;
			progress.difficulty = "tactical";
			expect(world.get(CampaignProgress)!.difficulty).toBe("tactical");
		});

		it("can set difficulty to elite", () => {
			const progress = world.get(CampaignProgress)!;
			progress.difficulty = "elite";
			expect(world.get(CampaignProgress)!.difficulty).toBe("elite");
		});

		it("difficulty is escalation-only (design constraint, not code enforcement here)", () => {
			// This is a design constraint: once you pick a higher difficulty, no going back
			// The spec says to enforce this at the UI level
			const progress = world.get(CampaignProgress)!;
			progress.difficulty = "tactical";
			expect(progress.difficulty).toBe("tactical");
		});
	});

	describe("currentMission tracking", () => {
		it("can set currentMission to a mission ID", () => {
			const progress = world.get(CampaignProgress)!;
			progress.currentMission = "mission_5";
			expect(world.get(CampaignProgress)!.currentMission).toBe("mission_5");
		});

		it("can clear currentMission back to null", () => {
			const progress = world.get(CampaignProgress)!;
			progress.currentMission = "mission_5";
			progress.currentMission = null;
			expect(world.get(CampaignProgress)!.currentMission).toBeNull();
		});
	});

	describe("persistence across session reset", () => {
		it("resetSessionState does NOT clear campaign progress", () => {
			const progress = world.get(CampaignProgress)!;
			progress.missions.mission_1 = { status: "completed", stars: 3, bestTime: 420000 };
			progress.difficulty = "tactical";
			resetSessionState(world);
			// Campaign progress persists across sessions
			const after = world.get(CampaignProgress)!;
			expect(after.missions.mission_1).toBeDefined();
			expect(after.difficulty).toBe("tactical");
		});
	});

	describe("serialization shape", () => {
		it("missions record is plain JSON-serializable", () => {
			const progress = world.get(CampaignProgress)!;
			progress.missions.mission_1 = { status: "completed", stars: 3, bestTime: 420000 };
			progress.missions.mission_2 = { status: "unlocked", stars: 0, bestTime: 0 };
			progress.currentMission = "mission_2";
			progress.difficulty = "tactical";

			const json = JSON.stringify({
				missions: progress.missions,
				currentMission: progress.currentMission,
				difficulty: progress.difficulty,
			});
			const parsed = JSON.parse(json);
			expect(parsed.missions.mission_1.stars).toBe(3);
			expect(parsed.currentMission).toBe("mission_2");
			expect(parsed.difficulty).toBe("tactical");
		});
	});
});

describe("UserSettings trait", () => {
	describe("initialization", () => {
		it("has sensible defaults", () => {
			const settings = world.get(UserSettings)!;
			expect(settings.musicVolume).toBe(0.7);
			expect(settings.sfxVolume).toBe(1.0);
			expect(settings.hapticsEnabled).toBe(true);
			expect(settings.touchMode).toBe("auto");
			expect(settings.showGrid).toBe(false);
		});
	});

	describe("mutations", () => {
		it("can update volume settings", () => {
			const settings = world.get(UserSettings)!;
			settings.musicVolume = 0.3;
			settings.sfxVolume = 0.8;
			expect(world.get(UserSettings)!.musicVolume).toBe(0.3);
			expect(world.get(UserSettings)!.sfxVolume).toBe(0.8);
		});

		it("can toggle haptics", () => {
			const settings = world.get(UserSettings)!;
			settings.hapticsEnabled = false;
			expect(world.get(UserSettings)!.hapticsEnabled).toBe(false);
		});
	});

	describe("persistence across session reset", () => {
		it("resetSessionState does NOT clear user settings", () => {
			const settings = world.get(UserSettings)!;
			settings.musicVolume = 0.1;
			resetSessionState(world);
			expect(world.get(UserSettings)!.musicVolume).toBe(0.1);
		});
	});
});

describe("TerritoryState trait", () => {
	describe("initialization", () => {
		it("starts with zero villages", () => {
			const territory = world.get(TerritoryState)!;
			expect(territory.totalVillages).toBe(0);
			expect(territory.liberatedCount).toBe(0);
			expect(territory.occupiedCount).toBe(0);
		});
	});

	describe("mutations", () => {
		it("can update village counts", () => {
			world.set(TerritoryState, {
				totalVillages: 5,
				liberatedCount: 2,
				occupiedCount: 3,
			});
			const territory = world.get(TerritoryState)!;
			expect(territory.totalVillages).toBe(5);
			expect(territory.liberatedCount).toBe(2);
			expect(territory.occupiedCount).toBe(3);
		});
	});

	describe("reset", () => {
		it("resetSessionState resets territory to zeros", () => {
			world.set(TerritoryState, {
				totalVillages: 5,
				liberatedCount: 3,
				occupiedCount: 2,
			});
			resetSessionState(world);
			const territory = world.get(TerritoryState)!;
			expect(territory.totalVillages).toBe(0);
			expect(territory.liberatedCount).toBe(0);
			expect(territory.occupiedCount).toBe(0);
		});
	});
});
