/**
 * Day/Night Cycle System — Phaser overlay with semi-transparent color tint.
 *
 * US-028: Visual overlay tied to GameClock singleton.
 *
 * Time-of-day phases and their tint properties:
 *   DAWN:  warm orange, 5% opacity
 *   DAY:   clear, 0% opacity
 *   DUSK:  warm red, 10% opacity
 *   NIGHT: blue, 25% opacity
 *
 * One in-game day is configurable (default: 10 real minutes).
 * Night reduces fog-of-war vision radius via a multiplier.
 */

import type Phaser from "phaser";

/** Time-of-day phase identifiers. */
export enum TimeOfDay {
	DAWN = "dawn",
	DAY = "day",
	DUSK = "dusk",
	NIGHT = "night",
}

/** Visual properties for each time-of-day phase. */
export interface DayNightTint {
	color: number;
	alpha: number;
}

/** Configuration for the day/night cycle. */
export interface DayNightConfig {
	/** Duration of one in-game day in real milliseconds. Default: 600_000 (10 min). */
	dayDurationMs: number;
}

const DEFAULT_CONFIG: DayNightConfig = {
	dayDurationMs: 10 * 60 * 1000, // 10 real minutes = 1 in-game day
};

/**
 * Tint definitions per phase.
 * Dawn: warm orange (5% opacity)
 * Day: clear (0%)
 * Dusk: warm red (10% opacity)
 * Night: blue (25% opacity)
 */
const TINTS: Record<TimeOfDay, DayNightTint> = {
	[TimeOfDay.DAWN]: { color: 0xff9933, alpha: 0.05 },
	[TimeOfDay.DAY]: { color: 0x000000, alpha: 0.0 },
	[TimeOfDay.DUSK]: { color: 0xcc3300, alpha: 0.1 },
	[TimeOfDay.NIGHT]: { color: 0x001133, alpha: 0.25 },
};

/**
 * Phase boundaries as fractions of one in-game day.
 * Dawn:  0.00 – 0.15 (dawn)
 * Day:   0.15 – 0.60 (day)
 * Dusk:  0.60 – 0.75 (dusk)
 * Night: 0.75 – 1.00 (night)
 */
const PHASE_RANGES: Array<{ start: number; end: number; phase: TimeOfDay }> = [
	{ start: 0.0, end: 0.15, phase: TimeOfDay.DAWN },
	{ start: 0.15, end: 0.6, phase: TimeOfDay.DAY },
	{ start: 0.6, end: 0.75, phase: TimeOfDay.DUSK },
	{ start: 0.75, end: 1.0, phase: TimeOfDay.NIGHT },
];

/**
 * Vision radius multiplier per phase.
 * Night reduces fog-of-war vision radius.
 */
const VISION_MULTIPLIERS: Record<TimeOfDay, number> = {
	[TimeOfDay.DAWN]: 0.85,
	[TimeOfDay.DAY]: 1.0,
	[TimeOfDay.DUSK]: 0.9,
	[TimeOfDay.NIGHT]: 0.6,
};

/**
 * Resolve the current time-of-day phase from elapsed game time.
 */
export function resolveTimeOfDay(elapsedMs: number, config: DayNightConfig = DEFAULT_CONFIG): TimeOfDay {
	const dayProgress = (elapsedMs % config.dayDurationMs) / config.dayDurationMs;

	for (const range of PHASE_RANGES) {
		if (dayProgress >= range.start && dayProgress < range.end) {
			return range.phase;
		}
	}

	// Edge case: dayProgress === 1.0 wraps to dawn
	return TimeOfDay.DAWN;
}

/**
 * Get the tint properties for a given time-of-day phase.
 */
export function getTint(phase: TimeOfDay): DayNightTint {
	return { ...TINTS[phase] };
}

/**
 * Get the vision radius multiplier for a given time-of-day phase.
 * Night values reduce fog-of-war vision radius.
 */
export function getVisionMultiplier(phase: TimeOfDay): number {
	return VISION_MULTIPLIERS[phase];
}

/**
 * Day/Night Cycle System — manages the Phaser overlay and vision effects.
 */
export class DayNightSystem {
	private scene: Phaser.Scene | null;
	private overlay: Phaser.GameObjects.Graphics | null = null;
	private _currentPhase: TimeOfDay = TimeOfDay.DAWN;
	private config: DayNightConfig;

	constructor(scene: Phaser.Scene | null, config: Partial<DayNightConfig> = {}) {
		this.scene = scene;
		this.config = { ...DEFAULT_CONFIG, ...config };

		if (scene) {
			this.createOverlay(scene);
		}
	}

	/** Current time-of-day phase. */
	get currentPhase(): TimeOfDay {
		return this._currentPhase;
	}

	/** Current vision radius multiplier (for fog-of-war integration). */
	get visionMultiplier(): number {
		return VISION_MULTIPLIERS[this._currentPhase];
	}

	/**
	 * Update the day/night cycle based on elapsed game time (ms).
	 * Call from the game loop with the current GameClock.elapsedMs.
	 */
	update(elapsedMs: number): void {
		const newPhase = resolveTimeOfDay(elapsedMs, this.config);

		if (newPhase !== this._currentPhase) {
			this._currentPhase = newPhase;
			this.applyOverlay();
		}
	}

	/** Force a specific phase (useful for testing or scripted sequences). */
	setPhase(phase: TimeOfDay): void {
		if (phase === this._currentPhase) return;
		this._currentPhase = phase;
		this.applyOverlay();
	}

	destroy(): void {
		this.overlay?.destroy();
		this.overlay = null;
	}

	// --- Internal Phaser rendering ---

	private createOverlay(scene: Phaser.Scene): void {
		this.overlay = scene.add.graphics();
		this.overlay.setDepth(980); // Below fog (1000), above weather (900)
		this.overlay.setScrollFactor(0); // Fixed to camera
		this.overlay.setVisible(false);
	}

	private applyOverlay(): void {
		if (!this.scene || !this.overlay) return;

		const tint = TINTS[this._currentPhase];
		this.overlay.clear();

		if (tint.alpha > 0) {
			const { width, height } = this.scene.cameras.main;
			this.overlay.fillStyle(tint.color, tint.alpha);
			this.overlay.fillRect(0, 0, width, height);
			this.overlay.setVisible(true);
		} else {
			this.overlay.setVisible(false);
		}
	}
}
