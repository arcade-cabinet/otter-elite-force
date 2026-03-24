/**
 * AI Playtester — the top-level orchestrator.
 *
 * Wires together perception, GOAP brain, and input model to play
 * the game like a human. Runs in a tick loop:
 *
 * 1. Build perception snapshot from current game state
 * 2. Brain arbitrates → picks highest-priority goal
 * 3. Goal produces PlayerAction[]
 * 4. APM limiter gates action execution
 * 5. Actions dispatched as real browser events to canvas
 *
 * Usage:
 *   const ai = new AIPlaytester(canvas, world, fog, stateReader, config);
 *   // In game loop:
 *   await ai.tick(now);
 */

import type { World } from "koota";
import { FogOfWarSystem } from "@/systems/fogSystem";
import {
	type GameStateReader,
	PerceptionBuilder,
	type PlayerPerception,
	type Viewport,
} from "./perception";
import { APMLimiter, type InputConfig, DEFAULT_INPUT_CONFIG, executeAction } from "./input";
import type { PlayerAction } from "./input";
import { createPlaytesterBrain, type PlaytesterBrain } from "./goals";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface AIPlaytesterConfig extends InputConfig {
	/** Re-arbitrate every N ticks (default 10 = every 10th tick). */
	rearbitrateInterval: number;
	/** Viewport dimensions in pixels (default 800x600). */
	viewportWidth: number;
	viewportHeight: number;
}

export const DEFAULT_AI_CONFIG: AIPlaytesterConfig = {
	...DEFAULT_INPUT_CONFIG,
	rearbitrateInterval: 10,
	viewportWidth: 800,
	viewportHeight: 600,
};

// ---------------------------------------------------------------------------
// Result type for runUntilComplete
// ---------------------------------------------------------------------------

export interface PlaytestResult {
	outcome: "victory" | "defeat" | "timeout";
	ticks: number;
	actionsPerformed: number;
	finalPerception: PlayerPerception | null;
}

// ---------------------------------------------------------------------------
// AIPlaytester
// ---------------------------------------------------------------------------

export class AIPlaytester {
	readonly brain: PlaytesterBrain;
	private perceptionBuilder: PerceptionBuilder;
	private apmLimiter: APMLimiter;
	private canvas: HTMLCanvasElement;
	private config: AIPlaytesterConfig;

	/** Camera position in world pixels — the AI "scrolls" by updating this. */
	private cameraX = 0;
	private cameraY = 0;

	private tickCount = 0;
	private totalActions = 0;
	private lastPerception: PlayerPerception | null = null;

	/** Pending actions queued by the brain but not yet dispatched (APM gated). */
	private actionQueue: PlayerAction[] = [];

	constructor(
		canvas: HTMLCanvasElement,
		world: World,
		fog: FogOfWarSystem,
		stateReader: GameStateReader,
		mapCols: number,
		mapRows: number,
		config: Partial<AIPlaytesterConfig> = {},
	) {
		this.config = { ...DEFAULT_AI_CONFIG, ...config };
		this.canvas = canvas;
		this.brain = createPlaytesterBrain();
		this.perceptionBuilder = new PerceptionBuilder(world, fog, stateReader, mapCols, mapRows);
		this.apmLimiter = new APMLimiter(this.config);
	}

	/** Get current viewport based on camera position. */
	private getViewport(): Viewport {
		return {
			x: this.cameraX,
			y: this.cameraY,
			width: this.config.viewportWidth,
			height: this.config.viewportHeight,
		};
	}

	/**
	 * Single AI tick. Call once per game update frame.
	 *
	 * @param now - Current timestamp in ms (performance.now() or Date.now())
	 */
	async tick(now: number): Promise<void> {
		this.tickCount++;

		// 1. Build perception
		const viewport = this.getViewport();
		const perception = this.perceptionBuilder.build(viewport);
		this.lastPerception = perception;

		// 2. Re-arbitrate periodically (not every tick — too noisy)
		if (this.tickCount % this.config.rearbitrateInterval === 0) {
			this.brain.arbitrate(perception);
		}

		// 3. Execute brain — may produce new actions
		const newActions = this.brain.execute(perception);
		for (const action of newActions) {
			this.actionQueue.push(action);
		}

		// 4. Drain action queue through APM limiter
		while (this.actionQueue.length > 0) {
			const delay = this.apmLimiter.getDelay(now);
			if (delay > 0) break; // Can't act yet

			const action = this.actionQueue.shift()!;
			await executeAction(this.canvas, action, this.config);
			this.apmLimiter.record(now);
			this.totalActions++;
		}
	}

	/** Scroll the AI's camera to center on a tile. */
	scrollTo(tileX: number, tileY: number): void {
		this.cameraX = tileX * 32 - this.config.viewportWidth / 2;
		this.cameraY = tileY * 32 - this.config.viewportHeight / 2;
	}

	/** Get the last perception snapshot (for test assertions). */
	getLastPerception(): PlayerPerception | null {
		return this.lastPerception;
	}

	/** Get total actions performed. */
	getStats(): { ticks: number; actions: number } {
		return { ticks: this.tickCount, actions: this.totalActions };
	}
}

// ---------------------------------------------------------------------------
// Test harness: run AI until victory, defeat, or timeout
// ---------------------------------------------------------------------------

/**
 * Run the AI playtester in a loop until the game ends or timeout.
 *
 * @param ai - The AIPlaytester instance
 * @param isComplete - Callback: returns "victory" | "defeat" | null
 * @param options - maxTicks and tickInterval
 */
export async function runUntilComplete(
	ai: AIPlaytester,
	isComplete: (perception: PlayerPerception | null) => "victory" | "defeat" | null,
	options: { maxTicks?: number; tickInterval?: number } = {},
): Promise<PlaytestResult> {
	const maxTicks = options.maxTicks ?? 30_000;
	const tickInterval = options.tickInterval ?? 16; // ~60fps
	let ticks = 0;

	while (ticks < maxTicks) {
		const now = performance.now();
		await ai.tick(now);
		ticks++;

		const outcome = isComplete(ai.getLastPerception());
		if (outcome !== null) {
			const stats = ai.getStats();
			return {
				outcome,
				ticks,
				actionsPerformed: stats.actions,
				finalPerception: ai.getLastPerception(),
			};
		}

		// Yield to event loop
		await new Promise((resolve) => setTimeout(resolve, tickInterval));
	}

	const stats = ai.getStats();
	return {
		outcome: "timeout",
		ticks,
		actionsPerformed: stats.actions,
		finalPerception: ai.getLastPerception(),
	};
}

// ---------------------------------------------------------------------------
// Re-exports for convenience
// ---------------------------------------------------------------------------

export type { PlayerPerception, GameStateReader, Viewport } from "./perception";
export type { PlayerAction, InputConfig } from "./input";
export {
	PerceptionBuilder,
	countIdleWorkers,
	countMilitaryUnits,
	isBaseUnderThreat,
	findNearestUnexploredTile,
	findNearestResource,
	canAfford,
	hasPopulationRoom,
	findBuildings,
	findWeakestEnemy,
	explorationProgress,
} from "./perception";
export { executeAction, APMLimiter, DEFAULT_INPUT_CONFIG, applyMisclick } from "./input";
export { createPlaytesterBrain, PlaytesterBrain } from "./goals";
