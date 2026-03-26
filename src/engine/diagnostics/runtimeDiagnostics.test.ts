import { createWorld } from "koota";
import { beforeEach, describe, expect, it } from "vitest";
import { initSingletons } from "@/ecs/singletons";
import { CurrentMission, GameClock, GamePhase, Objectives } from "@/ecs/traits/state";
import { InMemoryDatabase } from "@/persistence/database";
import { SqlitePersistenceStore } from "../persistence/sqlitePersistenceStore";
import { createGameWorld } from "../world/gameWorld";
import { createEmptyDiagnosticsSnapshot } from "./types";
import {
	persistDiagnosticSnapshot,
	recordDiagnosticEvent,
	syncGameWorldDiagnostics,
	syncKootaDiagnostics,
} from "./runtimeDiagnostics";

describe("engine/diagnostics/runtimeDiagnostics", () => {
	let kootaWorld: ReturnType<typeof createWorld>;

	beforeEach(() => {
		kootaWorld = createWorld();
		initSingletons(kootaWorld);
	});

	it("synchronizes koota world mission, tick, and objective state into diagnostics", () => {
		const snapshot = createEmptyDiagnosticsSnapshot();
		kootaWorld.set(CurrentMission, { missionId: "mission_3" });
		kootaWorld.set(GameClock, { elapsedMs: 1000, lastDeltaMs: 16, tick: 42, paused: false });
		kootaWorld.set(GamePhase, { phase: "playing" });
		kootaWorld.set(Objectives, {
			list: [{ id: "hold-ridge", description: "Hold the ridge", status: "active", bonus: false }],
		});

		recordDiagnosticEvent(snapshot, "mission-started", { missionId: "mission_3" });
		const synced = syncKootaDiagnostics(kootaWorld, snapshot);

		expect(synced.missionId).toBe("mission_3");
		expect(synced.tick).toBe(42);
		expect(synced.objectives[0]?.id).toBe("hold-ridge");
		expect(synced.events[0]?.type).toBe("mission-started");
	});

	it("synchronizes bitECS game world runtime state into diagnostics", () => {
		const world = createGameWorld();
		world.time.tick = 18;
		world.session.currentMissionId = "mission_7";
		world.session.phase = "defeat";
		world.session.objectives = [{ id: "escape", description: "Escape the marsh", status: "failed" }];
		world.runtime.diagnosticEvents.push({ tick: 18, type: "boundary-violation" });

		const synced = syncGameWorldDiagnostics(world);

		expect(synced.tick).toBe(18);
		expect(synced.missionId).toBe("mission_7");
		expect(synced.objectives[0]?.status).toBe("failed");
		expect(synced.failures).toContain("mission-defeat");
		expect(synced.events[0]?.type).toBe("boundary-violation");
	});

	it("persists diagnostics snapshots through the persistence store contract", async () => {
		const store = new SqlitePersistenceStore(new InMemoryDatabase());
		const snapshot = createEmptyDiagnosticsSnapshot();
		snapshot.runId = "diag-run";
		snapshot.seedPhrase = "silent-ember-heron";

		await persistDiagnosticSnapshot(snapshot, store);

		const rows = await store.listDiagnostics();
		expect(rows[0]?.runId).toBe("diag-run");
	});
});
