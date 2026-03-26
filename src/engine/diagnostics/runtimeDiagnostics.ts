import type { World } from "koota";
import { CurrentMission, GameClock, GamePhase, Objectives } from "@/ecs/traits/state";
import { initDatabase } from "@/persistence/database";
import type { PersistenceStore } from "../persistence/types";
import { SqlitePersistenceStore } from "../persistence/sqlitePersistenceStore";
import type { GameWorld } from "../world/gameWorld";
import type { DiagnosticEvent, DiagnosticSnapshot } from "./types";

export function recordDiagnosticEvent(
	snapshot: DiagnosticSnapshot,
	type: string,
	payload?: Record<string, unknown>,
): DiagnosticSnapshot {
	const event: DiagnosticEvent = {
		tick: snapshot.tick,
		type,
		payload,
	};
	snapshot.events.push(event);
	return snapshot;
}

export function syncKootaDiagnostics(
	world: World,
	snapshot: DiagnosticSnapshot,
): DiagnosticSnapshot {
	const missionId = world.get(CurrentMission)?.missionId ?? snapshot.missionId;
	const clock = world.get(GameClock);
	const objectives = world.get(Objectives)?.list ?? [];
	const phase = world.get(GamePhase)?.phase ?? "loading";

	snapshot.missionId = missionId;
	snapshot.tick = clock?.tick ?? snapshot.tick;
	snapshot.objectives = objectives.map((objective) => ({
		id: objective.id,
		status: objective.status,
	}));
	if (phase === "defeat" && !snapshot.failures.includes("mission-defeat")) {
		snapshot.failures.push("mission-defeat");
	}

	return snapshot;
}

export function syncGameWorldDiagnostics(world: GameWorld): DiagnosticSnapshot {
	world.diagnostics.tick = world.time.tick;
	world.diagnostics.missionId = world.session.currentMissionId;
	world.diagnostics.objectives = world.session.objectives.map((objective) => ({
		id: objective.id,
		status: objective.status,
	}));
	world.diagnostics.events = [...world.runtime.diagnosticEvents];
	if (world.session.phase === "defeat" && !world.diagnostics.failures.includes("mission-defeat")) {
		world.diagnostics.failures.push("mission-defeat");
	}
	return world.diagnostics;
}

export async function persistDiagnosticSnapshot(
	snapshot: DiagnosticSnapshot,
	store?: PersistenceStore,
): Promise<DiagnosticSnapshot> {
	const resolvedStore = await resolvePersistenceStore(store);
	await resolvedStore.initialize();
	await resolvedStore.saveDiagnostics(snapshot);
	return snapshot;
}

async function resolvePersistenceStore(store?: PersistenceStore): Promise<PersistenceStore> {
	if (store) return store;
	await initDatabase();
	return new SqlitePersistenceStore();
}
