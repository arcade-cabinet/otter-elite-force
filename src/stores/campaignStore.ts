/**
 * Campaign state store.
 *
 * Zustand store for campaign progression: mission status, stars, unlocks.
 * Hydrates from SQLite on init, writes back on mutation.
 *
 * @module stores/campaignStore
 */
import { createStore } from "zustand/vanilla";
import {
	completeMission as dbCompleteMission,
	getAllProgress,
	getMissionProgress,
	seedCampaign,
	unlockMission as dbUnlockMission,
} from "../persistence/repos/campaignRepo";
import type { CampaignProgress } from "../persistence/repos/campaignRepo";

interface CampaignState {
	/** All mission progress keyed by mission_id */
	missions: Record<string, CampaignProgress>;
	/** Total star count */
	totalStars: number;
	/** Whether the store has been hydrated from SQLite */
	hydrated: boolean;

	/** Load all campaign progress from SQLite */
	hydrate: () => Promise<void>;
	/** Complete a mission with results */
	completeMission: (
		missionId: string,
		stars: number,
		timeMs: number,
		unitsLost: number,
	) => Promise<void>;
	/** Unlock the next mission */
	unlockMission: (missionId: string) => Promise<void>;
	/** Get progress for a specific mission */
	getMission: (missionId: string) => CampaignProgress | undefined;
}

export const useCampaignStore = createStore<CampaignState>((set, get) => ({
	missions: {},
	totalStars: 0,
	hydrated: false,

	hydrate: async () => {
		const all = await getAllProgress();
		if (all.length === 0) {
			await seedCampaign();
			const seeded = await getAllProgress();
			const missions: Record<string, CampaignProgress> = {};
			let stars = 0;
			for (const m of seeded) {
				missions[m.mission_id] = m;
				stars += m.stars;
			}
			set({ missions, totalStars: stars, hydrated: true });
		} else {
			const missions: Record<string, CampaignProgress> = {};
			let stars = 0;
			for (const m of all) {
				missions[m.mission_id] = m;
				stars += m.stars;
			}
			set({ missions, totalStars: stars, hydrated: true });
		}
	},

	completeMission: async (missionId, stars, timeMs, unitsLost) => {
		await dbCompleteMission(missionId, stars, timeMs, unitsLost);
		// Re-read the updated row
		const updated = await getMissionProgress(missionId);
		if (updated) {
			set((state) => {
				const missions = { ...state.missions, [missionId]: updated };
				const totalStars = Object.values(missions).reduce((sum, m) => sum + m.stars, 0);
				return { missions, totalStars };
			});
		}
	},

	unlockMission: async (missionId) => {
		await dbUnlockMission(missionId);
		const updated = await getMissionProgress(missionId);
		if (updated) {
			set((state) => ({
				missions: { ...state.missions, [missionId]: updated },
			}));
		}
	},

	getMission: (missionId) => get().missions[missionId],
}));
