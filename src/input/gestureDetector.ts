/**
 * Gesture Detector — pure logic for classifying multi-touch gestures.
 *
 * No Phaser dependency. Takes abstract pointer states and returns
 * gesture classifications. Used by MobileInput to translate touch
 * events into game commands.
 *
 * Gesture types:
 * - Tap: quick touch + release, minimal movement → select unit
 * - LongPress: hold in place ≥ 400ms → move/attack command
 * - OneFingerDrag: single pointer moves beyond threshold → selection rectangle
 * - TwoFingerDrag: two pointers move in same direction → camera pan
 * - Pinch: two pointers change distance significantly → camera zoom
 */

export interface PointerState {
	id: number;
	x: number;
	y: number;
	worldX: number;
	worldY: number;
	isDown: boolean;
	time: number;
}

export enum GestureType {
	Tap = "tap",
	LongPress = "longpress",
	OneFingerDrag = "one_finger_drag",
	TwoFingerDrag = "two_finger_drag",
	Pinch = "pinch",
}

export interface GestureResult {
	type: GestureType;
	/** World-space start X (for drags) */
	startWorldX?: number;
	/** World-space start Y (for drags) */
	startWorldY?: number;
	/** World-space current X (for drags, taps, long press) */
	currentWorldX?: number;
	/** World-space current Y (for drags, taps, long press) */
	currentWorldY?: number;
	/** Screen-space delta X (for two-finger drag / camera pan) */
	deltaX?: number;
	/** Screen-space delta Y (for two-finger drag / camera pan) */
	deltaY?: number;
	/** Pinch scale ratio (>1 = zoom in, <1 = zoom out) */
	scale?: number;
}

/** Maximum movement in pixels for a touch to still count as a tap or long press. */
const TAP_MOVE_THRESHOLD = 15;

/** Minimum movement in pixels to start a drag gesture. */
const DRAG_THRESHOLD = 10;

/** Maximum hold duration in ms for a tap (longer = long press). */
const TAP_MAX_DURATION = 400;

/** Minimum hold duration in ms for a long press. */
const LONG_PRESS_MIN_DURATION = 400;

/**
 * Minimum ratio of distance-change to average-movement for a two-finger
 * gesture to be classified as a pinch rather than a pan. If the distance
 * between the two fingers changes by more than this fraction of the
 * average finger movement, it's a pinch.
 */
const PINCH_VS_DRAG_THRESHOLD = 0.4;

export class GestureDetector {
	private downPointers: PointerState[] = [];
	private downTime = 0;
	private pointerCount = 0;
	private initialDistance = 0;
	private prevMidpoint: { x: number; y: number } | null = null;
	private gestureActive = false;

	/**
	 * Call when one or more pointers go down.
	 * Pass ALL currently-down pointers (not just the new one).
	 */
	onPointerDown(pointers: PointerState[]): void {
		this.downPointers = pointers.map((p) => ({ ...p }));
		this.pointerCount = pointers.length;
		this.downTime = pointers[0].time;
		this.gestureActive = false;

		if (pointers.length === 2) {
			this.initialDistance = this.distance(pointers[0], pointers[1]);
			this.prevMidpoint = this.midpoint(pointers[0], pointers[1]);
		} else {
			this.initialDistance = 0;
			this.prevMidpoint = null;
		}
	}

	/**
	 * Call on pointer move. Pass ALL currently-down pointers.
	 * Returns a gesture if one is detected, or null.
	 */
	onPointerMove(pointers: PointerState[]): GestureResult | null {
		if (this.downPointers.length === 0) return null;

		// Two-finger gestures
		if (pointers.length >= 2 && this.downPointers.length >= 2) {
			return this.classifyTwoFingerMove(pointers);
		}

		// One-finger drag
		if (pointers.length === 1 && this.downPointers.length >= 1) {
			return this.classifyOneFingerMove(pointers[0]);
		}

		return null;
	}

