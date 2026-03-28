import { describe, expect, it } from "vitest";
import { isFinalCampaignMission, resolveMissionVictory } from "./missionResult";

describe("app/missionResult", () => {
	it("advances campaign progress while preserving the completed mission result", () => {
		const result = resolveMissionVictory(
			{
				missions: {
					mission_1: { status: "active", stars: 0, bestTime: 0 },
				},
				currentMission: "mission_1",
				difficulty: "support",
			},
			"mission_1",
			1,
		);

		expect(result.completedMissionId).toBe("mission_1");
		expect(result.nextMissionId).toBe("mission_2");
		expect(result.progress.currentMission).toBe("mission_2");
		expect(result.progress.missions.mission_1?.status).toBe("completed");
	});

	it("recognizes the final campaign mission", () => {
		expect(isFinalCampaignMission("mission_16")).toBe(true);
		expect(isFinalCampaignMission("mission_15")).toBe(false);
	});
});
