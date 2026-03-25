/**
 * Gesture Detector — TDD tests for pure gesture classification logic.
 *
 * The gesture detector takes raw pointer states (positions, timestamps,
 * pointer count) and classifies them into gesture types without any
 * Phaser dependency.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { GestureDetector, GestureType, type PointerState } from "@/input/gestureDetector";

function makePointer(overrides: Partial<PointerState> = {}): PointerState {
	return {
		id: 0,
		x: 100,
		y: 100,
		worldX: 200,
		worldY: 200,
		isDown: false,
		time: Date.now(),
		...overrides,
	};
}

describe("GestureDetector", () => {
	let detector: GestureDetector;

	beforeEach(() => {
		detector = new GestureDetector();
	});

	// =========================================================================
	// TAP (single short touch → select)
	// =========================================================================
	describe("tap detection", () => {
		it("should detect a tap when pointer is down and up quickly with minimal movement", () => {
			const now = Date.now();
			detector.onPointerDown([makePointer({ id: 0, x: 100, y: 100, isDown: true, time: now })]);
			const gesture = detector.onPointerUp([
				makePointer({ id: 0, x: 102, y: 101, isDown: false, time: now + 100 }),
			]);

			expect(gesture?.type).toBe(GestureType.Tap);
		});

		it("should NOT detect a tap if pointer moved too far", () => {
			const now = Date.now();
			detector.onPointerDown([makePointer({ id: 0, x: 100, y: 100, isDown: true, time: now })]);
			const gesture = detector.onPointerUp([
				makePointer({ id: 0, x: 150, y: 150, isDown: false, time: now + 100 }),
			]);

			expect(gesture?.type).not.toBe(GestureType.Tap);
		});

		it("should NOT detect a tap if held too long (becomes long press)", () => {
			const now = Date.now();
			detector.onPointerDown([makePointer({ id: 0, x: 100, y: 100, isDown: true, time: now })]);
			const gesture = detector.onPointerUp([
				makePointer({ id: 0, x: 101, y: 101, isDown: false, time: now + 600 }),
			]);

			expect(gesture?.type).not.toBe(GestureType.Tap);
		});
	});

	// =========================================================================
	// LONG PRESS (hold finger → move/attack command)
	// =========================================================================
	describe("long press detection", () => {
		it("should detect long press when held in place beyond threshold", () => {
			const now = Date.now();
			detector.onPointerDown([makePointer({ id: 0, x: 100, y: 100, isDown: true, time: now })]);

			// Simulate time passing with minimal movement
			const gesture = detector.onHoldCheck(
				[makePointer({ id: 0, x: 102, y: 101, isDown: true, time: now + 500 })],
				now + 500,
			);

			expect(gesture?.type).toBe(GestureType.LongPress);
		});

		it("should NOT detect long press if pointer moved significantly during hold", () => {
			const now = Date.now();
			detector.onPointerDown([makePointer({ id: 0, x: 100, y: 100, isDown: true, time: now })]);

			const gesture = detector.onHoldCheck(
				[makePointer({ id: 0, x: 160, y: 160, isDown: true, time: now + 500 })],
				now + 500,
			);

			expect(gesture?.type).not.toBe(GestureType.LongPress);
		});

		it("should NOT detect long press if not enough time elapsed", () => {
			const now = Date.now();
			detector.onPointerDown([makePointer({ id: 0, x: 100, y: 100, isDown: true, time: now })]);

			const gesture = detector.onHoldCheck(
				[makePointer({ id: 0, x: 101, y: 101, isDown: true, time: now + 200 })],
				now + 200,
			);

			expect(gesture).toBeNull();
		});
	});

	// =========================================================================
	// ONE-FINGER DRAG (selection rectangle)
	// =========================================================================
	describe("one-finger drag detection", () => {
		it("should detect one-finger drag when single pointer moves beyond threshold", () => {
			const now = Date.now();
			detector.onPointerDown([makePointer({ id: 0, x: 100, y: 100, isDown: true, time: now })]);

			const gesture = detector.onPointerMove([
				makePointer({ id: 0, x: 130, y: 130, isDown: true, time: now + 50 }),
			]);

			expect(gesture?.type).toBe(GestureType.OneFingerDrag);
		});

		it("should include start and current positions in drag gesture", () => {
			const now = Date.now();
			detector.onPointerDown([
				makePointer({ id: 0, x: 100, y: 100, worldX: 200, worldY: 200, isDown: true, time: now }),
			]);

			const gesture = detector.onPointerMove([
				makePointer({
					id: 0,
					x: 150,
					y: 160,
					worldX: 250,
					worldY: 260,
					isDown: true,
					time: now + 50,
				}),
			]);

			expect(gesture?.type).toBe(GestureType.OneFingerDrag);
			expect(gesture?.startWorldX).toBe(200);
			expect(gesture?.startWorldY).toBe(200);
			expect(gesture?.currentWorldX).toBe(250);
			expect(gesture?.currentWorldY).toBe(260);
		});

		it("should NOT trigger drag if movement is below threshold", () => {
			const now = Date.now();
			detector.onPointerDown([makePointer({ id: 0, x: 100, y: 100, isDown: true, time: now })]);

			const gesture = detector.onPointerMove([
				makePointer({ id: 0, x: 103, y: 102, isDown: true, time: now + 50 }),
			]);

			expect(gesture).toBeNull();
		});
	});

	// =========================================================================
	// TWO-FINGER DRAG (camera pan)
	// =========================================================================
	describe("two-finger drag detection", () => {
		it("should detect two-finger drag when two pointers move together", () => {
			const now = Date.now();
			detector.onPointerDown([
				makePointer({ id: 0, x: 100, y: 100, isDown: true, time: now }),
				makePointer({ id: 1, x: 200, y: 200, isDown: true, time: now }),
			]);

			const gesture = detector.onPointerMove([
				makePointer({ id: 0, x: 120, y: 120, isDown: true, time: now + 50 }),
				makePointer({ id: 1, x: 220, y: 220, isDown: true, time: now + 50 }),
			]);

			expect(gesture?.type).toBe(GestureType.TwoFingerDrag);
		});

		it("should report delta for camera panning", () => {
			const now = Date.now();
			detector.onPointerDown([
				makePointer({ id: 0, x: 100, y: 100, isDown: true, time: now }),
				makePointer({ id: 1, x: 200, y: 200, isDown: true, time: now }),
			]);

			const gesture = detector.onPointerMove([
				makePointer({ id: 0, x: 120, y: 130, isDown: true, time: now + 50 }),
				makePointer({ id: 1, x: 220, y: 230, isDown: true, time: now + 50 }),
			]);

			expect(gesture?.type).toBe(GestureType.TwoFingerDrag);
			expect(gesture?.deltaX).toBe(20);
			expect(gesture?.deltaY).toBe(30);
		});
	});

	// =========================================================================
	// PINCH (camera zoom)
	// =========================================================================
	describe("pinch detection", () => {
		it("should detect pinch when two fingers move apart", () => {
			const now = Date.now();
			detector.onPointerDown([
				makePointer({ id: 0, x: 150, y: 200, isDown: true, time: now }),
				makePointer({ id: 1, x: 250, y: 200, isDown: true, time: now }),
			]);
			// Initial distance: 100

			const gesture = detector.onPointerMove([
				makePointer({ id: 0, x: 120, y: 200, isDown: true, time: now + 50 }),
				makePointer({ id: 1, x: 280, y: 200, isDown: true, time: now + 50 }),
			]);
			// New distance: 160

			expect(gesture?.type).toBe(GestureType.Pinch);
			expect(gesture?.scale).toBeGreaterThan(1); // zoom in
		});

		it("should detect pinch when two fingers move closer", () => {
			const now = Date.now();
			detector.onPointerDown([
				makePointer({ id: 0, x: 100, y: 200, isDown: true, time: now }),
				makePointer({ id: 1, x: 300, y: 200, isDown: true, time: now }),
			]);
			// Initial distance: 200

			const gesture = detector.onPointerMove([
				makePointer({ id: 0, x: 150, y: 200, isDown: true, time: now + 50 }),
				makePointer({ id: 1, x: 250, y: 200, isDown: true, time: now + 50 }),
			]);
			// New distance: 100

			expect(gesture?.type).toBe(GestureType.Pinch);
			expect(gesture?.scale).toBeLessThan(1); // zoom out
		});

		it("should distinguish pinch from two-finger drag based on distance change ratio", () => {
			const now = Date.now();
			// Start with fingers 100px apart
			detector.onPointerDown([
				makePointer({ id: 0, x: 150, y: 200, isDown: true, time: now }),
				makePointer({ id: 1, x: 250, y: 200, isDown: true, time: now }),
			]);

			// Move both fingers the same direction (drag, not pinch)
			const gesture = detector.onPointerMove([
				makePointer({ id: 0, x: 170, y: 220, isDown: true, time: now + 50 }),
				makePointer({ id: 1, x: 270, y: 220, isDown: true, time: now + 50 }),
			]);
			// Distance stays 100 — this is a drag, not a pinch

			expect(gesture?.type).toBe(GestureType.TwoFingerDrag);
		});
	});

	// =========================================================================
	// RESET
	// =========================================================================
	describe("reset", () => {
		it("should reset state on pointer up", () => {
			const now = Date.now();
			detector.onPointerDown([makePointer({ id: 0, x: 100, y: 100, isDown: true, time: now })]);
			detector.onPointerUp([
				makePointer({ id: 0, x: 100, y: 100, isDown: false, time: now + 100 }),
			]);

			// After reset, a new gesture should start fresh with different world coords
			detector.onPointerDown([
				makePointer({
					id: 0,
					x: 300,
					y: 300,
					worldX: 500,
					worldY: 500,
					isDown: true,
					time: now + 200,
				}),
			]);
			const gesture = detector.onPointerMove([
				makePointer({
					id: 0,
					x: 340,
					y: 340,
					worldX: 540,
					worldY: 540,
					isDown: true,
					time: now + 250,
				}),
			]);

			expect(gesture?.type).toBe(GestureType.OneFingerDrag);
			expect(gesture?.startWorldX).toBe(500); // should use the new down position, not the old one
		});
	});
});
