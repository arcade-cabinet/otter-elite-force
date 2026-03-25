/**
 * Tests for the persistence layer: database, migrations, repos, and stores.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeDatabase, InMemoryDatabase, setDatabase } from "../../persistence/database";
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
	getLatestSave,
	hasAnySave,
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
import {
	completeResearch,
	getCompletedResearch,
	getUnlockedBuildings,
	getUnlockedUnits,
	isResearchCompleted,
	loadAllUnlocks,
	unlockBuilding,
	unlockUnit,
} from "../../persistence/repos/unlockRepo";

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
			"SELECT mission_id, chapter, mission, status, stars, best_time_ms, units_lost, completed_at, difficulty FROM campaign_progress",
		);
		const saves = await db.query(
			"SELECT id, slot, mission_id, mission_name, snapshot_json, play_time_ms, saved_at FROM save_state",
		);
		const settings = await db.query(
			"SELECT id, master_volume, music_volume, sfx_volume, haptics_enabled, camera_speed, ui_scale, touch_mode, show_grid, reduce_fx FROM settings",
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
			"SELECT mission_id, chapter, mission, status, stars, best_time_ms, units_lost, completed_at, difficulty FROM campaign_progress",
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

	it("should save with mission_name and play_time_ms", async () => {
		await saveGame(1, "ch1-m1", "{}", "Beachhead", 60000);
		const loaded = await loadGame(1);
		expect(loaded?.mission_name).toBe("Beachhead");
		expect(loaded?.play_time_ms).toBe(60000);
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

	it("should return latest save by saved_at", async () => {
		await saveGame(1, "ch1-m1", "{}");
		// Small delay so saved_at timestamps differ
		await new Promise((r) => setTimeout(r, 5));
		await saveGame(2, "ch2-m5", "{}");

		const latest = await getLatestSave();
		expect(latest).toBeDefined();
		expect(latest?.slot).toBe(2);
		expect(latest?.mission_id).toBe("ch2-m5");
	});

	it("should return undefined for getLatestSave when no saves", async () => {
		const latest = await getLatestSave();
		expect(latest).toBeUndefined();
	});

	it("should report hasAnySave correctly", async () => {
		expect(await hasAnySave()).toBe(false);
		await saveGame(1, "ch1-m1", "{}");
		expect(await hasAnySave()).toBe(true);
	});

	it("should include play_time_ms and mission_name in listSaves", async () => {
		await saveGame(1, "ch1-m1", "{}", "Beachhead", 30000);
		await saveGame(2, "ch2-m5", "{}", "River Crossing", 60000);

		const saves = await listSaves();
		expect(saves).toHaveLength(2);
		expect(saves[0].mission_name).toBe("Beachhead");
		expect(saves[0].play_time_ms).toBe(30000);
		expect(saves[1].mission_name).toBe("River Crossing");
		expect(saves[1].play_time_ms).toBe(60000);
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
		expect(settings?.master_volume).toBe(1.0);
		expect(settings?.music_volume).toBe(0.7);
		expect(settings?.sfx_volume).toBe(1.0);
		expect(settings?.haptics_enabled).toBe(1);
		expect(settings?.camera_speed).toBe(1.0);
		expect(settings?.ui_scale).toBe(1.0);
		expect(settings?.touch_mode).toBe("auto");
		expect(settings?.show_grid).toBe(0);
		expect(settings?.reduce_fx).toBe(0);
	});

	it("should not overwrite existing settings on re-ensure", async () => {
		await ensureSettings();
		await saveSettings({ music_volume: 0.5 });

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

	it("should persist master_volume and ui_scale", async () => {
		await ensureSettings();
		await saveSettings({ master_volume: 0.5, ui_scale: 1.5 });

		const settings = await loadSettings();
		expect(settings?.master_volume).toBe(0.5);
		expect(settings?.ui_scale).toBe(1.5);
	});
});

// ---------------------------------------------------------------------------
// unlockRepo
// ---------------------------------------------------------------------------

describe("unlockRepo", () => {
	it("should complete and retrieve research", async () => {
		await completeResearch("hardshell_armor", "ch2-m5");
		await completeResearch("fish_oil_arrows", "ch2-m5");

		const completed = await getCompletedResearch();
		expect(completed).toContain("hardshell_armor");
		expect(completed).toContain("fish_oil_arrows");
		expect(completed).toHaveLength(2);
	});

	it("should check if research is completed", async () => {
		expect(await isResearchCompleted("hardshell_armor")).toBe(false);
		await completeResearch("hardshell_armor", "ch2-m5");
		expect(await isResearchCompleted("hardshell_armor")).toBe(true);
	});

	it("should handle duplicate research completion (idempotent)", async () => {
		await completeResearch("hardshell_armor", "ch2-m5");
		await completeResearch("hardshell_armor", "ch2-m6");

		const completed = await getCompletedResearch();
		expect(completed).toHaveLength(1);
	});

	it("should unlock and retrieve units", async () => {
		await unlockUnit("gator", "ch1-m2");
		await unlockUnit("mortar_otter", "ch2-m5");

		const units = await getUnlockedUnits();
		expect(units).toContain("gator");
		expect(units).toContain("mortar_otter");
	});

	it("should unlock and retrieve buildings", async () => {
		await unlockBuilding("barracks", "ch1-m1");
		await unlockBuilding("armory", "ch2-m5");

		const buildings = await getUnlockedBuildings();
		expect(buildings).toContain("barracks");
		expect(buildings).toContain("armory");
	});

	it("should load all unlocks in one call", async () => {
		await completeResearch("hardshell_armor", "ch2-m5");
		await unlockUnit("gator", "ch1-m2");
		await unlockBuilding("armory", "ch2-m5");

		const all = await loadAllUnlocks();
		expect(all.research).toContain("hardshell_armor");
		expect(all.units).toContain("gator");
		expect(all.buildings).toContain("armory");
	});
});
