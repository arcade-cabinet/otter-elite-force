/**
 * Campaign Flow — Pure logic for campaign state progression.
 *
 * US-E01: Provides campaign lifecycle management without persistence
 * or React dependencies. Works directly with the CAMPAIGN mission list.
 *
 * - startNewCampaign() — initializes fresh campaign state
 * - advanceCampaign() — marks mission complete, unlocks next
 * - getCampaignNextMission() — returns next unlocked unplayed mission
 * - isCampaignComplete() — all 16 done
 */

import { CAMPAIGN } from "@/entities/missions";

export interface MissionProgress {
	status: "locked" | "available" | "completed";
	stars: 0 | 1 | 2 | 3;
	bestTime: number;
}

export interface CampaignProgress {
	missions: Record<string, MissionProgress>;
	currentMissionId: string | null;
	difficulty: "support" | "tactical" | "elite";
}

export interface MissionResult {
	stars: 0 | 1 | 2 | 3;
	timeMs: number;
}

/**
 * Start a new campaign with mission 1 available and all others locked.
 */
export function startNewCampaign(
	difficulty: "support" | "tactical" | "elite" = "support",
): CampaignProgress {
	const missions: Record<string, MissionProgress> = {};

	for (let i = 0; i < CAMPAIGN.length; i++) {
		const mission = CAMPAIGN[i];
		missions[mission.id] = {
			status: i === 0 ? "available" : "locked",
			stars: 0,
			bestTime: 0,
		};
	}

	const firstMission = CAMPAIGN[0];
	return {
		missions,
		currentMissionId: firstMission ? firstMission.id : null,
		difficulty,
	};
}

/**
 * Advance campaign state after completing a mission.
 *
 * - Marks the mission as completed with the given result
 * - Preserves best stars and best time
 * - Unlocks the next sequential mission if locked
 * - Updates currentMissionId to the next available mission
 *
 * Returns a new CampaignProgress (does not mutate the input).
 */
export function advanceCampaign(
	progress: CampaignProgress,
	missionId: string,
	result: MissionResult,
): CampaignProgress {
	const existing = progress.missions[missionId];

	const updatedMissions: Record<string, MissionProgress> = {
		...progress.missions,
		[missionId]: {
			status: "completed",
			stars: existing ? (Math.max(existing.stars, result.stars) as 0 | 1 | 2 | 3) : result.stars,
			bestTime: existing?.bestTime ? Math.min(existing.bestTime, result.timeMs) : result.timeMs,
		},
	};

	// Find the index of the completed mission
	const completedIndex = CAMPAIGN.findIndex((m) => m.id === missionId);

	// Unlock the next mission if it exists and is locked
	if (completedIndex >= 0 && completedIndex < CAMPAIGN.length - 1) {
		const nextMission = CAMPAIGN[completedIndex + 1];
		const nextProgress = updatedMissions[nextMission.id];
		if (nextProgress && nextProgress.status === "locked") {
			updatedMissions[nextMission.id] = {
				...nextProgress,
				status: "available",
			};
		}
	}

	// Determine current mission: next available after the completed one
	let nextCurrentId: string | null = null;
	for (let i = completedIndex + 1; i < CAMPAIGN.length; i++) {
		const m = CAMPAIGN[i];
		if (
			updatedMissions[m.id]?.status === "available" ||
			updatedMissions[m.id]?.status === "completed"
		) {
			if (updatedMissions[m.id]?.status === "available") {
				nextCurrentId = m.id;
				break;
			}
		}
	}

	// If no next available found, check if campaign is complete
	if (!nextCurrentId) {
		// If all missions complete, keep current at the last mission
		const allComplete = CAMPAIGN.every((m) => updatedMissions[m.id]?.status === "completed");
		if (allComplete) {
			const lastMission = CAMPAIGN[CAMPAIGN.length - 1];
			nextCurrentId = lastMission ? lastMission.id : missionId;
		} else {
			// Find first available
			for (const m of CAMPAIGN) {
				if (updatedMissions[m.id]?.status === "available") {
					nextCurrentId = m.id;
					break;
				}
			}
			// Fallback to the just-completed mission
			if (!nextCurrentId) {
				nextCurrentId = missionId;
			}
		}
	}

	return {
		missions: updatedMissions,
		currentMissionId: nextCurrentId,
		difficulty: progress.difficulty,
	};
}

/**
 * Get the next mission the player should play.
 * Returns the first available (unlocked but not completed) mission ID,
 * or null if all missions are completed.
 */
export function getCampaignNextMission(progress: CampaignProgress): string | null {
	for (const mission of CAMPAIGN) {
		const p = progress.missions[mission.id];
		if (p?.status === "available") {
			return mission.id;
		}
	}
	return null;
}

/**
 * Check if the entire campaign is complete (all 16 missions completed).
 */
export function isCampaignComplete(progress: CampaignProgress): boolean {
	return CAMPAIGN.every((mission) => progress.missions[mission.id]?.status === "completed");
}

/**
 * Get the total number of stars earned across all missions.
 */
export function getTotalStars(progress: CampaignProgress): number {
	let total = 0;
	for (const mission of CAMPAIGN) {
		const p = progress.missions[mission.id];
		if (p) {
			total += p.stars;
		}
	}
	return total;
}

/**
 * Get the count of completed missions.
 */
export function getCompletedMissionCount(progress: CampaignProgress): number {
	return CAMPAIGN.filter((mission) => progress.missions[mission.id]?.status === "completed").length;
}
