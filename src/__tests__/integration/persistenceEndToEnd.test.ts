/**
 * Integration Tests — Persistence End-to-End.
 *
 * Verifies all persistence integration points:
 *   1. Mid-mission save: serialize world -> store.saveMission() -> load + compare
 *   2. Campaign progression: saveCampaign after victory -> loadCampaign on next visit
 *   3. Settings persistence: saveSettings -> loadSettings roundtrip
 *   4. Skirmish setup persistence: saveSkirmishSetup -> loadSkirmishSetup roundtrip
 *   5. Database initialization: initialize() auto-creates db, no "not initialized" errors
 *   6. Save command pipeline: commandProcessor emits save-requested event
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveMissionVictory } from "@/app/missionResult";
import {
	deserializeGameWorld,
	type GameWorldSnapshot,
	serializeGameWorld,
} from "@/engine/persistence/gameWorldSaveLoad";
import { SqlitePersistenceStore } from "@/engine/persistence/sqlitePersistenceStore";
import type {
	CampaignProgressRecord,
	SkirmishSetupRecord,
	UserSettingsRecord,
} from "@/engine/persistence/types";
import { createSeedBundle } from "@/engine/random/seed";
import { processCommands } from "@/engine/runtime/commandProcessor";
import { bootstrapMission } from "@/engine/session/missionBootstrap";
import { runAllSystems } from "@/engine/systems";
import { resetGatherTimers } from "@/engine/systems/economySystem";
import { createFogGrid, type FogRuntime } from "@/engine/systems/fogSystem";
import { Faction, Flags, Health, Position } from "@/engine/world/components";
import { createGameWorld, type GameWorld } from "@/engine/world/gameWorld";
import { closeDatabase, InMemoryDatabase, setDatabase } from "@/persistence/database";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function bootMission(missionId = "mission_1"): GameWorld {
	resetGatherTimers();
	const seed = createSeedBundle({ phrase: "persist-test-heron", source: "manual" });
	const world = createGameWorld(seed);
	bootstrapMission(world, missionId);

	if (world.navigation.width > 0 && world.navigation.height > 0) {
		const fogRuntime = world.runtime as FogRuntime;
		if (!fogRuntime.fogGrid) {
			fogRuntime.fogGrid = createFogGrid(world.navigation.width, world.navigation.height);
			(fogRuntime as { fogGridWidth?: number }).fogGridWidth = world.navigation.width;
			(fogRuntime as { fogGridHeight?: number }).fogGridHeight = world.navigation.height;
		}
	}

	return world;
}

function runTicks(world: GameWorld, ticks: number, deltaMs = 16.67): void {
	for (let i = 0; i < ticks; i++) {
		world.time.deltaMs = deltaMs;
		world.time.elapsedMs += deltaMs;
		world.time.tick++;
		runAllSystems(world);
		if (world.session.phase === "victory" || world.session.phase === "defeat") break;
	}
}

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe("Persistence End-to-End", () => {
	let store: SqlitePersistenceStore;

	beforeEach(async () => {
		setDatabase(new InMemoryDatabase());
		store = new SqlitePersistenceStore();
		await store.initialize();
	});

	afterEach(async () => {
		await closeDatabase();
	});

	// ---- 1. Mid-mission save roundtrip via store ----
	describe("Mid-mission save via SqlitePersistenceStore", () => {
		it("saves serialized world to database and loads it back", async () => {
			const world = bootMission();
			runTicks(world, 5000);

			const snapshot = serializeGameWorld(world);
			const snapshotJson = JSON.stringify(snapshot);

			await store.saveMission({
				slot: 0,
				missionId: world.session.currentMissionId ?? "unknown",
				seed: {
					phrase: world.rng.phrase,
					source: world.rng.source,
					numericSeed: world.rng.numericSeed,
					designSeed: world.rng.designSeed,
					gameplaySeeds: { ...world.rng.gameplaySeeds },
				},
				snapshot: snapshotJson,
				playTimeMs: world.time.elapsedMs,
				savedAt: Date.now(),
			});

			const loaded = await store.loadMission(0);
			expect(loaded).not.toBeNull();
			expect(loaded?.missionId).toBe("mission_1");
			expect(loaded?.seed.phrase).toBe("persist-test-heron");

			const restoredSnapshot = JSON.parse(loaded!.snapshot) as GameWorldSnapshot;
			expect(restoredSnapshot.version).toBe(1);
			expect(restoredSnapshot.entities.length).toBe(snapshot.entities.length);
		});

		it("loaded snapshot deserializes to a matching world", async () => {
			const world = bootMission();
			runTicks(world, 5000);

			const originalAlive = world.runtime.alive.size;
			const originalFish = world.session.resources.fish;
			const snapshot = serializeGameWorld(world);

			await store.saveMission({
				slot: 0,
				missionId: world.session.currentMissionId ?? "unknown",
				seed: {
					phrase: world.rng.phrase,
					source: world.rng.source,
					numericSeed: world.rng.numericSeed,
					designSeed: world.rng.designSeed,
					gameplaySeeds: { ...world.rng.gameplaySeeds },
				},
				snapshot: JSON.stringify(snapshot),
				playTimeMs: world.time.elapsedMs,
				savedAt: Date.now(),
			});

			const loaded = await store.loadMission(0);
			const restoredSnapshot = JSON.parse(loaded!.snapshot) as GameWorldSnapshot;
			const restored = deserializeGameWorld(restoredSnapshot);

			expect(restored.runtime.alive.size).toBe(originalAlive);
			expect(restored.session.resources.fish).toBe(originalFish);
			expect(restored.session.currentMissionId).toBe("mission_1");
			expect(restored.time.tick).toBe(world.time.tick);
		});

		it("restored world runs additional ticks without crash", async () => {
			const world = bootMission();
			runTicks(world, 5000);

			const snapshot = serializeGameWorld(world);
			await store.saveMission({
				slot: 0,
				missionId: world.session.currentMissionId ?? "unknown",
				seed: {
					phrase: world.rng.phrase,
					source: world.rng.source,
					numericSeed: world.rng.numericSeed,
					designSeed: world.rng.designSeed,
					gameplaySeeds: { ...world.rng.gameplaySeeds },
				},
				snapshot: JSON.stringify(snapshot),
				playTimeMs: world.time.elapsedMs,
				savedAt: Date.now(),
			});

			const loaded = await store.loadMission(0);
			const restoredSnapshot = JSON.parse(loaded!.snapshot) as GameWorldSnapshot;
			const restored = deserializeGameWorld(restoredSnapshot);

			// Initialize fog
			if (restored.navigation.width > 0 && restored.navigation.height > 0) {
				const fogRuntime = restored.runtime as FogRuntime;
				if (!fogRuntime.fogGrid) {
					fogRuntime.fogGrid = createFogGrid(restored.navigation.width, restored.navigation.height);
					(fogRuntime as { fogGridWidth?: number }).fogGridWidth = restored.navigation.width;
					(fogRuntime as { fogGridHeight?: number }).fogGridHeight = restored.navigation.height;
				}
			}

			resetGatherTimers();
			const ticksBefore = restored.time.tick;
			runTicks(restored, 1000);
			expect(restored.time.tick).toBeGreaterThan(ticksBefore);
		});
	});

	// ---- 2. Campaign progression persistence ----
	describe("Campaign progression persistence", () => {
		it("saves campaign progress after mission victory", async () => {
			const progress: CampaignProgressRecord = {
				currentMissionId: "mission_1",
				difficulty: "tactical",
				missions: {},
			};

			const resolution = resolveMissionVictory(
				{
					missions: {},
					currentMission: "mission_1",
					difficulty: "tactical",
				},
				"mission_1",
				3,
			);

			const updatedProgress: CampaignProgressRecord = {
				currentMissionId: resolution.nextMissionId,
				difficulty: progress.difficulty,
				missions: Object.fromEntries(
					Object.entries(resolution.progress.missions).map(([k, v]) => [
						k,
						{
							status: v.status as "locked" | "available" | "completed",
							stars: v.stars,
							bestTimeMs: v.bestTime,
						},
					]),
				),
			};

			await store.saveCampaign(updatedProgress);
			const loaded = await store.loadCampaign();

			expect(loaded).not.toBeNull();
			expect(loaded!.missions.mission_1.status).toBe("completed");
			expect(loaded!.missions.mission_1.stars).toBe(3);
			expect(loaded!.currentMissionId).toBe(resolution.nextMissionId);
		});

		it("loads null when no campaign progress exists", async () => {
			const loaded = await store.loadCampaign();
			expect(loaded).toBeNull();
		});

		it("preserves campaign progress across multiple saves", async () => {
			// First victory
			await store.saveCampaign({
				currentMissionId: "mission_2",
				difficulty: "tactical",
				missions: {
					mission_1: { status: "completed", stars: 2, bestTimeMs: 60000 },
				},
			});

			// Second victory
			await store.saveCampaign({
				currentMissionId: "mission_3",
				difficulty: "tactical",
				missions: {
					mission_1: { status: "completed", stars: 2, bestTimeMs: 60000 },
					mission_2: { status: "completed", stars: 3, bestTimeMs: 45000 },
				},
			});

			const loaded = await store.loadCampaign();
			expect(loaded!.currentMissionId).toBe("mission_3");
			expect(loaded!.missions.mission_1.status).toBe("completed");
			expect(loaded!.missions.mission_2.stars).toBe(3);
		});
	});

	// ---- 3. Settings persistence ----
	describe("Settings persistence", () => {
		it("saves and loads user settings", async () => {
			const settings: UserSettingsRecord = {
				masterVolume: 0.8,
				musicVolume: 0.5,
				sfxVolume: 0.9,
				showSubtitles: false,
				reduceMotion: true,
			};

			await store.saveSettings(settings);
			const loaded = await store.loadSettings();

			expect(loaded).not.toBeNull();
			expect(loaded!.masterVolume).toBe(0.8);
			expect(loaded!.musicVolume).toBe(0.5);
			expect(loaded!.sfxVolume).toBe(0.9);
			expect(loaded!.showSubtitles).toBe(false);
			expect(loaded!.reduceMotion).toBe(true);
		});

		it("returns null when no settings have been saved", async () => {
			const loaded = await store.loadSettings();
			expect(loaded).toBeNull();
		});

		it("overwrites previous settings on re-save", async () => {
			await store.saveSettings({
				masterVolume: 1.0,
				musicVolume: 0.7,
				sfxVolume: 1.0,
				showSubtitles: true,
				reduceMotion: false,
			});

			await store.saveSettings({
				masterVolume: 0.5,
				musicVolume: 0.3,
				sfxVolume: 0.6,
				showSubtitles: false,
				reduceMotion: true,
			});

			const loaded = await store.loadSettings();
			expect(loaded!.masterVolume).toBe(0.5);
			expect(loaded!.showSubtitles).toBe(false);
		});
	});

	// ---- 4. Skirmish setup persistence ----
	describe("Skirmish setup persistence", () => {
		it("saves and loads skirmish setup for quick rematch", async () => {
			const seed = createSeedBundle({ phrase: "river-mud-otter", source: "skirmish" });
			const setup: SkirmishSetupRecord = {
				mapPreset: "meso",
				seed,
				startingResources: { fish: 300, timber: 200, salvage: 100 },
			};

			await store.saveSkirmishSetup(setup);
			const loaded = await store.loadSkirmishSetup();

			expect(loaded).not.toBeNull();
			expect(loaded!.mapPreset).toBe("meso");
			expect(loaded!.seed.phrase).toBe("river-mud-otter");
			expect(loaded!.startingResources.fish).toBe(300);
		});

		it("returns null when no skirmish setup exists", async () => {
			const loaded = await store.loadSkirmishSetup();
			expect(loaded).toBeNull();
		});

		it("overwrites previous skirmish setup on re-save", async () => {
			const seed1 = createSeedBundle({ phrase: "first-seed-phrase", source: "skirmish" });
			await store.saveSkirmishSetup({
				mapPreset: "micro",
				seed: seed1,
				startingResources: { fish: 100, timber: 100, salvage: 50 },
			});

			const seed2 = createSeedBundle({ phrase: "second-seed-phrase", source: "skirmish" });
			await store.saveSkirmishSetup({
				mapPreset: "macro",
				seed: seed2,
				startingResources: { fish: 500, timber: 400, salvage: 200 },
			});

			const loaded = await store.loadSkirmishSetup();
			expect(loaded!.mapPreset).toBe("macro");
			expect(loaded!.seed.phrase).toBe("second-seed-phrase");
			expect(loaded!.startingResources.fish).toBe(500);
		});
	});

	// ---- 5. Database initialization ----
	describe("Database initialization", () => {
		it("SqlitePersistenceStore.initialize() works without prior initDatabase call", async () => {
			// Close the existing database to simulate a fresh state
			await closeDatabase();

			// Create store without explicit db — initialize() should call initDatabase()
			const freshStore = new SqlitePersistenceStore();
			await freshStore.initialize();

			// Should be able to save and load
			await freshStore.saveSettings({
				masterVolume: 0.7,
				musicVolume: 0.5,
				sfxVolume: 0.8,
				showSubtitles: true,
				reduceMotion: false,
			});

			const loaded = await freshStore.loadSettings();
			expect(loaded).not.toBeNull();
			expect(loaded!.masterVolume).toBe(0.7);
		});

		it("calling initialize() multiple times is safe", async () => {
			await store.initialize();
			await store.initialize();
			await store.initialize();

			await store.saveSettings({
				masterVolume: 0.9,
				musicVolume: 0.6,
				sfxVolume: 1.0,
				showSubtitles: true,
				reduceMotion: false,
			});

			const loaded = await store.loadSettings();
			expect(loaded!.masterVolume).toBe(0.9);
		});

		it("throws if methods called without initialization", async () => {
			await closeDatabase();
			const uninitStore = new SqlitePersistenceStore();
			await expect(
				uninitStore.saveCampaign({
					currentMissionId: "mission_1",
					difficulty: "tactical",
					missions: {},
				}),
			).rejects.toThrow("not initialized");
		});
	});

	// ---- 6. Save command pipeline ----
	describe("Save command pipeline", () => {
		it("processCommands dispatches save -> world emits save-requested event", () => {
			const world = bootMission();
			world.time.tick = 42;

			processCommands(world, [{ type: "save" }]);

			expect(world.events.length).toBeGreaterThanOrEqual(1);
			const saveEvent = world.events.find((e) => e.type === "save-requested");
			expect(saveEvent).toBeDefined();
			expect(saveEvent!.payload?.tick).toBe(42);
		});

		it("save command followed by serialization produces a valid snapshot", () => {
			const world = bootMission();
			runTicks(world, 100);

			processCommands(world, [{ type: "save" }]);

			// The event signals to the runtime to serialize
			const saveEvent = world.events.find((e) => e.type === "save-requested");
			expect(saveEvent).toBeDefined();

			// Simulate what tacticalRuntime does
			const snapshot = serializeGameWorld(world);
			expect(snapshot.version).toBe(1);
			expect(snapshot.entities.length).toBeGreaterThan(0);
			expect(snapshot.session.currentMissionId).toBe("mission_1");

			const json = JSON.stringify(snapshot);
			const parsed = JSON.parse(json) as GameWorldSnapshot;
			expect(parsed.entities.length).toBe(snapshot.entities.length);
		});

		it("full pipeline: save command -> serialize -> store -> load -> deserialize", async () => {
			const world = bootMission();
			runTicks(world, 5000);

			// 1. UI triggers save command
			processCommands(world, [{ type: "save" }]);

			// 2. Runtime serializes
			const snapshot = serializeGameWorld(world);
			const snapshotJson = JSON.stringify(snapshot);

			// 3. Store persists
			await store.saveMission({
				slot: 0,
				missionId: world.session.currentMissionId ?? "unknown",
				seed: {
					phrase: world.rng.phrase,
					source: world.rng.source,
					numericSeed: world.rng.numericSeed,
					designSeed: world.rng.designSeed,
					gameplaySeeds: { ...world.rng.gameplaySeeds },
				},
				snapshot: snapshotJson,
				playTimeMs: world.time.elapsedMs,
				savedAt: Date.now(),
			});

			// 4. Load from store
			const loaded = await store.loadMission(0);
			expect(loaded).not.toBeNull();

			// 5. Deserialize
			const restoredSnapshot = JSON.parse(loaded!.snapshot) as GameWorldSnapshot;
			const restored = deserializeGameWorld(restoredSnapshot);

			// 6. Verify state matches
			expect(restored.runtime.alive.size).toBe(world.runtime.alive.size);
			expect(restored.session.resources.fish).toBe(world.session.resources.fish);
			expect(restored.session.resources.timber).toBe(world.session.resources.timber);
			expect(restored.session.resources.salvage).toBe(world.session.resources.salvage);
			expect(restored.time.tick).toBe(world.time.tick);
		});
	});
});
