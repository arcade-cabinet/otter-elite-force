import { initDatabase } from "@/persistence/database";
import type { PersistenceStore } from "../persistence/types";
import { SqlitePersistenceStore } from "../persistence/sqlitePersistenceStore";
import { Faction, Flags, Position, Speed } from "../world/components";
import type { GameWorld } from "../world/gameWorld";
import type { FogRuntime } from "../systems/fogSystem";
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

/**
 * Sync full GameWorld state into diagnostics snapshot.
 * Populates: run metadata, objectives, events, performance counters,
 * pathfinding anomalies, fog stats, minimap stats, encounter/wave data.
 */
export function syncGameWorldDiagnostics(world: GameWorld): DiagnosticSnapshot {
	const diag = world.diagnostics;

	// Core metadata
	diag.tick = world.time.tick;
	diag.missionId = world.session.currentMissionId;
	diag.objectives = world.session.objectives.map((objective) => ({
		id: objective.id,
		status: objective.status,
	}));
	diag.events = [...world.runtime.diagnosticEvents];

	// Failure tracking
	if (world.session.phase === "defeat" && !diag.failures.includes("mission-defeat")) {
		diag.failures.push("mission-defeat");
	}

	// --- Performance counters ---
	// Frame time approximated from deltaMs; FPS inverse of frame time
	if (world.time.deltaMs > 0) {
		diag.performance.frameTimeMs = world.time.deltaMs;
		diag.performance.fps = Math.round(1000 / world.time.deltaMs);
	}

	// --- Pathfinding anomalies ---
	// Detect stuck entities: units with speed > 0 but at exact same position
	// (tracked via runtime data — heuristic: entities with move orders but zero velocity)
	const stuckEntities: number[] = [];
	const boundaryViolations: number[] = [];
	const navWidth = world.navigation.width * 32;
	const navHeight = world.navigation.height * 32;

	for (const eid of world.runtime.alive) {
		// Skip buildings and resources
		if (Flags.isBuilding[eid] === 1 || Flags.isResource[eid] === 1) continue;

		const x = Position.x[eid];
		const y = Position.y[eid];

		// Boundary violations: entities outside the terrain
		if (navWidth > 0 && navHeight > 0) {
			if (x < 0 || y < 0 || x > navWidth || y > navHeight) {
				boundaryViolations.push(eid);
			}
		}

		// Stuck detection: entities with move orders but speed component at 0
		const orders = world.runtime.orderQueues.get(eid);
		if (orders && orders.length > 0 && orders[0].type === "move") {
			if (Speed.value[eid] <= 0) {
				stuckEntities.push(eid);
			}
		}
	}

	diag.pathfinding.stuckEntities = stuckEntities;
	diag.pathfinding.boundaryViolations = boundaryViolations;

	// --- Fog stats ---
	const fogRuntime = world.runtime as FogRuntime;
	if (fogRuntime.fogGrid) {
		const fogGrid = fogRuntime.fogGrid;
		let visibleCount = 0;
		for (let i = 0; i < fogGrid.length; i++) {
			if (fogGrid[i] === 2) visibleCount++; // FOG_VISIBLE = 2
		}
		diag.fogVisibleTiles = visibleCount;
	}

	// --- Minimap visible entities ---
	// Count player-visible entities (faction 1 = player, all player entities visible)
	let minimapVisible = 0;
	for (const eid of world.runtime.alive) {
		if (Faction.id[eid] === 1) {
			minimapVisible++; // All player entities always visible on minimap
		}
		// For enemy entities, check if they're in visible fog tiles
		if (Faction.id[eid] === 2 && fogRuntime.fogGrid) {
			const tileX = Math.floor(Position.x[eid] / 32);
			const tileY = Math.floor(Position.y[eid] / 32);
			const fogIdx = tileY * world.navigation.width + tileX;
			if (fogIdx >= 0 && fogIdx < fogRuntime.fogGrid.length && fogRuntime.fogGrid[fogIdx] === 2) {
				minimapVisible++;
			}
		}
	}
	diag.minimapVisibleEntities = minimapVisible;

	// --- Wave and encounter data (from events) ---
	// These are logged by the waveSpawnerSystem and encounterSystem
	// as diagnostic events when they fire. No additional collection needed.

	return diag;
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
