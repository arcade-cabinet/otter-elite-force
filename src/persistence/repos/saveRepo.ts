/**
 * Save state repository.
 *
 * Manages save/load of Koota world snapshots (JSON blobs) across 3 slots.
 *
 * @module persistence/repos/saveRepo
 */
import { getDatabase } from "../database";

export interface SaveState {
	id: number;
	slot: number;
	mission_id: string;
	snapshot_json: string;
	saved_at: number;
}

/** Save a world snapshot to a slot (0=auto, 1-3=manual). Overwrites existing save in that slot. */
export async function saveGame(
	slot: number,
	missionId: string,
	snapshotJson: string,
	_label?: string,
	_playTimeMs?: number,
): Promise<void> {
	const db = getDatabase();
	// Delete existing save in this slot, then insert new one
	await db.execute("DELETE FROM save_state WHERE slot = ?", [slot]);
	await db.execute(
		"INSERT INTO save_state (slot, mission_id, snapshot_json, saved_at) VALUES (?, ?, ?, ?)",
		[slot, missionId, snapshotJson, Date.now()],
	);
}

/** Load a save from a specific slot. Returns undefined if slot is empty. */
export async function loadGame(slot: number): Promise<SaveState | undefined> {
	const db = getDatabase();
	const rows = await db.query<SaveState>(
		"SELECT id, slot, mission_id, snapshot_json, saved_at FROM save_state WHERE slot = ?",
		[slot],
	);
	return rows[0];
}

/** Get metadata for all save slots (without full snapshot JSON). */
export async function listSaves(): Promise<
	Array<{ slot: number; mission_id: string; saved_at: number }>
> {
	const db = getDatabase();
	return db.query("SELECT slot, mission_id, saved_at FROM save_state ORDER BY slot ASC");
}

/** Delete a save in a specific slot. */
export async function deleteSave(slot: number): Promise<void> {
	const db = getDatabase();
	await db.execute("DELETE FROM save_state WHERE slot = ?", [slot]);
}

/** Check if a slot has a save. */
export async function hasSave(slot: number): Promise<boolean> {
	const save = await loadGame(slot);
	return save !== undefined;
}

/** Metadata for a save slot (without full snapshot JSON). */
export interface SaveSlotInfo {
	slot: number;
	mission_id: string;
	saved_at: number;
}

/** Get the most recently saved slot info. Returns undefined if no saves exist. */
export async function getLatestSave(): Promise<SaveSlotInfo | undefined> {
	const db = getDatabase();
	const rows = await db.query<SaveSlotInfo>(
		"SELECT slot, mission_id, saved_at FROM save_state ORDER BY saved_at DESC LIMIT 1",
	);
	return rows[0];
}

/** Check if any save exists across all slots. */
export async function hasAnySave(): Promise<boolean> {
	const db = getDatabase();
	const rows = await db.query<{ cnt: number }>(
		"SELECT COUNT(*) AS cnt FROM save_state",
	);
	return (rows[0]?.cnt ?? 0) > 0;
}
