/**
 * Unlock state repository.
 *
 * Manages persistence for research completions, unit unlocks,
 * and building unlocks across campaign sessions.
 *
 * @module persistence/repos/unlockRepo
 */
import { getDatabase } from "../database";

// ---------------------------------------------------------------------------
// Research
// ---------------------------------------------------------------------------

export interface ResearchRow {
	research_id: string;
	completed: number;
	completed_at_mission: string | null;
}

/** Mark a research as completed. */
export async function completeResearch(
	researchId: string,
	missionId: string,
): Promise<void> {
	const db = getDatabase();
	await db.execute(
		"INSERT OR REPLACE INTO research (research_id, completed, completed_at_mission) VALUES (?, ?, ?)",
		[researchId, 1, missionId],
	);
}

/** Get all completed research IDs. */
export async function getCompletedResearch(): Promise<string[]> {
	const db = getDatabase();
	const rows = await db.query<ResearchRow>(
		"SELECT research_id, completed, completed_at_mission FROM research WHERE completed = ?",
		[1],
	);
	return rows.map((r) => r.research_id);
}

/** Check if a specific research is completed. */
export async function isResearchCompleted(researchId: string): Promise<boolean> {
	const db = getDatabase();
	const rows = await db.query<ResearchRow>(
		"SELECT research_id, completed, completed_at_mission FROM research WHERE research_id = ? AND completed = ?",
		[researchId, 1],
	);
	return rows.length > 0;
}

// ---------------------------------------------------------------------------
// Unit unlocks
// ---------------------------------------------------------------------------

export interface UnlockedUnitRow {
	unit_type: string;
	unlocked_at_mission: string;
}

/** Unlock a unit type. */
export async function unlockUnit(unitType: string, missionId: string): Promise<void> {
	const db = getDatabase();
	await db.execute(
		"INSERT OR REPLACE INTO unlocked_units (unit_type, unlocked_at_mission) VALUES (?, ?)",
		[unitType, missionId],
	);
}

/** Get all unlocked unit types. */
export async function getUnlockedUnits(): Promise<string[]> {
	const db = getDatabase();
	const rows = await db.query<UnlockedUnitRow>(
		"SELECT unit_type, unlocked_at_mission FROM unlocked_units",
	);
	return rows.map((r) => r.unit_type);
}

// ---------------------------------------------------------------------------
// Building unlocks
// ---------------------------------------------------------------------------

export interface UnlockedBuildingRow {
	building_type: string;
	unlocked_at_mission: string;
}

/** Unlock a building type. */
export async function unlockBuilding(buildingType: string, missionId: string): Promise<void> {
	const db = getDatabase();
	await db.execute(
		"INSERT OR REPLACE INTO unlocked_buildings (building_type, unlocked_at_mission) VALUES (?, ?)",
		[buildingType, missionId],
	);
}

/** Get all unlocked building types. */
export async function getUnlockedBuildings(): Promise<string[]> {
	const db = getDatabase();
	const rows = await db.query<UnlockedBuildingRow>(
		"SELECT building_type, unlocked_at_mission FROM unlocked_buildings",
	);
	return rows.map((r) => r.building_type);
}

// ---------------------------------------------------------------------------
// Bulk operations
// ---------------------------------------------------------------------------

/** Persist a full set of completed research IDs (e.g. from CompletedResearch trait). */
export async function persistResearchSet(
	researchIds: Set<string>,
	missionId: string,
): Promise<void> {
	for (const id of researchIds) {
		await completeResearch(id, missionId);
	}
}

/** Load all unlock state into a single snapshot. */
export async function loadAllUnlocks(): Promise<{
	research: string[];
	units: string[];
	buildings: string[];
}> {
	const [research, units, buildings] = await Promise.all([
		getCompletedResearch(),
		getUnlockedUnits(),
		getUnlockedBuildings(),
	]);
	return { research, units, buildings };
}
