/**
 * Campaign progress repository.
 *
 * CRUD operations for the campaign_progress table.
 * Tracks mission status, star ratings, and completion stats.
 *
 * @module persistence/repos/campaignRepo
 */
import { getDatabase } from "../database";

export interface CampaignProgress {
	mission_id: string;
	chapter: number;
	mission: number;
	status: "locked" | "available" | "completed";
	stars: number;
	best_time_ms: number | null;
	units_lost: number | null;
	completed_at: number | null;
}

/** Get progress for a specific mission. */
export async function getMissionProgress(missionId: string): Promise<CampaignProgress | undefined> {
	const db = getDatabase();
	const rows = await db.query<CampaignProgress>(
		"SELECT mission_id, chapter, mission, status, stars, best_time_ms, units_lost, completed_at FROM campaign_progress WHERE mission_id = ?",
		[missionId],
	);
	return rows[0];
}

/** Get all mission progress, ordered by chapter then mission. */
export async function getAllProgress(): Promise<CampaignProgress[]> {
	const db = getDatabase();
	return db.query<CampaignProgress>(
		"SELECT mission_id, chapter, mission, status, stars, best_time_ms, units_lost, completed_at FROM campaign_progress ORDER BY chapter ASC",
	);
}

/** Get progress for all missions in a specific chapter. */
export async function getChapterProgress(chapter: number): Promise<CampaignProgress[]> {
	const db = getDatabase();
	return db.query<CampaignProgress>(
		"SELECT mission_id, chapter, mission, status, stars, best_time_ms, units_lost, completed_at FROM campaign_progress WHERE chapter = ?",
		[chapter],
	);
}

/** Create or update a mission's initial state (locked/available). */
export async function upsertMission(
	missionId: string,
	chapter: number,
	mission: number,
	status: CampaignProgress["status"] = "locked",
): Promise<void> {
	const db = getDatabase();
	await db.execute(
		"INSERT OR REPLACE INTO campaign_progress (mission_id, chapter, mission, status, stars) VALUES (?, ?, ?, ?, ?)",
		[missionId, chapter, mission, status, 0],
	);
}

/** Mark a mission as completed with star rating and stats. */
export async function completeMission(
	missionId: string,
	stars: number,
	timeMs: number,
	unitsLost: number,
): Promise<void> {
	const db = getDatabase();
	// Only update if new stars are higher (keep best score)
	const existing = await getMissionProgress(missionId);
	const finalStars = existing ? Math.max(existing.stars, stars) : stars;
	const finalTime =
		existing?.best_time_ms != null ? Math.min(existing.best_time_ms, timeMs) : timeMs;

	await db.execute(
		"UPDATE campaign_progress SET status = ?, stars = ?, best_time_ms = ?, units_lost = ?, completed_at = ? WHERE mission_id = ?",
		["completed", finalStars, finalTime, unitsLost, Date.now(), missionId],
	);
}

/** Unlock a mission (set status to 'available'). */
export async function unlockMission(missionId: string): Promise<void> {
	const db = getDatabase();
	await db.execute("UPDATE campaign_progress SET status = ? WHERE mission_id = ?", [
		"available",
		missionId,
	]);
}

/** Get total star count across all missions. */
export async function getTotalStars(): Promise<number> {
	const all = await getAllProgress();
	return all.reduce((sum, m) => sum + m.stars, 0);
}

/**
 * Seed initial campaign progress for all 16 missions.
 * Mission 1 starts as 'available', all others 'locked'.
 */
export async function seedCampaign(): Promise<void> {
	const missions = [
		// Chapter 1
		{ id: "mission_1", chapter: 1, mission: 1, status: "available" as const },
		{ id: "mission_2", chapter: 1, mission: 2, status: "locked" as const },
		{ id: "mission_3", chapter: 1, mission: 3, status: "locked" as const },
		{ id: "mission_4", chapter: 1, mission: 4, status: "locked" as const },
		// Chapter 2
		{ id: "mission_5", chapter: 2, mission: 5, status: "locked" as const },
		{ id: "mission_6", chapter: 2, mission: 6, status: "locked" as const },
		{ id: "mission_7", chapter: 2, mission: 7, status: "locked" as const },
		{ id: "mission_8", chapter: 2, mission: 8, status: "locked" as const },
		// Chapter 3
		{ id: "mission_9", chapter: 3, mission: 9, status: "locked" as const },
		{ id: "mission_10", chapter: 3, mission: 10, status: "locked" as const },
		{ id: "mission_11", chapter: 3, mission: 11, status: "locked" as const },
		{ id: "mission_12", chapter: 3, mission: 12, status: "locked" as const },
		// Chapter 4
		{ id: "mission_13", chapter: 4, mission: 13, status: "locked" as const },
		{ id: "mission_14", chapter: 4, mission: 14, status: "locked" as const },
		{ id: "mission_15", chapter: 4, mission: 15, status: "locked" as const },
		{ id: "mission_16", chapter: 4, mission: 16, status: "locked" as const },
	];

	for (const m of missions) {
		await upsertMission(m.id, m.chapter, m.mission, m.status);
	}
}
