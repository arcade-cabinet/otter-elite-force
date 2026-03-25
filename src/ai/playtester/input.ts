/**
 * AI Playtester Input Model
 *
 * Converts high-level PlayerAction intents into real browser events
 * dispatched to the Phaser canvas. Simulates human-like input:
 *
 * - APM limiter: configurable actions-per-minute ceiling
 * - Misclick: configurable error rate offsets click positions
 * - Action delay: minimum time between consecutive actions
 * - Drag duration: mousedown → mousemove → mouseup over time
 * - Camera scroll: dispatches wheel events or edge-of-screen moves
 *
 * All events hit the DOM the same way a real player's inputs do,
 * so Phaser's input system processes them identically.
 */

import { TILE_SIZE } from "@/maps/constants";

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export type ActionType = "click" | "rightClick" | "drag" | "scroll" | "keypress";

/** A single input action the AI wants to perform. */
export interface PlayerAction {
	type: ActionType;
	/** Screen X in pixels (relative to canvas). */
	screenX: number;
	/** Screen Y in pixels (relative to canvas). */
	screenY: number;
	/** End X for drag actions. */
	endX?: number;
	/** End Y for drag actions. */
	endY?: number;
	/** Duration in ms (for drag hold time, key hold time). */
	duration?: number;
	/** Key identifier for keypress actions (e.g. "w", "Escape"). */
	key?: string;
	/** Scroll delta for scroll actions (positive = zoom out). */
	scrollDelta?: number;
}

/** Configuration for human-like input behavior. */
export interface InputConfig {
	/** Actions per minute (30 = casual, 60 = average, 120 = skilled). */
	apm: number;
	/** Probability that a click lands off-target (0..1). */
	errorRate: number;
	/** Maximum pixel offset when a misclick occurs. */
	maxMisclickOffset: number;
	/** Minimum ms between consecutive actions. */
	minActionGap: number;
}

export const DEFAULT_INPUT_CONFIG: InputConfig = {
	apm: 60,
	errorRate: 0.05,
	maxMisclickOffset: 8,
	minActionGap: 50,
};

// ---------------------------------------------------------------------------
// APM Limiter
// ---------------------------------------------------------------------------

/**
 * Tracks action timing and enforces APM limits.
 * Returns the delay (in ms) before the next action can fire.
 */
export class APMLimiter {
	private config: InputConfig;
	private actionTimestamps: number[] = [];
	private lastActionTime = 0;

	constructor(config: InputConfig) {
		this.config = config;
	}

	/** Minimum ms between actions based on APM. */
	get minInterval(): number {
		return 60_000 / this.config.apm;
	}

	/**
	 * Check if an action can be performed now.
	 * Returns 0 if ready, or the ms to wait before the next action.
	 */
	getDelay(now: number): number {
		// Enforce minimum gap
		const sinceLastAction = now - this.lastActionTime;
		const gapDelay = Math.max(0, this.config.minActionGap - sinceLastAction);

		// Enforce APM ceiling: check actions in the last 60s window
		const windowStart = now - 60_000;
		this.actionTimestamps = this.actionTimestamps.filter((t) => t > windowStart);

		if (this.actionTimestamps.length >= this.config.apm) {
			const oldest = this.actionTimestamps[0];
			const apmDelay = oldest + 60_000 - now;
			return Math.max(gapDelay, apmDelay);
		}

		return gapDelay;
	}

	/** Record that an action was performed. */
	record(now: number): void {
		this.lastActionTime = now;
		this.actionTimestamps.push(now);
	}
}

// ---------------------------------------------------------------------------
// Misclick simulation
// ---------------------------------------------------------------------------

/** Apply random offset to simulate imprecise clicking. */
export function applyMisclick(x: number, y: number, config: InputConfig): { x: number; y: number } {
	if (Math.random() >= config.errorRate) {
		return { x, y };
	}

	const angle = Math.random() * Math.PI * 2;
	const distance = Math.random() * config.maxMisclickOffset;
	return {
		x: Math.round(x + Math.cos(angle) * distance),
		y: Math.round(y + Math.sin(angle) * distance),
	};
}

// ---------------------------------------------------------------------------
// Event dispatcher
// ---------------------------------------------------------------------------

/**
 * Dispatches a PlayerAction as real browser events to the canvas element.
 * Returns a promise that resolves when all events for this action have fired
 * (important for drag/hold actions that span multiple frames).
 */
export async function executeAction(
	canvas: HTMLCanvasElement,
	action: PlayerAction,
	config: InputConfig = DEFAULT_INPUT_CONFIG,
): Promise<void> {
	switch (action.type) {
		case "click":
			return executeClick(canvas, action, config, 0);
		case "rightClick":
			return executeClick(canvas, action, config, 2);
		case "drag":
			return executeDrag(canvas, action, config);
		case "scroll":
			return executeScroll(canvas, action);
		case "keypress":
			return executeKeypress(canvas, action);
	}
}

function executeClick(
	canvas: HTMLCanvasElement,
	action: PlayerAction,
	config: InputConfig,
	button: number,
): Promise<void> {
	const { x, y } = applyMisclick(action.screenX, action.screenY, config);
	const rect = canvas.getBoundingClientRect();

	const common = {
		clientX: rect.left + x,
		clientY: rect.top + y,
		button,
		bubbles: true,
		cancelable: true,
	};

	canvas.dispatchEvent(new MouseEvent("mousedown", common));
	canvas.dispatchEvent(new MouseEvent("mouseup", common));
	if (button === 0) {
		canvas.dispatchEvent(new MouseEvent("click", common));
	} else if (button === 2) {
		canvas.dispatchEvent(new MouseEvent("contextmenu", common));
	}

	return Promise.resolve();
}

