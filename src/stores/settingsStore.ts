/**
 * Settings store.
 *
 * Zustand store for user preferences: audio volumes, controls, accessibility.
 * Hydrates from SQLite on init, writes back on mutation.
 *
 * @module stores/settingsStore
 */
import { createStore } from "zustand/vanilla";
import {
	ensureSettings,
	loadSettings,
	saveSettings as dbSaveSettings,
	resetSettings as dbResetSettings,
} from "../persistence/repos/settingsRepo";

interface SettingsState {
	musicVolume: number;
	sfxVolume: number;
	hapticsEnabled: boolean;
	cameraSpeed: number;
	touchMode: "auto" | "one_finger_select" | "two_finger_pan";
	showGrid: boolean;
	reduceFx: boolean;
	hydrated: boolean;

	/** Load settings from SQLite */
	hydrate: () => Promise<void>;
	/** Update one or more settings (writes to SQLite) */
	update: (
		patch: Partial<
			Pick<
				SettingsState,
				| "musicVolume"
				| "sfxVolume"
				| "hapticsEnabled"
				| "cameraSpeed"
				| "touchMode"
				| "showGrid"
				| "reduceFx"
			>
		>,
	) => Promise<void>;
	/** Reset all settings to defaults */
	reset: () => Promise<void>;
}

export const useSettingsStore = createStore<SettingsState>((set) => ({
	musicVolume: 0.7,
	sfxVolume: 1.0,
	hapticsEnabled: true,
	cameraSpeed: 1.0,
	touchMode: "auto",
	showGrid: false,
	reduceFx: false,
	hydrated: false,

	hydrate: async () => {
		await ensureSettings();
		const row = await loadSettings();
		if (row) {
			set({
				musicVolume: row.music_volume,
				sfxVolume: row.sfx_volume,
				hapticsEnabled: row.haptics_enabled === 1,
				cameraSpeed: row.camera_speed,
				touchMode: row.touch_mode,
				showGrid: row.show_grid === 1,
				reduceFx: row.reduce_fx === 1,
				hydrated: true,
			});
		} else {
			set({ hydrated: true });
		}
	},

	update: async (patch) => {
		// Update Zustand state immediately
		set((state) => ({ ...state, ...patch }));

		// Map camelCase keys to snake_case SQL columns
		const dbPatch: Record<string, unknown> = {};
		if (patch.musicVolume !== undefined) dbPatch.music_volume = patch.musicVolume;
		if (patch.sfxVolume !== undefined) dbPatch.sfx_volume = patch.sfxVolume;
		if (patch.hapticsEnabled !== undefined) dbPatch.haptics_enabled = patch.hapticsEnabled ? 1 : 0;
		if (patch.cameraSpeed !== undefined) dbPatch.camera_speed = patch.cameraSpeed;
		if (patch.touchMode !== undefined) dbPatch.touch_mode = patch.touchMode;
		if (patch.showGrid !== undefined) dbPatch.show_grid = patch.showGrid ? 1 : 0;
		if (patch.reduceFx !== undefined) dbPatch.reduce_fx = patch.reduceFx ? 1 : 0;

		await dbSaveSettings(dbPatch);
	},

	reset: async () => {
		await dbResetSettings();
		set({
			musicVolume: 0.7,
			sfxVolume: 1.0,
			hapticsEnabled: true,
			cameraSpeed: 1.0,
			touchMode: "auto",
			showGrid: false,
			reduceFx: false,
		});
	},
}));
