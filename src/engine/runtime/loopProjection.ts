import type { GamePhaseType } from "@/ecs/traits/state";

const DEFAULT_FRAME_DELTA_MS = 16.67;
const MAX_FRAME_DELTA_MS = 100;
const FPS_SAMPLE_WINDOW = 30;

export interface RuntimeLoopProjectionState {
	lastTimestamp: number;
	frameCount: number;
	fps: number;
	fpsSamples: number[];
	elapsedMs: number;
	simulationTick: number;
	isPaused: boolean;
}

export interface RuntimeLoopFrame {
	state: RuntimeLoopProjectionState;
	deltaMs: number;
	deltaSec: number;
	shouldTickSystems: boolean;
}

export interface RuntimeGameClockSnapshot {
	elapsedMs: number;
	lastDeltaMs: number;
	tick: number;
	paused: boolean;
}

export function createInitialRuntimeLoopProjectionState(): RuntimeLoopProjectionState {
	return {
		lastTimestamp: 0,
		frameCount: 0,
		fps: 0,
		fpsSamples: [],
		elapsedMs: 0,
		simulationTick: 0,
		isPaused: true,
	};
}

export function advanceRuntimeLoopProjection(
	state: RuntimeLoopProjectionState,
	timestamp: number,
	phase: GamePhaseType,
): RuntimeLoopFrame {
	const rawDeltaMs = state.lastTimestamp === 0 ? DEFAULT_FRAME_DELTA_MS : timestamp - state.lastTimestamp;
	const deltaMs = Math.min(Math.max(rawDeltaMs, 0), MAX_FRAME_DELTA_MS);
	const paused = phase !== "playing";
	const shouldTickSystems = !paused;
	const fpsSamples = deltaMs > 0
		? [...state.fpsSamples, 1000 / deltaMs].slice(-FPS_SAMPLE_WINDOW)
		: [...state.fpsSamples];
	const fps = fpsSamples.length > 0
		? Math.round(fpsSamples.reduce((sum, sample) => sum + sample, 0) / fpsSamples.length)
		: 0;

	return {
		deltaMs,
		deltaSec: deltaMs / 1000,
		shouldTickSystems,
		state: {
			lastTimestamp: timestamp,
			frameCount: state.frameCount + 1,
			fps,
			fpsSamples,
			elapsedMs: shouldTickSystems ? state.elapsedMs + deltaMs : state.elapsedMs,
			simulationTick: shouldTickSystems ? state.simulationTick + 1 : state.simulationTick,
			isPaused: paused,
		},
	};
}

export function projectRuntimeGameClock(frame: RuntimeLoopFrame): RuntimeGameClockSnapshot {
	return {
		elapsedMs: frame.state.elapsedMs,
		lastDeltaMs: frame.shouldTickSystems ? frame.deltaMs : 0,
		tick: frame.state.simulationTick,
		paused: frame.state.isPaused,
	};
}
