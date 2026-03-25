/**
 * Weather System — gameplay modifiers for weather states.
 *
 * Weather is expressed through:
 * - Scenario triggers setting the WeatherCondition ECS trait
 * - Dialogue telling the player what's happening ("Monsoon incoming!")
 * - Terrain changes (flood zones converting grass → water)
 * - These gameplay modifiers reducing vision/accuracy/speed
 *
 * NO visual rendering — the player understands weather through
 * narrative, terrain design, and stat changes, not rain particles.
 */

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

/** Get gameplay modifiers for a weather state. */
export function getWeatherModifiers(state: string): WeatherModifiers {
	return MODIFIERS[state as WeatherState] ?? MODIFIERS[WeatherState.CLEAR];
}

/**
 * Minimal WeatherSystem class for backward compatibility with game loop.
 * Tracks a schedule of weather changes and advances through them.
 */
export class WeatherSystem {
	private schedule: Array<{ time: number; state: WeatherState }> = [];
	private elapsedTime = 0;
	private scheduleIndex = 0;
	private _currentState: WeatherState = WeatherState.CLEAR;

	get currentState(): WeatherState {
		return this._currentState;
	}

	getModifiers(): WeatherModifiers {
		return getWeatherModifiers(this._currentState);
	}

	setState(state: WeatherState): boolean {
		if (state === this._currentState) return false;
		this._currentState = state;
		return true;
	}

	setSchedule(entries: Array<{ time: number; state: WeatherState }>): void {
		this.schedule = [...entries].sort((a, b) => a.time - b.time);
		this.scheduleIndex = 0;
	}

	updateSchedule(deltaSec: number): void {
		this.elapsedTime += deltaSec;
		while (
			this.scheduleIndex < this.schedule.length &&
			this.elapsedTime >= this.schedule[this.scheduleIndex].time
		) {
			this.setState(this.schedule[this.scheduleIndex].state);
			this.scheduleIndex++;
		}
	}

	destroy(): void {
		// No visual resources to clean up
	}
}
