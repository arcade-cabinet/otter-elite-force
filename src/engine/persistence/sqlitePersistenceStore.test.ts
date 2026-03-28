import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeDatabase, InMemoryDatabase, setDatabase } from "@/persistence/database";
import { createEmptyDiagnosticsSnapshot } from "../diagnostics/types";
import { createSeedBundle } from "../random/seed";
import { SqlitePersistenceStore } from "./sqlitePersistenceStore";

describe("engine/persistence/sqlitePersistenceStore", () => {
	let store: SqlitePersistenceStore;

	beforeEach(async () => {
		setDatabase(new InMemoryDatabase());
		store = new SqlitePersistenceStore();
		await store.initialize();
	});

	afterEach(async () => {
		await closeDatabase();
	});

	it("persists campaign and settings state", async () => {
		await store.saveCampaign({
			currentMissionId: "mission_3",
			difficulty: "tactical",
			missions: {
				mission_1: { status: "completed", stars: 3, bestTimeMs: 120000 },
			},
		});
		await store.saveSettings({
			masterVolume: 1,
			musicVolume: 0.8,
			sfxVolume: 0.9,
			showSubtitles: true,
			reduceMotion: false,
		});

		expect((await store.loadCampaign())?.currentMissionId).toBe("mission_3");
		expect((await store.loadSettings())?.showSubtitles).toBe(true);
	});

	it("persists skirmish setup and mission saves with seed bundles", async () => {
		const seed = createSeedBundle({ phrase: "silent-ember-heron", source: "manual" });
		await store.saveSkirmishSetup({
			mapPreset: "macro",
			seed,
			startingResources: { fish: 300, timber: 200, salvage: 100 },
		});
		await store.saveMission({
			slot: 1,
			missionId: "mission_4",
			seed,
			snapshot: '{"phase":"playing"}',
			playTimeMs: 9876,
			savedAt: 123456789,
		});

		expect((await store.loadSkirmishSetup())?.seed.phrase).toBe("silent-ember-heron");
		expect((await store.loadMission(1))?.missionId).toBe("mission_4");
	});

	it("stores diagnostics snapshots for later GAP analysis", async () => {
		const snapshot = createEmptyDiagnosticsSnapshot();
		snapshot.runId = "run-1";
		snapshot.seedPhrase = "silent-ember-heron";
		snapshot.events.push({ tick: 12, type: "objectiveCompleted" });

		await store.saveDiagnostics(snapshot);

		const diagnostics = await store.listDiagnostics();
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]?.runId).toBe("run-1");
		expect(diagnostics[0]?.events[0]?.type).toBe("objectiveCompleted");
	});
});
