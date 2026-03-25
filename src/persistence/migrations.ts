/**
 * SQLite migrations for Otter: Elite Force.
 *
 * Tables defined per spec section 11:
 * - campaign_progress: mission completion tracking with star ratings
 * - save_state: Koota world snapshot serialization (save slots)
 * - settings: user preferences (audio, controls, accessibility)
 * - unlocked_units: unit type unlock tracking
 * - unlocked_buildings: building type unlock tracking
 * - research: tech tree completion state
 *
 * @module persistence/migrations
 */
import type { DatabaseAdapter } from "./database";

const MIGRATIONS: string[] = [
	// campaign_progress
	`CREATE TABLE IF NOT EXISTS campaign_progress (
    mission_id TEXT PRIMARY KEY,
    chapter INTEGER NOT NULL,
    mission INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'locked',
    stars INTEGER NOT NULL DEFAULT 0,
    best_time_ms INTEGER,
    units_lost INTEGER,
    completed_at INTEGER,
    difficulty TEXT NOT NULL DEFAULT 'support'
  )`,

	// save_state
	`CREATE TABLE IF NOT EXISTS save_state (
    id INTEGER PRIMARY KEY,
    slot INTEGER NOT NULL,
    mission_id TEXT NOT NULL,
    mission_name TEXT NOT NULL DEFAULT '',
    snapshot_json TEXT NOT NULL,
    play_time_ms INTEGER NOT NULL DEFAULT 0,
    saved_at INTEGER NOT NULL
  )`,

	// settings (singleton row, id=1)
	`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY,
    master_volume REAL NOT NULL DEFAULT 1.0,
    music_volume REAL NOT NULL DEFAULT 0.7,
    sfx_volume REAL NOT NULL DEFAULT 1.0,
    haptics_enabled INTEGER NOT NULL DEFAULT 1,
    camera_speed REAL NOT NULL DEFAULT 1.0,
    ui_scale REAL NOT NULL DEFAULT 1.0,
    touch_mode TEXT NOT NULL DEFAULT 'auto',
    show_grid INTEGER NOT NULL DEFAULT 0,
    reduce_fx INTEGER NOT NULL DEFAULT 0
  )`,

	// unlocked_units
	`CREATE TABLE IF NOT EXISTS unlocked_units (
    unit_type TEXT PRIMARY KEY,
    unlocked_at_mission TEXT NOT NULL
  )`,

	// unlocked_buildings
	`CREATE TABLE IF NOT EXISTS unlocked_buildings (
    building_type TEXT PRIMARY KEY,
    unlocked_at_mission TEXT NOT NULL
  )`,

	// research
	`CREATE TABLE IF NOT EXISTS research (
    research_id TEXT PRIMARY KEY,
    completed INTEGER NOT NULL DEFAULT 0,
    completed_at_mission TEXT
  )`,
];

/**
 * Run all migrations against the given database adapter.
 * Uses CREATE TABLE IF NOT EXISTS so it's safe to run repeatedly.
 */
export async function runMigrations(db: DatabaseAdapter): Promise<void> {
	for (const sql of MIGRATIONS) {
		await db.execute(sql);
	}
}
