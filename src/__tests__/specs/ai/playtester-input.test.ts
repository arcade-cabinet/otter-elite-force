/**
 * AI Playtester Input Model Specification Tests
 *
 * Defines the behavioral contract for the input model:
 *   - APM limiting (configurable actions-per-minute ceiling)
 *   - Misclick simulation (configurable error rate)
 *   - Real MouseEvent dispatch to canvas
 *   - Action types: click, rightClick, drag, scroll, keypress
 *
 * Sources:
 *   - docs/superpowers/specs/2026-03-24-ui-spdsl-architecture-design.md §9
 *   - src/ai/playtester/input.ts
 *   - docs/architecture/testing-strategy.md (Layer 1: spec tests)
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	APMLimiter,
	applyMisclick,
	clickAtTile,
	DEFAULT_INPUT_CONFIG,
	dragSelectTiles,
	executeAction,
	type InputConfig,
	type PlayerAction,
	pressKey,
	rightClickAtTile,
	scrollCamera,
} from "@/ai/playtester/input";

// ===========================================================================
// SPECIFICATION: APM Limiter
// ===========================================================================

describe("APMLimiter", () => {
	describe("minInterval calculation", () => {
		it("60 APM = 1000ms minimum interval", () => {
			const limiter = new APMLimiter({ ...DEFAULT_INPUT_CONFIG, apm: 60 });
			expect(limiter.minInterval).toBe(1000);
		});

		it("120 APM = 500ms minimum interval", () => {
			const limiter = new APMLimiter({ ...DEFAULT_INPUT_CONFIG, apm: 120 });
			expect(limiter.minInterval).toBe(500);
		});

		it("30 APM = 2000ms minimum interval", () => {
			const limiter = new APMLimiter({ ...DEFAULT_INPUT_CONFIG, apm: 30 });
			expect(limiter.minInterval).toBe(2000);
		});
	});

	describe("getDelay()", () => {
		it("returns 0 delay on first action", () => {
			const limiter = new APMLimiter({ ...DEFAULT_INPUT_CONFIG, apm: 60, minActionGap: 0 });
			expect(limiter.getDelay(0)).toBe(0);
		});

		it("enforces minimum action gap", () => {
			const limiter = new APMLimiter({ ...DEFAULT_INPUT_CONFIG, apm: 600, minActionGap: 100 });
			limiter.record(1000);
			// 50ms later, still need to wait 50ms more
			const delay = limiter.getDelay(1050);
			expect(delay).toBe(50);
		});

		it("enforces APM ceiling over 60s window", () => {
			const config: InputConfig = { ...DEFAULT_INPUT_CONFIG, apm: 3, minActionGap: 0 };
			const limiter = new APMLimiter(config);
			// Record 3 actions in quick succession
			limiter.record(0);
			limiter.record(100);
			limiter.record(200);
			// 4th action at t=300 should be delayed until t=60000 (oldest action + 60s)
			const delay = limiter.getDelay(300);
			expect(delay).toBeGreaterThan(0);
			expect(delay).toBe(60000 - 300); // must wait until oldest action expires
		});
	});

	describe("record()", () => {
		it("records action timestamp for APM tracking", () => {
			const limiter = new APMLimiter({ ...DEFAULT_INPUT_CONFIG, apm: 60, minActionGap: 0 });
			limiter.record(1000);
			// Immediately after recording, there should be minActionGap delay
			const delay = limiter.getDelay(1000);
			// With minActionGap=0, delay should be 0 (within APM budget)
			expect(delay).toBe(0);
		});
	});
});

// ===========================================================================
// SPECIFICATION: Misclick Simulation
// ===========================================================================

describe("applyMisclick", () => {
	it("returns exact position when error rate is 0", () => {
		const config: InputConfig = { ...DEFAULT_INPUT_CONFIG, errorRate: 0 };
		const result = applyMisclick(100, 200, config);
		expect(result.x).toBe(100);
		expect(result.y).toBe(200);
	});

	it("returns offset position when error rate is 1 (always misclick)", () => {
		// With errorRate=1, every click should be offset
		const config: InputConfig = { ...DEFAULT_INPUT_CONFIG, errorRate: 1, maxMisclickOffset: 8 };
		// Run multiple times to verify it sometimes produces different offsets
		const results = new Set<string>();
		for (let i = 0; i < 50; i++) {
			const result = applyMisclick(100, 200, config);
			results.add(`${result.x},${result.y}`);
		}
		// With errorRate=1, at least some results should differ from the original
		// (probability of all 50 being exactly (100,200) is astronomically low with maxOffset=8)
		expect(results.size).toBeGreaterThan(1);
	});

	it("offset stays within maxMisclickOffset radius", () => {
		const config: InputConfig = { ...DEFAULT_INPUT_CONFIG, errorRate: 1, maxMisclickOffset: 8 };
		for (let i = 0; i < 100; i++) {
			const result = applyMisclick(100, 200, config);
			const dx = result.x - 100;
			const dy = result.y - 200;
			const distance = Math.sqrt(dx * dx + dy * dy);
			expect(distance).toBeLessThanOrEqual(8 + 1); // +1 for rounding
		}
	});
});

// ===========================================================================
// SPECIFICATION: Event Dispatch
// ===========================================================================

describe("executeAction — real MouseEvent dispatch", () => {
	let canvas: HTMLCanvasElement;
	let events: Event[];

	beforeEach(() => {
		canvas = document.createElement("canvas");
		canvas.width = 800;
		canvas.height = 600;
		// Mock getBoundingClientRect for happy-dom
		canvas.getBoundingClientRect = () => ({
			left: 0,
			top: 0,
			right: 800,
			bottom: 600,
			width: 800,
			height: 600,
			x: 0,
			y: 0,
			toJSON: () => {},
		});
		events = [];
		const capture = (e: Event) => events.push(e);
		canvas.addEventListener("mousedown", capture);
		canvas.addEventListener("mouseup", capture);
		canvas.addEventListener("click", capture);
		canvas.addEventListener("contextmenu", capture);
		canvas.addEventListener("mousemove", capture);
		canvas.addEventListener("wheel", capture);
		canvas.addEventListener("keydown", capture);
		canvas.addEventListener("keyup", capture);
	});

	it("click dispatches mousedown + mouseup + click", async () => {
		const action: PlayerAction = { type: "click", screenX: 100, screenY: 200 };
		const config: InputConfig = { ...DEFAULT_INPUT_CONFIG, errorRate: 0 };
		await executeAction(canvas, action, config);
		const types = events.map((e) => e.type);
		expect(types).toContain("mousedown");
		expect(types).toContain("mouseup");
		expect(types).toContain("click");
	});

	it("rightClick dispatches mousedown + mouseup + contextmenu", async () => {
		const action: PlayerAction = { type: "rightClick", screenX: 100, screenY: 200 };
		const config: InputConfig = { ...DEFAULT_INPUT_CONFIG, errorRate: 0 };
		await executeAction(canvas, action, config);
		const types = events.map((e) => e.type);
		expect(types).toContain("mousedown");
		expect(types).toContain("mouseup");
		expect(types).toContain("contextmenu");
	});

	it("click uses correct button=0 for left click", async () => {
		const action: PlayerAction = { type: "click", screenX: 50, screenY: 50 };
		const config: InputConfig = { ...DEFAULT_INPUT_CONFIG, errorRate: 0 };
		await executeAction(canvas, action, config);
		const mousedown = events.find((e) => e.type === "mousedown") as MouseEvent;
		expect(mousedown.button).toBe(0);
	});

	it("rightClick uses correct button=2", async () => {
		const action: PlayerAction = { type: "rightClick", screenX: 50, screenY: 50 };
		const config: InputConfig = { ...DEFAULT_INPUT_CONFIG, errorRate: 0 };
		await executeAction(canvas, action, config);
		const mousedown = events.find((e) => e.type === "mousedown") as MouseEvent;
		expect(mousedown.button).toBe(2);
	});

	it("scroll dispatches wheel event with correct deltaY", async () => {
		const action: PlayerAction = { type: "scroll", screenX: 400, screenY: 300, scrollDelta: 120 };
		await executeAction(canvas, action);
		const wheel = events.find((e) => e.type === "wheel") as WheelEvent;
		expect(wheel).toBeDefined();
		expect(wheel.deltaY).toBe(120);
	});

	it("keypress dispatches keydown + keyup", async () => {
		const action: PlayerAction = { type: "keypress", screenX: 0, screenY: 0, key: "w" };
		await executeAction(canvas, action);
		const types = events.map((e) => e.type);
		expect(types).toContain("keydown");
		expect(types).toContain("keyup");
		const keydown = events.find((e) => e.type === "keydown") as KeyboardEvent;
		expect(keydown.key).toBe("w");
	});

	it("drag dispatches mousedown + mousemove(s) + mouseup", async () => {
		const action: PlayerAction = {
			type: "drag",
			screenX: 100,
			screenY: 100,
			endX: 300,
			endY: 200,
			duration: 50,
		};
		const config: InputConfig = { ...DEFAULT_INPUT_CONFIG, errorRate: 0 };
		await executeAction(canvas, action, config);
		const types = events.map((e) => e.type);
		expect(types[0]).toBe("mousedown");
		expect(types).toContain("mousemove");
		expect(types[types.length - 1]).toBe("mouseup");
	});
});

// ===========================================================================
// SPECIFICATION: Action Factories
// ===========================================================================

describe("Action Factories", () => {
	it("clickAtTile converts tile coords to screen coords", () => {
		const action = clickAtTile(5, 3, 0, 0);
		expect(action.type).toBe("click");
		// Tile center should be at tileX * TILE_SIZE + TILE_SIZE/2
		expect(action.screenX).toBeGreaterThan(0);
		expect(action.screenY).toBeGreaterThan(0);
	});

	it("rightClickAtTile produces rightClick action", () => {
		const action = rightClickAtTile(5, 3, 0, 0);
		expect(action.type).toBe("rightClick");
	});

	it("dragSelectTiles produces drag action with start and end", () => {
		const action = dragSelectTiles(0, 0, 3, 3, 0, 0);
		expect(action.type).toBe("drag");
		expect(action.endX).toBeDefined();
		expect(action.endY).toBeDefined();
	});

	it("pressKey produces keypress action", () => {
		const action = pressKey("Escape");
		expect(action.type).toBe("keypress");
		expect(action.key).toBe("Escape");
	});

	it("scrollCamera produces scroll action", () => {
		const action = scrollCamera(400, 300, -100);
		expect(action.type).toBe("scroll");
		expect(action.scrollDelta).toBe(-100);
	});
});

// ===========================================================================
// SPECIFICATION: Default Config
// ===========================================================================

describe("DEFAULT_INPUT_CONFIG", () => {
	it("has 60 APM (average human)", () => {
		expect(DEFAULT_INPUT_CONFIG.apm).toBe(60);
	});

	it("has 5% error rate", () => {
		expect(DEFAULT_INPUT_CONFIG.errorRate).toBe(0.05);
	});

	it("has 8px max misclick offset", () => {
		expect(DEFAULT_INPUT_CONFIG.maxMisclickOffset).toBe(8);
	});

	it("has 50ms minimum action gap", () => {
		expect(DEFAULT_INPUT_CONFIG.minActionGap).toBe(50);
	});
});
