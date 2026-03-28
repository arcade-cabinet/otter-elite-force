import { CAMPAIGN } from "@/entities/missions";

export interface CampaignProgressState {
	missions: Record<string, { status: string; stars: number; bestTime: number }>;
	currentMission: string | null;
	difficulty: string;
}

export interface MissionVictoryResolution {
	progress: CampaignProgressState;
	completedMissionId: string;
	nextMissionId: string;
	stars: 0 | 1 | 2 | 3;
}

export function resolveMissionVictory(
	progress: CampaignProgressState,
	missionId: string,
	stars: 0 | 1 | 2 | 3 = 1,
): MissionVictoryResolution {
	const currentIndex = CAMPAIGN.findIndex((mission) => mission.id === missionId);
	const nextMission = currentIndex >= 0 ? CAMPAIGN[currentIndex + 1] : undefined;
	const existing = progress.missions[missionId];

	return {
		progress: {
			...progress,
			missions: {
				...progress.missions,
				[missionId]: {
					status: "completed",
					stars: Math.max(existing?.stars ?? 0, stars),
					bestTime: existing?.bestTime ?? 0,
				},
			},
			currentMission: nextMission?.id ?? missionId,
		},
		completedMissionId: missionId,
		nextMissionId: nextMission?.id ?? missionId,
		stars,
	};
}

export function isFinalCampaignMission(missionId: string): boolean {
	return CAMPAIGN.at(-1)?.id === missionId;
}
