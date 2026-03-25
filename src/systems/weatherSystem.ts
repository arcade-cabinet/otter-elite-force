/**
 * Weather System — visual effects and gameplay modifiers for weather states.
 *
 * Spec §8.6:
 *   CLEAR:   Normal visibility and unit stats
 *   RAIN:    Visibility -30%, ranged accuracy -20%
 *   MONSOON: Visibility -60%, ranged accuracy -40%, movement speed -15%
 *
 * Visual effects (Phaser):
 *   RAIN:    ParticleEmitter with downward rain drops + screen darkening (alpha 0.15)
 *   MONSOON: Heavier particles + alpha 0.35 + camera shake
 */

import type Phaser from "phaser";

export enum WeatherState {
	CLEAR = "clear",
	RAIN = "rain",
	MONSOON = "monsoon",
}

export interface WeatherModifiers {
	visibilityMultiplier: number;
	rangedAccuracyMultiplier: number;
	movementSpeedMultiplier: number;
}

export interface WeatherScheduleEntry {
	/** Time in seconds from mission start when this weather begins */
	time: number;
	state: WeatherState;
}

const MODIFIERS: Record<WeatherState, WeatherModifiers> = {
	[WeatherState.CLEAR]: {
		visibilityMultiplier: 1.0,
		rangedAccuracyMultiplier: 1.0,
		movementSpeedMultiplier: 1.0,
	},
	[WeatherState.RAIN]: {
		visibilityMultiplier: 0.7,
		rangedAccuracyMultiplier: 0.8,
		movementSpeedMultiplier: 1.0,
	},
	[WeatherState.MONSOON]: {
		visibilityMultiplier: 0.4,
		rangedAccuracyMultiplier: 0.6,
		movementSpeedMultiplier: 0.85,
	},
};

const OVERLAY_ALPHA: Record<WeatherState, number> = {
	[WeatherState.CLEAR]: 0,
	[WeatherState.RAIN]: 0.15,
	[WeatherState.MONSOON]: 0.35,
};

export class WeatherSystem {
	private scene: Phaser.Scene | null;
	private _currentState: WeatherState = WeatherState.CLEAR;
	private schedule: WeatherScheduleEntry[] = [];
	private elapsedTime = 0;
	private scheduleIndex = 0;

	// Phaser visual objects (null when running headless/tests)
	private overlay: Phaser.GameObjects.Graphics | null = null;
	private rainEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

	constructor(scene: Phaser.Scene | null) {
		this.scene = scene;

		if (scene) {
			this.createVisuals(scene);
		}
	}

	get currentState(): WeatherState {
		return this._currentState;
	}

	/**
	 * Transition to a new weather state. Returns false if already in that state.
	 */
	setState(state: WeatherState): boolean {
		if (state === this._currentState) return false;
		this._currentState = state;
		this.applyVisuals();
		return true;
	}

	/** Get the current gameplay modifiers for the active weather state. */
	getModifiers(): WeatherModifiers {
		return { ...MODIFIERS[this._currentState] };
	}

	/** Get the overlay alpha for the current weather state. */
	getOverlayAlpha(): number {
		return OVERLAY_ALPHA[this._currentState];
	}

	/**
	 * Set a weather schedule for the mission.
	 * Entries must be sorted by time ascending.
	 */
	setSchedule(schedule: WeatherScheduleEntry[]): void {
		this.schedule = schedule;
		this.elapsedTime = 0;
		this.scheduleIndex = 0;

		// Apply initial state if schedule starts at time 0
		if (schedule.length > 0 && schedule[0].time === 0) {
			this.setState(schedule[0].state);
			this.scheduleIndex = 1;
		}
	}

	/**
	 * Advance the weather schedule by delta seconds.
	 * Call from GameScene.update() with delta/1000.
	 */
	updateSchedule(deltaSeconds: number): void {
		this.elapsedTime += deltaSeconds;

		while (
			this.scheduleIndex < this.schedule.length &&
			this.elapsedTime >= this.schedule[this.scheduleIndex].time
		) {
			this.setState(this.schedule[this.scheduleIndex].state);
			this.scheduleIndex++;
		}
	}

	destroy(): void {
		this.overlay?.destroy();
		this.rainEmitter?.destroy();
		this.overlay = null;
		this.rainEmitter = null;
	}

	// --- Phaser visual effects (only when scene is available) ---

	private createVisuals(scene: Phaser.Scene): void {
		// Screen darkening overlay — fills entire camera viewport
		this.overlay = scene.add.graphics();
		this.overlay.setDepth(900); // Below fog (1000), above game objects
		this.overlay.setScrollFactor(0); // Fixed to camera
		this.overlay.setVisible(false);

		// Rain particle emitter — configure but leave inactive
		this.rainEmitter = scene.add.particles(0, 0, "__DEFAULT", {
			x: { min: 0, max: scene.cameras.main.width },
			y: -10,
			speedY: { min: 200, max: 400 },
			speedX: { min: -30, max: -10 },
			scaleX: 0.5,
			scaleY: 2,
			quantity: 0,
			lifespan: 2000,
			tint: 0x8899aa,
			alpha: { start: 0.6, end: 0 },
			blendMode: "ADD",
		});
		this.rainEmitter.setDepth(950);
		this.rainEmitter.setScrollFactor(0);
		this.rainEmitter.stop();
	}

	private applyVisuals(): void {
		if (!this.scene) return;

		const alpha = this.getOverlayAlpha();

		// Update darkening overlay
		if (this.overlay) {
			this.overlay.clear();
			if (alpha > 0) {
				const { width, height } = this.scene.cameras.main;
				this.overlay.fillStyle(0x000011, alpha);
				this.overlay.fillRect(0, 0, width, height);
				this.overlay.setVisible(true);
			} else {
				this.overlay.setVisible(false);
			}
		}

		// Update rain particles
		if (this.rainEmitter) {
			switch (this._currentState) {
				case WeatherState.CLEAR:
					this.rainEmitter.stop();
					break;
				case WeatherState.RAIN:
					this.rainEmitter.setQuantity(3);
					this.rainEmitter.start();
					break;
				case WeatherState.MONSOON:
					this.rainEmitter.setQuantity(8);
					this.rainEmitter.start();
					break;
			}
		}

		// Camera shake for monsoon
		if (this._currentState === WeatherState.MONSOON) {
			this.scene.cameras.main.shake(500, 0.002, false);
		}
	}
}