async function executeDrag(
	canvas: HTMLCanvasElement,
	action: PlayerAction,
	config: InputConfig,
): Promise<void> {
	const startPos = applyMisclick(action.screenX, action.screenY, config);
	const endPos = applyMisclick(
		action.endX ?? action.screenX,
		action.endY ?? action.screenY,
		config,
	);
	const rect = canvas.getBoundingClientRect();
	const duration = action.duration ?? 200;
	const steps = Math.max(3, Math.floor(duration / 16)); // ~60fps steps

	// mousedown at start
	canvas.dispatchEvent(
		new MouseEvent("mousedown", {
			clientX: rect.left + startPos.x,
			clientY: rect.top + startPos.y,
			button: 0,
			bubbles: true,
			cancelable: true,
		}),
	);

	// mousemove interpolations
	for (let i = 1; i <= steps; i++) {
		const t = i / steps;
		const mx = startPos.x + (endPos.x - startPos.x) * t;
		const my = startPos.y + (endPos.y - startPos.y) * t;

		await delay(duration / steps);

		canvas.dispatchEvent(
			new MouseEvent("mousemove", {
				clientX: rect.left + mx,
				clientY: rect.top + my,
				button: 0,
				buttons: 1,
				bubbles: true,
				cancelable: true,
			}),
		);
	}

	// mouseup at end
	canvas.dispatchEvent(
		new MouseEvent("mouseup", {
			clientX: rect.left + endPos.x,
			clientY: rect.top + endPos.y,
			button: 0,
			bubbles: true,
			cancelable: true,
		}),
	);
}

function executeScroll(canvas: HTMLCanvasElement, action: PlayerAction): Promise<void> {
	const rect = canvas.getBoundingClientRect();

	canvas.dispatchEvent(
		new WheelEvent("wheel", {
			clientX: rect.left + action.screenX,
			clientY: rect.top + action.screenY,
			deltaY: action.scrollDelta ?? 100,
			bubbles: true,
			cancelable: true,
		}),
	);

	return Promise.resolve();
}

function executeKeypress(canvas: HTMLCanvasElement, action: PlayerAction): Promise<void> {
	const key = action.key ?? "";

	const common = {
		key,
		code: keyToCode(key),
		bubbles: true,
		cancelable: true,
	};

	canvas.dispatchEvent(new KeyboardEvent("keydown", common));
	canvas.dispatchEvent(new KeyboardEvent("keyup", common));

	return Promise.resolve();
}

// ---------------------------------------------------------------------------
// Action factories — convenience for goal code
// ---------------------------------------------------------------------------

/** Create a left-click action at a tile position, converting to screen coords. */
export function clickAtTile(
	tileX: number,
	tileY: number,
	viewportX: number,
	viewportY: number,
): PlayerAction {
	return {
		type: "click",
		screenX: tileX * TILE_SIZE + TILE_SIZE / 2 - viewportX,
		screenY: tileY * TILE_SIZE + TILE_SIZE / 2 - viewportY,
	};
}

/** Create a right-click action at a tile position. */
export function rightClickAtTile(
	tileX: number,
	tileY: number,
	viewportX: number,
	viewportY: number,
): PlayerAction {
	return {
		type: "rightClick",
		screenX: tileX * TILE_SIZE + TILE_SIZE / 2 - viewportX,
		screenY: tileY * TILE_SIZE + TILE_SIZE / 2 - viewportY,
	};
}

/** Create a box-select drag action between two tile positions. */
export function dragSelectTiles(
	fromTileX: number,
	fromTileY: number,
	toTileX: number,
	toTileY: number,
	viewportX: number,
	viewportY: number,
	duration = 200,
): PlayerAction {
	return {
		type: "drag",
		screenX: fromTileX * TILE_SIZE - viewportX,
		screenY: fromTileY * TILE_SIZE - viewportY,
		endX: (toTileX + 1) * TILE_SIZE - viewportX,
		endY: (toTileY + 1) * TILE_SIZE - viewportY,
		duration,
	};
}

/** Create a scroll/pan action to move the camera. */
export function scrollCamera(screenX: number, screenY: number, deltaY: number): PlayerAction {
	return {
		type: "scroll",
		screenX,
		screenY,
		scrollDelta: deltaY,
	};
}

/** Create a keypress action. */
export function pressKey(key: string): PlayerAction {
	return {
		type: "keypress",
		screenX: 0,
		screenY: 0,
		key,
	};
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Map common key names to KeyboardEvent.code values. */
function keyToCode(key: string): string {
	const codeMap: Record<string, string> = {
		w: "KeyW",
		a: "KeyA",
		s: "KeyS",
		d: "KeyD",
		q: "KeyQ",
		e: "KeyE",
		r: "KeyR",
		f: "KeyF",
		g: "KeyG",
		b: "KeyB",
		"1": "Digit1",
		"2": "Digit2",
		"3": "Digit3",
		"4": "Digit4",
		"5": "Digit5",
		Escape: "Escape",
		Enter: "Enter",
		Tab: "Tab",
		Space: "Space",
		" ": "Space",
	};
	return codeMap[key] ?? `Key${key.toUpperCase()}`;
}
