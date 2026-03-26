/**
 * Skirmish Sandbox — Boots a minimal battlefield with deterministic seed
 * for testing systems in isolation.
 *
 * The sandbox creates a GameWorld purely from a SkirmishSessionConfig,
 * runs the system pipeline for a configurable number of ticks, and
 * emits a diagnostics snapshot for validation.
 *
 * Seed replay: running the same seed + config produces identical entity state.
 */

import type { SkirmishSessionConfig } from "@/features/skirmish/types";
import { syncGameWorldDiagnostics } from "../diagnostics/runtimeDiagnostics";
import type { DiagnosticSnapshot } from "../diagnostics/types";
import { createFogGrid, type FogRuntime } from "../systems";
import { createSystemPipeline, type SystemPipeline } from "./systemPipeline";
import {
	createSkirmishRuntimeSession,
	seedGameWorldFromSkirmishSession,
} from "./tacticalSession";
import { createGameWorld, type GameWorld } from "../world/gameWorld";
import { Health, Position } from "../world/components";

export interface EntitySnapshot {
	eid: number;
	x: number;
	y: number;
	health: number;
	type: string | undefined;
}

export interface SkirmishSandboxResult {
	/** The final GameWorld state after running all ticks. */
	world: GameWorld;
	/** Diagnostics snapshot captured at the end of the run. */
	diagnostics: DiagnosticSnapshot;
	/** Total ticks executed. */
	ticksRun: number;
	/** Entity count at the end of the run. */
	aliveEntities: number;
	/** Final phase of the session. */
	phase: string;
	/** Snapshot of all alive entity positions and health at final tick. */
	entitySnapshot: EntitySnapshot[];
}

export interface SkirmishSandboxOptions {
	/** Skirmish configuration including seed, map, difficulty. */
	config: SkirmishSessionConfig;
	/** Number of simulation ticks to run. Default: 300. */
	ticks?: number;
	/** Simulated delta time per tick in ms. Default: 16 (60fps). */
	deltaMs?: number;
	/** Optional callback invoked each tick for custom assertions. */
	onTick?: (world: GameWorld, tick: number) => void;
}

/**
 * Capture a snapshot of all alive entity positions and health.
 * Used for deterministic replay comparison.
 */
function captureEntitySnapshot(world: GameWorld): EntitySnapshot[] {
	const snapshot: EntitySnapshot[] = [];
	for (const eid of world.runtime.alive) {
		snapshot.push({
			eid,
			x: Position.x[eid],
			y: Position.y[eid],
			health: Health.current[eid],
			type: world.runtime.entityTypeIndex.get(eid),
		});
	}
	// Sort by eid for stable comparison
	snapshot.sort((a, b) => a.eid - b.eid);
	return snapshot;
}

/** Read session phase without TS control-flow narrowing. */
function readPhase(world: GameWorld): string {
	return world.session.phase;
}

/**
 * Boot a skirmish session on a fresh GameWorld, run the system pipeline
 * for the specified number of ticks, and return the result with diagnostics.
 *
 * This is the primary harness for deterministic systems testing.
 */
export function runSkirmishSandbox(options: SkirmishSandboxOptions): SkirmishSandboxResult {
	const { config, ticks = 300, deltaMs = 16 } = options;

	// Create the runtime session and seed the world
	const session = createSkirmishRuntimeSession(config);
	const world = createGameWorld(config.seed);

	seedGameWorldFromSkirmishSession(world, session);

	// Initialize fog grid
	const fogRuntime = world.runtime as FogRuntime;
	fogRuntime.fogGrid = createFogGrid(world.navigation.width, world.navigation.height);

	// Create the system pipeline
	const pipeline: SystemPipeline = createSystemPipeline(world);

	// Ensure phase is playing so systems actually execute
	world.session.phase = "playing";

	// Copy diagnostics from session
	world.diagnostics.runId = session.diagnostics.runId;
	world.diagnostics.mode = "skirmish";
	world.diagnostics.skirmishPresetId = config.preset;
	world.diagnostics.seedPhrase = config.seed.phrase;
	world.diagnostics.designSeed = config.seed.designSeed;
	world.diagnostics.gameplaySeeds = { ...config.seed.gameplaySeeds };

	let finalTick = 0;

	// Run the simulation
	for (let tick = 0; tick < ticks; tick++) {
		world.time.tick = tick;
		world.time.deltaMs = deltaMs;
		world.time.elapsedMs += deltaMs;
		finalTick = tick;

		pipeline.step();

		if (options.onTick) {
			options.onTick(world, tick);
		}

		// Early exit if session reached a terminal phase
		// (phase may be mutated by systems or onTick callback)
		const currentPhase = readPhase(world);
		if (currentPhase === "victory" || currentPhase === "defeat") {
			break;
		}
	}

	// Capture entity snapshot before diagnostics sync
	const entitySnapshot = captureEntitySnapshot(world);

	// Capture final diagnostics
	const diagnostics = syncGameWorldDiagnostics(world);

	pipeline.dispose();

	return {
		world,
		diagnostics,
		ticksRun: finalTick + 1,
		aliveEntities: world.runtime.alive.size,
		phase: world.session.phase,
		entitySnapshot,
	};
}
