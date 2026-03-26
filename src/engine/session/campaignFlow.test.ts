/**
 * US-E01 — Campaign Flow E2E Tests
 *
 * Tests the full campaign lifecycle: start, advance through all 16 missions,
 * star ratings, partial progress, and campaign completion.
 */

import { describe, expect, it } from "vitest";
import { CAMPAIGN } from "@/entities/missions";
import {
	advanceCampaign,
	getCampaignNextMission,
	getCompletedMissionCount,
	getTotalStars,
	isCampaignComplete,
	startNewCampaign,
	type CampaignProgress,
} from "./campaignFlow";

describe("US-E01: Campaign Flow", () => {
	it("starts a new campaign with mission 1 available and all others locked", () => {
		const progress = startNewCampaign();

		expect(progress.currentMissionId).toBe("mission_1");
		expect(progress.difficulty).toBe("support");
		expect(progress.missions.mission_1.status).toBe("available");
		expect(progress.missions.mission_1.stars).toBe(0);

		// All remaining missions should be locked
		for (let i = 1; i < CAMPAIGN.length; i++) {
			const m = CAMPAIGN[i];
			expect(progress.missions[m.id].status).toBe("locked");
		}
	});

	it("starts a campaign with a custom difficulty", () => {
		const progress = startNewCampaign("elite");
		expect(progress.difficulty).toBe("elite");
	});

	it("advances campaign after completing mission 1", () => {
		let progress = startNewCampaign();

		progress = advanceCampaign(progress, "mission_1", { stars: 2, timeMs: 120000 });

		expect(progress.missions.mission_1.status).toBe("completed");
		expect(progress.missions.mission_1.stars).toBe(2);
		expect(progress.missions.mission_1.bestTime).toBe(120000);
		expect(progress.missions.mission_2.status).toBe("available");
		expect(progress.currentMissionId).toBe("mission_2");
	});

	it("preserves best stars across replays", () => {
		let progress = startNewCampaign();

		// First completion with 1 star
		progress = advanceCampaign(progress, "mission_1", { stars: 1, timeMs: 300000 });
		expect(progress.missions.mission_1.stars).toBe(1);

		// Replay with 3 stars — should upgrade
		progress = advanceCampaign(progress, "mission_1", { stars: 3, timeMs: 250000 });
		expect(progress.missions.mission_1.stars).toBe(3);

		// Replay with 2 stars — should NOT downgrade
		progress = advanceCampaign(progress, "mission_1", { stars: 2, timeMs: 200000 });
		expect(progress.missions.mission_1.stars).toBe(3);
	});

	it("preserves best time across replays", () => {
		let progress = startNewCampaign();

		progress = advanceCampaign(progress, "mission_1", { stars: 1, timeMs: 300000 });
		expect(progress.missions.mission_1.bestTime).toBe(300000);

		// Faster replay
		progress = advanceCampaign(progress, "mission_1", { stars: 1, timeMs: 200000 });
		expect(progress.missions.mission_1.bestTime).toBe(200000);

		// Slower replay — should keep faster time
		progress = advanceCampaign(progress, "mission_1", { stars: 1, timeMs: 400000 });
		expect(progress.missions.mission_1.bestTime).toBe(200000);
	});

	it("does not unlock missions out of order", () => {
		let progress = startNewCampaign();

		// Complete mission 1
		progress = advanceCampaign(progress, "mission_1", { stars: 1, timeMs: 120000 });

		// Mission 2 should be available, mission 3 should still be locked
		expect(progress.missions.mission_2.status).toBe("available");
		expect(progress.missions.mission_3.status).toBe("locked");
	});

	it("full campaign progression: start to finish across all 16 missions", () => {
		let progress = startNewCampaign("tactical");

		expect(isCampaignComplete(progress)).toBe(false);
		expect(getCompletedMissionCount(progress)).toBe(0);

		for (let i = 0; i < CAMPAIGN.length; i++) {
			const mission = CAMPAIGN[i];
			const nextMission = getCampaignNextMission(progress);
			expect(nextMission).toBe(mission.id);

			progress = advanceCampaign(progress, mission.id, {
				stars: ((i % 3) + 1) as 1 | 2 | 3,
				timeMs: 60000 + i * 10000,
			});

			expect(progress.missions[mission.id].status).toBe("completed");
			expect(getCompletedMissionCount(progress)).toBe(i + 1);

			// After completing mission i, if not the last, the next should be available
			if (i < CAMPAIGN.length - 1) {
				const nextId = CAMPAIGN[i + 1].id;
				expect(progress.missions[nextId].status).toBe("available");
				expect(isCampaignComplete(progress)).toBe(false);
			}
		}

		// Campaign should now be complete
		expect(isCampaignComplete(progress)).toBe(true);
		expect(getCampaignNextMission(progress)).toBeNull();
		expect(getCompletedMissionCount(progress)).toBe(16);
	});

	it("star rating persistence across the full campaign", () => {
		let progress = startNewCampaign();

		// Complete all missions with varying stars
		for (let i = 0; i < CAMPAIGN.length; i++) {
			const mission = CAMPAIGN[i];
			const stars = ((i % 3) + 1) as 1 | 2 | 3;
			progress = advanceCampaign(progress, mission.id, { stars, timeMs: 100000 });
		}

		// Verify stars were stored correctly
		for (let i = 0; i < CAMPAIGN.length; i++) {
			const mission = CAMPAIGN[i];
			const expectedStars = (i % 3) + 1;
			expect(progress.missions[mission.id].stars).toBe(expectedStars);
		}

		// Total stars: sum of ((i % 3) + 1) for i = 0..15
		// Pattern: 1,2,3,1,2,3,... for 16 missions = 5*6 + 1+2 = 33
		const totalStars = getTotalStars(progress);
		let expectedTotal = 0;
		for (let i = 0; i < 16; i++) {
			expectedTotal += (i % 3) + 1;
		}
		expect(totalStars).toBe(expectedTotal);
	});

	it("partial progress: some missions complete, some locked", () => {
		let progress = startNewCampaign();

		// Complete first 5 missions
		for (let i = 0; i < 5; i++) {
			progress = advanceCampaign(progress, CAMPAIGN[i].id, {
				stars: 2,
				timeMs: 120000,
			});
		}

		expect(getCompletedMissionCount(progress)).toBe(5);
		expect(isCampaignComplete(progress)).toBe(false);

		// Mission 6 should be available (next to play)
		expect(progress.missions.mission_6.status).toBe("available");
		expect(getCampaignNextMission(progress)).toBe("mission_6");

		// Missions 7-16 should be locked
		for (let i = 6; i < CAMPAIGN.length; i++) {
			expect(progress.missions[CAMPAIGN[i].id].status).toBe("locked");
		}
	});

	it("getCampaignNextMission returns null when all missions are completed", () => {
		let progress = startNewCampaign();

		for (const mission of CAMPAIGN) {
			progress = advanceCampaign(progress, mission.id, { stars: 3, timeMs: 50000 });
		}

		expect(getCampaignNextMission(progress)).toBeNull();
	});

	it("getCampaignNextMission returns the first available mission", () => {
		const progress = startNewCampaign();
		expect(getCampaignNextMission(progress)).toBe("mission_1");
	});

	it("advanceCampaign does not mutate the input progress", () => {
		const original = startNewCampaign();
		const originalMission1Status = original.missions.mission_1.status;

		const updated = advanceCampaign(original, "mission_1", {
			stars: 3,
			timeMs: 100000,
		});

		// Original should be unchanged
		expect(original.missions.mission_1.status).toBe(originalMission1Status);
		expect(original.currentMissionId).toBe("mission_1");

		// Updated should be different
		expect(updated.missions.mission_1.status).toBe("completed");
		expect(updated.currentMissionId).toBe("mission_2");
	});

	it("handles replaying a previously completed mission", () => {
		let progress = startNewCampaign();

		// Complete missions 1-3
		for (let i = 0; i < 3; i++) {
			progress = advanceCampaign(progress, CAMPAIGN[i].id, {
				stars: 1,
				timeMs: 120000,
			});
		}

		// Replay mission 1 with better score
		progress = advanceCampaign(progress, "mission_1", { stars: 3, timeMs: 80000 });

		expect(progress.missions.mission_1.status).toBe("completed");
		expect(progress.missions.mission_1.stars).toBe(3);
		expect(progress.missions.mission_1.bestTime).toBe(80000);

		// Missions 2-3 should still be completed, mission 4 available
		expect(progress.missions.mission_2.status).toBe("completed");
		expect(progress.missions.mission_3.status).toBe("completed");
		expect(progress.missions.mission_4.status).toBe("available");
	});

	it("getTotalStars returns correct aggregate across missions", () => {
		let progress = startNewCampaign();

		progress = advanceCampaign(progress, "mission_1", { stars: 3, timeMs: 100000 });
		progress = advanceCampaign(progress, "mission_2", { stars: 2, timeMs: 150000 });

		expect(getTotalStars(progress)).toBe(5);
	});

	it("getCompletedMissionCount returns 0 for fresh campaign", () => {
		const progress = startNewCampaign();
		expect(getCompletedMissionCount(progress)).toBe(0);
	});

	it("campaign has exactly 16 missions", () => {
		expect(CAMPAIGN.length).toBe(16);
	});
});
