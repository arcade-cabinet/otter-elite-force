import { describe, expect, it } from "vitest";
import { InMemoryDatabase } from "@/persistence/database";
import { SqlitePersistenceStore } from "../persistence/sqlitePersistenceStore";
import { createGameWorld } from "../world/gameWorld";
import {
	persistDiagnosticSnapshot,
	recordDiagnosticEvent,
	syncGameWorldDiagnostics,
} from "./runtimeDiagnostics";
import { createEmptyDiagnosticsSnapshot } from "./types";

describe("engine/diagnostics/runtimeDiagnostics", () => {
	it("records diagnostic events into a snapshot", () => {
		const snapshot = createEmptyDiagnosticsSnapshot();
		recordDiagnosticEvent(snapshot, "mission-started", { missionId: "mission_3" });

		expect(snapshot.events[0]?.type).toBe("mission-started");
		expect(snapshot.events[0]?.payload?.missionId).toBe("mission_3");
	});

	it("synchronizes bitECS game world runtime state into diagnostics", () => {
		const world = createGameWorld();
		world.time.tick = 18;
		world.session.currentMissionId = "mission_7";
		world.session.phase = "defeat";
		world.session.objectives = [
			{ id: "escape", description: "Escape the marsh", status: "failed" },
		];
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
