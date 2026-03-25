import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { WeatherState, WeatherSystem } from "../../systems/weatherSystem";

describe("WeatherSystem", () => {
	let weather: WeatherSystem;

	beforeEach(() => {
		// Create without a Phaser scene — pure logic tests
		weather = new WeatherSystem(null);
	});

	afterEach(() => {
		weather.destroy();
	});

	describe("initial state", () => {
		it("should start in CLEAR state", () => {
			expect(weather.currentState).toBe(WeatherState.CLEAR);
		});
	});

	describe("state transitions", () => {
		it("should transition from CLEAR to RAIN", () => {
			weather.setState(WeatherState.RAIN);
			expect(weather.currentState).toBe(WeatherState.RAIN);
		});

		it("should transition from CLEAR to MONSOON", () => {
			weather.setState(WeatherState.MONSOON);
			expect(weather.currentState).toBe(WeatherState.MONSOON);
		});

		it("should transition from RAIN to MONSOON", () => {
			weather.setState(WeatherState.RAIN);
			weather.setState(WeatherState.MONSOON);
			expect(weather.currentState).toBe(WeatherState.MONSOON);
		});

		it("should transition from MONSOON back to CLEAR", () => {
			weather.setState(WeatherState.MONSOON);
			weather.setState(WeatherState.CLEAR);
			expect(weather.currentState).toBe(WeatherState.CLEAR);
		});

		it("should not transition to same state", () => {
			weather.setState(WeatherState.RAIN);
			const result = weather.setState(WeatherState.RAIN);
			expect(result).toBe(false);
		});
	});

	describe("gameplay modifiers", () => {
		it("CLEAR: no modifiers applied", () => {
			const mods = weather.getModifiers();
			expect(mods.visibilityMultiplier).toBe(1.0);
			expect(mods.rangedAccuracyMultiplier).toBe(1.0);
			expect(mods.movementSpeedMultiplier).toBe(1.0);
		});

		it("RAIN: visibility -30%, accuracy -20%", () => {
			weather.setState(WeatherState.RAIN);
			const mods = weather.getModifiers();
			expect(mods.visibilityMultiplier).toBeCloseTo(0.7);
			expect(mods.rangedAccuracyMultiplier).toBeCloseTo(0.8);
			expect(mods.movementSpeedMultiplier).toBe(1.0);
		});

		it("MONSOON: visibility -60%, accuracy -40%, speed -15%", () => {
			weather.setState(WeatherState.MONSOON);
			const mods = weather.getModifiers();
			expect(mods.visibilityMultiplier).toBeCloseTo(0.4);
			expect(mods.rangedAccuracyMultiplier).toBeCloseTo(0.6);
			expect(mods.movementSpeedMultiplier).toBeCloseTo(0.85);
		});
	});

	describe("scheduled weather changes", () => {
		it("should accept a weather schedule", () => {
			weather.setSchedule([
				{ time: 0, state: WeatherState.CLEAR },
				{ time: 60, state: WeatherState.RAIN },
				{ time: 180, state: WeatherState.MONSOON },
				{ time: 300, state: WeatherState.CLEAR },
			]);

			expect(weather.currentState).toBe(WeatherState.CLEAR);
		});

		it("should advance through schedule based on elapsed time", () => {
			weather.setSchedule([
				{ time: 0, state: WeatherState.CLEAR },
				{ time: 60, state: WeatherState.RAIN },
				{ time: 180, state: WeatherState.MONSOON },
			]);

			// Simulate time passing (seconds)
			weather.updateSchedule(30);
			expect(weather.currentState).toBe(WeatherState.CLEAR);

			weather.updateSchedule(35); // total: 65s
			expect(weather.currentState).toBe(WeatherState.RAIN);

			weather.updateSchedule(120); // total: 185s
			expect(weather.currentState).toBe(WeatherState.MONSOON);
		});

		it("should stay at last scheduled state after schedule ends", () => {
			weather.setSchedule([
				{ time: 0, state: WeatherState.CLEAR },
				{ time: 10, state: WeatherState.RAIN },
			]);

			weather.updateSchedule(100);
			expect(weather.currentState).toBe(WeatherState.RAIN);
		});
	});

	describe("overlay alpha values", () => {
		it("CLEAR: alpha 0", () => {
			expect(weather.getOverlayAlpha()).toBe(0);
		});

		it("RAIN: alpha 0.15", () => {
			weather.setState(WeatherState.RAIN);
			expect(weather.getOverlayAlpha()).toBeCloseTo(0.15);
		});

		it("MONSOON: alpha 0.35", () => {
			weather.setState(WeatherState.MONSOON);
			expect(weather.getOverlayAlpha()).toBeCloseTo(0.35);
		});
	});
});
