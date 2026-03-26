import { describe, expect, it } from "vitest";
import {
	advanceRuntimeLoopProjection,
	createInitialRuntimeLoopProjectionState,
	projectRuntimeGameClock,
} from "./loopProjection";

describe("engine/runtime/loopProjection", () => {
	it("uses a deterministic first-frame delta and advances simulation while playing", () => {
		const initial = createInitialRuntimeLoopProjectionState();
		const frame = advanceRuntimeLoopProjection(initial, 100, "playing");

		expect(frame.deltaMs).toBe(16.67);
		expect(frame.deltaSec).toBeCloseTo(0.01667, 5);
		expect(frame.shouldTickSystems).toBe(true);
		expect(frame.state.frameCount).toBe(1);
		expect(frame.state.elapsedMs).toBe(16.67);
		expect(frame.state.simulationTick).toBe(1);
		expect(frame.state.isPaused).toBe(false);
	});

	it("caps long frame gaps to prevent spiral-of-death behavior", () => {
		const initial = {
			...createInitialRuntimeLoopProjectionState(),
			lastTimestamp: 100,
		};
		const frame = advanceRuntimeLoopProjection(initial, 900, "playing");

		expect(frame.deltaMs).toBe(100);
		expect(frame.deltaSec).toBe(0.1);
		expect(frame.state.elapsedMs).toBe(100);
	});

	it("freezes simulation time while paused", () => {
		const initial = {
			...createInitialRuntimeLoopProjectionState(),
			lastTimestamp: 100,
			elapsedMs: 2000,
			simulationTick: 12,
		};
		const frame = advanceRuntimeLoopProjection(initial, 116, "paused");

		expect(frame.shouldTickSystems).toBe(false);
		expect(frame.state.elapsedMs).toBe(2000);
		expect(frame.state.simulationTick).toBe(12);
		expect(frame.state.isPaused).toBe(true);
	});

	it("projects the runtime frame into a game-clock snapshot", () => {
		const initial = createInitialRuntimeLoopProjectionState();
		const frame = advanceRuntimeLoopProjection(initial, 100, "playing");

		expect(projectRuntimeGameClock(frame)).toEqual({
			elapsedMs: 16.67,
			lastDeltaMs: 16.67,
			tick: 1,
			paused: false,
		});
	});
});
