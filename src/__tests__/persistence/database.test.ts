/**
 * Tests for the persistence layer: database, migrations, repos, and stores.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { InMemoryDatabase, closeDatabase, setDatabase } from "../../persistence/database";
import { runMigrations } from "../../persistence/migrations";
import {
	completeMission,
	getAllProgress,
	getMissionProgress,
	seedCampaign,
	unlockMission,
	upsertMission,
} from "../../persistence/repos/campaignRepo";
import {
	deleteSave,
	hasSave,
	listSaves,
	loadGame,
	saveGame,
} from "../../persistence/repos/saveRepo";
import {
	ensureSettings,
	loadSettings,
	resetSettings,
	saveSettings,
} from "../../persistence/repos/settingsRepo";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

let db: InMemoryDatabase;

beforeEach(async () => {
	db = new InMemoryDatabase();
	setDatabase(db);
	await runMigrations(db);
});

afterEach(async () => {
	await closeDatabase();
});

// ---------------------------------------------------------------------------
// Database + Migrations
// ---------------------------------------------------------------------------

describe("InMemoryDatabase + Migrations", () => {
	it("should create all 6 tables", async () => {
		// Verify tables exist by querying them (empty results = table exists)
		const campaign = await db.query(
			"SELECT mission_id, chapter, mission, status, stars, best_time_ms, units_lost, completed_at FROM campaign_progress",
		);
		const saves = await db.query(
			"SELECT id, slot, mission_id, snapshot_json, saved_at FROM save_state",
		);
		const settings = await db.query(
			"SELECT id, music_volume, sfx_volume, haptics_enabled, camera_speed, touch_mode, show_grid, reduce_fx FROM settings",
		);
		const units = await db.query("SELECT unit_type, unlocked_at_mission FROM unlocked_units");
		const buildings = await db.query(
			"SELECT building_type, unlocked_at_mission FROM unlocked_buildings",
		);
		const research = await db.query(
			"SELECT research_id, completed, completed_at_mission FROM research",
		);

		expect(campaign).toEqual([]);
		expect(saves).toEqual([]);
		expect(settings).toEqual([]);
		expect(units).toEqual([]);
		expect(buildings).toEqual([]);
		expect(research).toEqual([]);
	});

	it("should be idempotent (run migrations twice)", async () => {
		await runMigrations(db);
		const campaign = await db.query(
			"SELECT mission_id, chapter, mission, status, stars, best_time_ms, units_lost, completed_at FROM campaign_progress",
		);
		expect(campaign).toEqual([]);
	});
});

// ---------------------------------------------------------------------------
// campaignRepo
// ---------------------------------------------------------------------------

describe("campaignRepo", () => {
	it("should seed 16 missions", async () => {
		await seedCampaign();
		const all = await getAllProgress();
		expect(all).toHaveLength(16);
	});

	it("should set mission 1 as available, rest as locked", async () => {
		await seedCampaign();
		const m1 = await getMissionProgress("ch1-m1");
		const m2 = await getMissionProgress("ch1-m2");

		expect(m1?.status).toBe("available");
		expect(m2?.status).toBe("locked");
	});

	it("should upsert and retrieve a mission", async () => {
		await upsertMission("test-m1", 1, 1, "available");
		const result = await getMissionProgress("test-m1");

		expect(result).toBeDefined();
		expect(result?.mission_id).toBe("test-m1");
		expect(result?.chapter).toBe(1);
		expect(result?.status).toBe("available");
		expect(result?.stars).toBe(0);
	});

	it("should complete a mission with stars", async () => {
		await upsertMission("test-m1", 1, 1, "available");
		await completeMission("test-m1", 2, 120000, 3);

		const result = await getMissionProgress("test-m1");
		expect(result?.status).toBe("completed");
		expect(result?.stars).toBe(2);
		expect(result?.best_time_ms).toBe(120000);
		expect(result?.units_lost).toBe(3);
		expect(result?.completed_at).toBeGreaterThan(0);
	});

	it("should keep best stars when replaying", async () => {
		await upsertMission("test-m1", 1, 1, "available");
		await completeMission("test-m1", 3, 120000, 2);
		await completeMission("test-m1", 1, 90000, 5);

		const result = await getMissionProgress("test-m1");
		// Should keep 3 stars (higher), but 90000 time (lower)
		expect(result?.stars).toBe(3);
		expect(result?.best_time_ms).toBe(90000);
	});

	it("should unlock a mission", async () => {
		await upsertMission("test-m2", 1, 2, "locked");
		await unlockMission("test-m2");

		const result = await getMissionProgress("test-m2");
		expect(result?.status).toBe("available");
	});

	it("should group missions by chapter", async () => {
		await seedCampaign();
		const { getChapterProgress } = await import("../../persistence/repos/campaignRepo");
		const ch1 = await getChapterProgress(1);
		expect(ch1).toHaveLength(4);
		expect(ch1.every((m) => m.chapter === 1)).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// saveRepo
// ---------------------------------------------------------------------------

describe("saveRepo", () => {
	it("should save and load a game", async () => {
		const snapshot = JSON.stringify({ entities: [1, 2, 3] });
		await saveGame(1, "ch1-m1", snapshot);

		const loaded = await loadGame(1);
		expect(loaded).toBeDefined();
		expect(loaded?.slot).toBe(1);
		expect(loaded?.mission_id).toBe("ch1-m1");
		expect(loaded?.snapshot_json).toBe(snapshot);
		expect(loaded?.saved_at).toBeGreaterThan(0);
	});

	it("should overwrite existing save in same slot", async () => {
		await saveGame(1, "ch1-m1", '{"v":1}');
		await saveGame(1, "ch1-m2", '{"v":2}');

		const loaded = await loadGame(1);
		expect(loaded?.mission_id).toBe("ch1-m2");
		expect(loaded?.snapshot_json).toBe('{"v":2}');
	});

	it("should support multiple slots independently", async () => {
		await saveGame(1, "ch1-m1", '{"slot":1}');
		await saveGame(2, "ch2-m5", '{"slot":2}');
		await saveGame(3, "ch3-m9", '{"slot":3}');

		const saves = await listSaves();
		expect(saves).toHaveLength(3);
	});

	it("should return undefined for empty slot", async () => {
		const loaded = await loadGame(1);
		expect(loaded).toBeUndefined();
	});

	it("should delete a save", async () => {
		await saveGame(1, "ch1-m1", "{}");
		expect(await hasSave(1)).toBe(true);

		await deleteSave(1);
		expect(await hasSave(1)).toBe(false);
	});

	it("should report hasSave correctly", async () => {
		expect(await hasSave(1)).toBe(false);
		await saveGame(1, "ch1-m1", "{}");
		expect(await hasSave(1)).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// settingsRepo
// ---------------------------------------------------------------------------

describe("settingsRepo", () => {
	it("should create default settings", async () => {
		await ensureSettings();
		const settings = await loadSettings();

		expect(settings).toBeDefined();
		expect(settings?.music_volume).toBe(0.7);
		expect(settings?.sfx_volume).toBe(1.0);
		expect(settings?.haptics_enabled).toBe(1);
		expect(settings?.camera_speed).toBe(1.0);
		expect(settings?.touch_mode).toBe("auto");
		expect(settings?.show_grid).toBe(0);
		expect(settings?.reduce_fx).toBe(0);
	});

	it("should not overwrite existing settings on re-ensure", async () => {
		await ensureSettings();
		await saveSettings({ music_volume: 0.5 });

		// Re-ensure should not overwrite
		await ensureSettings();
		const settings = await loadSettings();
		expect(settings?.music_volume).toBe(0.5);
	});

	it("should update individual settings", async () => {
		await ensureSettings();
		await saveSettings({ sfx_volume: 0.3, haptics_enabled: 0 });

		const settings = await loadSettings();
		expect(settings?.sfx_volume).toBe(0.3);
		expect(settings?.haptics_enabled).toBe(0);
		// Other settings should remain default
		expect(settings?.music_volume).toBe(0.7);
	});

	it("should reset settings to defaults", async () => {
		await ensureSettings();
		await saveSettings({ music_volume: 0.1, sfx_volume: 0.2 });
		await resetSettings();

		const settings = await loadSettings();
		expect(settings?.music_volume).toBe(0.7);
		expect(settings?.sfx_volume).toBe(1.0);
	});
});

// ---------------------------------------------------------------------------
// Zustand stores
// ---------------------------------------------------------------------------

describe("useRTSGameStore", () => {
	it("should manage resources", async () => {
		const { useRTSGameStore } = await import("../../stores/rtsGameStore");

		useRTSGameStore.getState().resetGame();
		useRTSGameStore.getState().addResource("fish", 100);
		expect(useRTSGameStore.getState().resources.fish).toBe(100);

		const success = useRTSGameStore.getState().spendResource("fish", 30);
		expect(success).toBe(true);
		expect(useRTSGameStore.getState().resources.fish).toBe(70);
	});

	it("should reject spending more than available", async () => {
		const { useRTSGameStore } = await import("../../stores/rtsGameStore");

		useRTSGameStore.getState().resetGame();
		useRTSGameStore.getState().addResource("timber", 50);
		const success = useRTSGameStore.getState().spendResource("timber", 100);
		expect(success).toBe(false);
		expect(useRTSGameStore.getState().resources.timber).toBe(50);
	});

	it("should track selection", async () => {
		const { useRTSGameStore } = await import("../../stores/rtsGameStore");

		useRTSGameStore.getState().setSelection([1, 2, 3]);
		expect(useRTSGameStore.getState().selectedEntityIds).toEqual([1, 2, 3]);

		useRTSGameStore.getState().clearSelection();
		expect(useRTSGameStore.getState().selectedEntityIds).toEqual([]);
	});

	it("should manage objectives", async () => {
		const { useRTSGameStore } = await import("../../stores/rtsGameStore");

		useRTSGameStore.getState().setObjectives([
			{ id: "obj1", description: "Build base", completed: false, bonus: false },
			{ id: "obj2", description: "Train units", completed: false, bonus: true },
		]);

		useRTSGameStore.getState().completeObjective("obj1");

		const objectives = useRTSGameStore.getState().objectives;
		expect(objectives[0].completed).toBe(true);
		expect(objectives[1].completed).toBe(false);
	});

	it("should reset game state", async () => {
		const { useRTSGameStore } = await import("../../stores/rtsGameStore");

		useRTSGameStore.getState().addResource("fish", 999);
		useRTSGameStore.getState().setPhase("playing");
		useRTSGameStore.getState().tickClock(5000);

		useRTSGameStore.getState().resetGame();

		const state = useRTSGameStore.getState();
		expect(state.resources.fish).toBe(0);
		expect(state.phase).toBe("loading");
		expect(state.elapsedMs).toBe(0);
	});
});

describe("useCampaignStore", () => {
	it("should hydrate from SQLite", async () => {
		const { useCampaignStore } = await import("../../stores/campaignStore");

		await useCampaignStore.getState().hydrate();

		const state = useCampaignStore.getState();
		expect(state.hydrated).toBe(true);
		expect(Object.keys(state.missions)).toHaveLength(16);
		expect(state.missions["ch1-m1"]?.status).toBe("available");
	});
});

describe("useSettingsStore", () => {
	it("should hydrate from SQLite with defaults", async () => {
		const { useSettingsStore } = await import("../../stores/settingsStore");

		await useSettingsStore.getState().hydrate();

		const state = useSettingsStore.getState();
		expect(state.hydrated).toBe(true);
		expect(state.musicVolume).toBe(0.7);
		expect(state.sfxVolume).toBe(1.0);
		expect(state.hapticsEnabled).toBe(true);
	});

	it("should update settings and persist", async () => {
		const { useSettingsStore } = await import("../../stores/settingsStore");

		await useSettingsStore.getState().hydrate();
		await useSettingsStore.getState().update({ musicVolume: 0.3 });

		expect(useSettingsStore.getState().musicVolume).toBe(0.3);

		// Verify it persisted to SQLite
		const row = await loadSettings();
		expect(row?.music_volume).toBe(0.3);
	});
});
