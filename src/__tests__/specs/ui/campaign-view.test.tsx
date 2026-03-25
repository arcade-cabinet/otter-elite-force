/**
 * US-050: Campaign Progression UI
 * US-051: Difficulty Mode Selection
 *
 * Tests for the CampaignView component and difficulty system.
 */

import { createWorld, type World } from "koota";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { initSingletons } from "@/ecs/singletons";
import { AppScreen, CampaignProgress } from "@/ecs/traits/state";
import { CAMPAIGN } from "@/entities/missions";
import { canChangeDifficulty, DIFFICULTIES, getDifficultyDef } from "@/game/difficulty";

let world: World;

beforeEach(() => {
	world = createWorld();
	initSingletons(world);
});

afterEach(() => {
	world.destroy();
});

describe("US-050: Campaign progression data model", () => {
	it("campaign has exactly 16 missions across 4 chapters", () => {
		expect(CAMPAIGN).toHaveLength(16);
		const chapters = new Set(CAMPAIGN.map((m) => m.chapter));
		expect(chapters.size).toBe(4);
		for (let c = 1; c <= 4; c++) {
			const chapterMissions = CAMPAIGN.filter((m) => m.chapter === c);
			expect(chapterMissions).toHaveLength(4);
		}
	});

	it("mission 1 is always available in a fresh campaign", () => {
		const progress = world.get(CampaignProgress)!;
		// No missions completed, so mission_1 should be accessible
		expect(progress.missions).toEqual({});
		expect(CAMPAIGN[0].id).toBe("mission_1");
	});

	it("completing mission 1 unlocks mission 2", () => {
		const progress = world.get(CampaignProgress)!;
		progress.missions.mission_1 = { status: "completed", stars: 2, bestTime: 300000 };

		// mission_2 should now be available (previous is completed)
		const m2 = CAMPAIGN.find((m) => m.id === "mission_2");
		expect(m2).toBeDefined();
		const m2Index = CAMPAIGN.findIndex((m) => m.id === "mission_2");
		const prevCompleted = progress.missions[CAMPAIGN[m2Index - 1].id]?.status === "completed";
		expect(prevCompleted).toBe(true);
	});

	it("star ratings range from 0 to 3", () => {
		const progress = world.get(CampaignProgress)!;
		// Bronze
		progress.missions.mission_1 = { status: "completed", stars: 1, bestTime: 900000 };
		expect(progress.missions.mission_1.stars).toBe(1);
		// Silver
		progress.missions.mission_2 = { status: "completed", stars: 2, bestTime: 500000 };
		expect(progress.missions.mission_2.stars).toBe(2);
		// Gold
		progress.missions.mission_3 = { status: "completed", stars: 3, bestTime: 300000 };
		expect(progress.missions.mission_3.stars).toBe(3);
	});

	it("new game starts at mission 1 with chosen difficulty", () => {
		world.set(CampaignProgress, {
			missions: {},
			currentMission: CAMPAIGN[0].id,
			difficulty: "tactical",
		});
		const progress = world.get(CampaignProgress)!;
		expect(progress.currentMission).toBe("mission_1");
		expect(progress.difficulty).toBe("tactical");
	});
});

describe("US-051: Difficulty mode selection", () => {
	it("defines three difficulty levels", () => {
		expect(DIFFICULTIES).toHaveLength(3);
		const ids = DIFFICULTIES.map((d) => d.id);
		expect(ids).toContain("support");
		expect(ids).toContain("tactical");
		expect(ids).toContain("elite");
	});

	it("Support has 0.75x enemy damage and 1.25x resources", () => {
		const support = getDifficultyDef("support");
		expect(support.enemyDamageMultiplier).toBe(0.75);
		expect(support.resourceMultiplier).toBe(1.25);
	});

	it("Tactical has 1x damage and 1x resources", () => {
		const tactical = getDifficultyDef("tactical");
		expect(tactical.enemyDamageMultiplier).toBe(1.0);
		expect(tactical.resourceMultiplier).toBe(1.0);
	});

	it("Elite has 1.25x enemy damage and 0.75x resources", () => {
		const elite = getDifficultyDef("elite");
		expect(elite.enemyDamageMultiplier).toBe(1.25);
		expect(elite.resourceMultiplier).toBe(0.75);
	});

	it("difficulty is stored in CampaignProgress", () => {
		world.set(CampaignProgress, {
			missions: {},
			currentMission: "mission_1",
			difficulty: "elite",
		});
		expect(world.get(CampaignProgress)!.difficulty).toBe("elite");
	});

	it("difficulty cannot be lowered mid-campaign", () => {
		// support -> tactical: allowed (escalation)
		expect(canChangeDifficulty("support", "tactical")).toBe(true);
		// support -> elite: allowed (escalation)
		expect(canChangeDifficulty("support", "elite")).toBe(true);
		// tactical -> support: NOT allowed (de-escalation)
		expect(canChangeDifficulty("tactical", "support")).toBe(false);
		// elite -> tactical: NOT allowed (de-escalation)
		expect(canChangeDifficulty("elite", "tactical")).toBe(false);
		// same difficulty: allowed
		expect(canChangeDifficulty("tactical", "tactical")).toBe(true);
	});

	it("navigates to campaign screen on new game", () => {
		world.set(CampaignProgress, {
			missions: {},
			currentMission: CAMPAIGN[0].id,
			difficulty: "support",
		});
		world.set(AppScreen, { screen: "campaign" });
		expect(world.get(AppScreen)!.screen).toBe("campaign");
	});
});