	/**
	 * Call on pointer up. Pass the pointer that was released.
	 * Returns a gesture if one is detected (e.g., tap), or null.
	 */
	onPointerUp(pointers: PointerState[]): GestureResult | null {
		if (this.downPointers.length === 0) return null;

		const released = pointers[0];
		const down = this.downPointers[0];
		const duration = released.time - this.downTime;
		const movement = this.dist(down.x, down.y, released.x, released.y);

		let result: GestureResult | null = null;

		// Only classify as tap if this was a single-finger gesture that
		// never became a drag
		if (
			this.pointerCount === 1 &&
			!this.gestureActive &&
			duration <= TAP_MAX_DURATION &&
			movement <= TAP_MOVE_THRESHOLD
		) {
			result = {
				type: GestureType.Tap,
				currentWorldX: released.worldX,
				currentWorldY: released.worldY,
			};
		}

		this.reset();
		return result;
	}

	/**
	 * Call periodically (e.g., from update loop) to detect long press.
	 * Pass ALL currently-down pointers and the current timestamp.
	 */
	onHoldCheck(pointers: PointerState[], now: number): GestureResult | null {
		if (this.downPointers.length === 0 || this.gestureActive) return null;
		if (pointers.length !== 1 || this.pointerCount !== 1) return null;

		const down = this.downPointers[0];
		const current = pointers[0];
		const duration = now - this.downTime;
		const movement = this.dist(down.x, down.y, current.x, current.y);

		if (duration >= LONG_PRESS_MIN_DURATION && movement <= TAP_MOVE_THRESHOLD) {
			this.gestureActive = true;
			return {
				type: GestureType.LongPress,
				currentWorldX: current.worldX,
				currentWorldY: current.worldY,
			};
		}

		return null;
	}

	private classifyOneFingerMove(current: PointerState): GestureResult | null {
		const down = this.downPointers[0];
		const movement = this.dist(down.x, down.y, current.x, current.y);

		if (movement > DRAG_THRESHOLD) {
			this.gestureActive = true;
			return {
				type: GestureType.OneFingerDrag,
				startWorldX: down.worldX,
				startWorldY: down.worldY,
				currentWorldX: current.worldX,
				currentWorldY: current.worldY,
			};
		}

		return null;
	}

	private classifyTwoFingerMove(pointers: PointerState[]): GestureResult | null {
		const p0 = pointers[0];
		const p1 = pointers[1];

		const currentDist = this.distance(p0, p1);
		const distChange = Math.abs(currentDist - this.initialDistance);

		const currentMid = this.midpoint(p0, p1);
		const prev = this.prevMidpoint ?? currentMid;
		const midDelta = this.dist(prev.x, prev.y, currentMid.x, currentMid.y);

		// Update previous midpoint for next frame
		this.prevMidpoint = currentMid;
		this.gestureActive = true;

		// Decide: pinch or drag?
		// If the distance between fingers changed significantly relative
		// to overall movement, it's a pinch.
		const totalMovement = midDelta + distChange;
		if (totalMovement < 2) return null; // No meaningful movement

		const pinchRatio = distChange / totalMovement;

		if (pinchRatio > PINCH_VS_DRAG_THRESHOLD && this.initialDistance > 0) {
			return {
				type: GestureType.Pinch,
				scale: currentDist / this.initialDistance,
			};
		}

		return {
			type: GestureType.TwoFingerDrag,
			deltaX: currentMid.x - prev.x,
			deltaY: currentMid.y - prev.y,
		};
	}

	private reset(): void {
		this.downPointers = [];
		this.pointerCount = 0;
		this.downTime = 0;
		this.initialDistance = 0;
		this.prevMidpoint = null;
		this.gestureActive = false;
	}

	private distance(a: PointerState, b: PointerState): number {
		return this.dist(a.x, a.y, b.x, b.y);
	}

	private midpoint(a: PointerState, b: PointerState): { x: number; y: number } {
		return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
	}

	private dist(x1: number, y1: number, x2: number, y2: number): number {
		const dx = x2 - x1;
		const dy = y2 - y1;
		return Math.sqrt(dx * dx + dy * dy);
	}
}
