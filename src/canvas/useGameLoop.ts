/**
 * useGameLoop — React hook that drives the ECS simulation via requestAnimationFrame.
 *
 * Runs tickAllSystems() each frame via requestAnimationFrame.
 * Pauses automatically when GamePhase !== "playing".
 * Cleans up the animation frame on unmount.
 */

import type { World } from "koota";
import { useCallback, useEffect, useRef } from "react";
import type { TerrainType } from "@/ai/terrainTypes";
import { GamePhase } from "@/ecs/traits/state";
import type { ScenarioEngine, ScenarioWorldQuery } from "@/scenarios/engine";
import type { FogOfWarSystem } from "@/systems/fogSystem";
import { type GameLoopContext, tickAllSystems } from "@/systems/gameLoop";
import type { WeatherSystem } from "@/systems/weatherSystem";

export interface UseGameLoopOptions {
	/** Canvas/viewport width in pixels. */
	width: number;
	/** Canvas/viewport height in pixels. */
	height: number;
	/** Scenario engine for the active mission. Null in skirmish/sandbox. */
	scenarioEngine?: ScenarioEngine | null;
	/** Adapter that reads ECS state for the scenario engine. */
	scenarioWorldQuery?: ScenarioWorldQuery | null;
	/** Fog of war system instance. Null if fog is disabled. */
	fogSystem?: FogOfWarSystem | null;
	/** Weather system instance. Null if weather is disabled. */
	weatherSystem?: WeatherSystem | null;
	/** Mutable terrain grid for environmental systems (tidal, fire). Null if not available. */
	terrainGrid?: TerrainType[][] | null;
}

export interface UseGameLoopResult {
	/** Total frames rendered since mount. */
	frameCount: number;
	/** Approximate frames per second (rolling average). */
	fps: number;
	/** Whether the game loop is currently paused. */
	isPaused: boolean;
}

/**
 * Drives the ECS game loop via requestAnimationFrame.
 *
 * @param world - The Koota ECS world instance.
 * @param options - Canvas dimensions and optional subsystem instances.
 * @returns Frame count, FPS, and pause state for HUD display.
 */
export function useGameLoop(world: World, options: UseGameLoopOptions): UseGameLoopResult {
	// All state stored in refs to avoid triggering React re-renders every frame.
	// Consumers read .current directly or use the returned snapshot at their cadence.
	const resultRef = useRef<UseGameLoopResult>({ frameCount: 0, fps: 0, isPaused: true });

	const rafRef = useRef<number>(0);
	const lastTimeRef = useRef<number>(0);
	const frameCountRef = useRef<number>(0);
	const fpsAccRef = useRef<number[]>([]);
	const elapsedMsRef = useRef<number>(0);

	// Store options in a ref to avoid re-creating the loop callback on every render
	const optionsRef = useRef(options);
	optionsRef.current = options;

	const tick = useCallback(
		(timestamp: number) => {
			// Compute delta (cap at 100ms to avoid spiral-of-death)
			const rawDelta = lastTimeRef.current === 0 ? 16.67 : timestamp - lastTimeRef.current;
			const deltaMs = Math.min(rawDelta, 100);
			lastTimeRef.current = timestamp;

			// Check game phase — pause if not "playing"
			const phase = world.get(GamePhase)?.phase ?? "loading";
			const paused = phase !== "playing";
			resultRef.current.isPaused = paused;

			if (!paused) {
				const deltaSec = deltaMs / 1000;
				elapsedMsRef.current += deltaMs;

				const opts = optionsRef.current;
				const ctx: GameLoopContext = {
					world,
					delta: deltaSec,
					width: opts.width,
					height: opts.height,
					scenarioEngine: opts.scenarioEngine ?? null,
					scenarioWorldQuery: opts.scenarioWorldQuery ?? null,
					fogSystem: opts.fogSystem ?? null,
					weatherSystem: opts.weatherSystem ?? null,
					elapsedMs: elapsedMsRef.current,
					terrainGrid: opts.terrainGrid ?? null,
				};

				tickAllSystems(ctx);
			}

			// Update frame count + FPS in refs (no React re-render)
			frameCountRef.current += 1;
			resultRef.current.frameCount = frameCountRef.current;

			if (deltaMs > 0) {
				const instantFps = 1000 / deltaMs;
				const samples = fpsAccRef.current;
				samples.push(instantFps);
				if (samples.length > 30) samples.shift();
				resultRef.current.fps = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
			}

			rafRef.current = requestAnimationFrame(tick);
		},
		[world],
	);

	useEffect(() => {
		lastTimeRef.current = 0;
		frameCountRef.current = 0;
		fpsAccRef.current = [];
		elapsedMsRef.current = 0;

		rafRef.current = requestAnimationFrame(tick);

		return () => {
			if (rafRef.current) {
				cancelAnimationFrame(rafRef.current);
			}
		};
	}, [tick]);

	return resultRef.current;
}
