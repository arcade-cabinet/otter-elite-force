/**
 * Settings repository.
 *
 * Manages the singleton settings row (id=1) for user preferences.
 * Covers audio volumes, controls, accessibility, and display options.
 *
 * @module persistence/repos/settingsRepo
 */
import { getDatabase } from "../database";

export interface Settings {
	id: number;
	music_volume: number;
	sfx_volume: number;
	haptics_enabled: number;
	camera_speed: number;
	touch_mode: "auto" | "one_finger_select" | "two_finger_pan";
	show_grid: number;
	reduce_fx: number;
}

const DEFAULTS: Omit<Settings, "id"> = {
	music_volume: 0.7,
	sfx_volume: 1.0,
	haptics_enabled: 1,
	camera_speed: 1.0,
	touch_mode: "auto",
	show_grid: 0,
	reduce_fx: 0,
};

/** Ensure the singleton settings row exists with defaults. */
export async function ensureSettings(): Promise<void> {
	const db = getDatabase();
	const existing = await db.query<Settings>(
		"SELECT id, music_volume, sfx_volume, haptics_enabled, camera_speed, touch_mode, show_grid, reduce_fx FROM settings WHERE id = ?",
		[1],
	);
	if (existing.length === 0) {
		await db.execute(
			"INSERT INTO settings (id, music_volume, sfx_volume, haptics_enabled, camera_speed, touch_mode, show_grid, reduce_fx) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
			[
				1,
				DEFAULTS.music_volume,
				DEFAULTS.sfx_volume,
				DEFAULTS.haptics_enabled,
				DEFAULTS.camera_speed,
				DEFAULTS.touch_mode,
				DEFAULTS.show_grid,
				DEFAULTS.reduce_fx,
			],
		);
	}
}

/** Load the settings row. Returns undefined if not yet seeded. */
export async function loadSettings(): Promise<Settings | undefined> {
	const db = getDatabase();
	const rows = await db.query<Settings>(
		"SELECT id, music_volume, sfx_volume, haptics_enabled, camera_speed, touch_mode, show_grid, reduce_fx FROM settings WHERE id = ?",
		[1],
	);
	return rows[0];
}

/** Apply a partial update to settings. Only provided keys are overwritten. */
export async function saveSettings(patch: Partial<Omit<Settings, "id">>): Promise<void> {
	const db = getDatabase();
	const setClauses: string[] = [];
	const values: unknown[] = [];

	for (const [key, value] of Object.entries(patch)) {
		if (value !== undefined) {
			setClauses.push(`${key} = ?`);
			values.push(value);
		}
	}

	if (setClauses.length === 0) return;

	values.push(1); // WHERE id = ?
	await db.execute(`UPDATE settings SET ${setClauses.join(", ")} WHERE id = ?`, values);
}

/** Reset all settings to defaults. */
export async function resetSettings(): Promise<void> {
	await saveSettings(DEFAULTS);
}
