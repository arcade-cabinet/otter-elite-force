/**
 * US-028: Day/night cycle visual overlay tests.
 *
 * Validates:
 * - Phase resolution from elapsed time
 * - Tint color/alpha values per phase
 * - Vision multiplier values per phase
 * - DayNightSystem lifecycle (overlay creation, update, destroy)
 */

import { describe, expect, it, vi } from "vitest";
import {
	DayNightSystem,
	getTint,
	getVisionMultiplier,
	resolveTimeOfDay,
	TimeOfDay,
} from "../../systems/dayNightSystem";

const TEN_MINUTES_MS = 10 * 60 * 1000;

describe("resolveTimeOfDay", () => {
	const config = { dayDurationMs: TEN_MINUTES_MS };

	it("should return DAWN at the start of a day (0%)", () => {
		expect(resolveTimeOfDay(0, config)).toBe(TimeOfDay.DAWN);
	});

	it("should return DAWN at 10% of day", () => {
		expect(resolveTimeOfDay(TEN_MINUTES_MS * 0.1, config)).toBe(TimeOfDay.DAWN);
	});

	it("should return DAY at 15% of day", () => {
		expect(resolveTimeOfDay(TEN_MINUTES_MS * 0.15, config)).toBe(TimeOfDay.DAY);
	});

	it("should return DAY at 50% of day", () => {
		expect(resolveTimeOfDay(TEN_MINUTES_MS * 0.5, config)).toBe(TimeOfDay.DAY);
	});

	it("should return DUSK at 60% of day", () => {
		expect(resolveTimeOfDay(TEN_MINUTES_MS * 0.6, config)).toBe(TimeOfDay.DUSK);
	});

	it("should return DUSK at 70% of day", () => {
		expect(resolveTimeOfDay(TEN_MINUTES_MS * 0.7, config)).toBe(TimeOfDay.DUSK);
	});

	it("should return NIGHT at 75% of day", () => {
		expect(resolveTimeOfDay(TEN_MINUTES_MS * 0.75, config)).toBe(TimeOfDay.NIGHT);
	});

	it("should return NIGHT at 90% of day", () => {
		expect(resolveTimeOfDay(TEN_MINUTES_MS * 0.9, config)).toBe(TimeOfDay.NIGHT);
	});

	it("should wrap around to DAWN on second day", () => {
		expect(resolveTimeOfDay(TEN_MINUTES_MS * 1.05, config)).toBe(TimeOfDay.DAWN);
	});

	it("should handle custom day duration", () => {
		const shortDay = { dayDurationMs: 1000 };
		expect(resolveTimeOfDay(750, shortDay)).toBe(TimeOfDay.NIGHT);
		expect(resolveTimeOfDay(300, shortDay)).toBe(TimeOfDay.DAY);
	});
});

describe("getTint", () => {
	it("DAWN should have warm orange at 5% opacity", () => {
		const tint = getTint(TimeOfDay.DAWN);
		expect(tint.color).toBe(0xff9933);
		expect(tint.alpha).toBe(0.05);
	});

	it("DAY should have 0% opacity (clear)", () => {
		const tint = getTint(TimeOfDay.DAY);
		expect(tint.alpha).toBe(0.0);
	});

	it("DUSK should have warm red at 10% opacity", () => {
		const tint = getTint(TimeOfDay.DUSK);
		expect(tint.color).toBe(0xcc3300);
		expect(tint.alpha).toBe(0.1);
	});

	it("NIGHT should have blue at 25% opacity", () => {
		const tint = getTint(TimeOfDay.NIGHT);
		expect(tint.color).toBe(0x001133);
		expect(tint.alpha).toBe(0.25);
	});

	it("should return a copy (not the original reference)", () => {
		const a = getTint(TimeOfDay.DAWN);
		const b = getTint(TimeOfDay.DAWN);
		expect(a).not.toBe(b);
		expect(a).toEqual(b);
	});
});

describe("getVisionMultiplier", () => {
	it("DAWN should reduce vision slightly (0.85)", () => {
		expect(getVisionMultiplier(TimeOfDay.DAWN)).toBe(0.85);
	});

	it("DAY should have full vision (1.0)", () => {
		expect(getVisionMultiplier(TimeOfDay.DAY)).toBe(1.0);
	});

	it("DUSK should reduce vision moderately (0.9)", () => {
		expect(getVisionMultiplier(TimeOfDay.DUSK)).toBe(0.9);
	});

	it("NIGHT should reduce vision significantly (0.6)", () => {
		expect(getVisionMultiplier(TimeOfDay.NIGHT)).toBe(0.6);
	});
});

describe("DayNightSystem", () => {
	function createMockScene() {
		const mockGraphics = {
			setDepth: vi.fn(),
			setScrollFactor: vi.fn(),
			setVisible: vi.fn(),
			clear: vi.fn(),
			fillStyle: vi.fn(),
			fillRect: vi.fn(),
			destroy: vi.fn(),
		};

		return {
			add: {
				graphics: vi.fn(() => mockGraphics),
			},
			cameras: {
				main: { width: 1280, height: 720 },
			},
			_mockGraphics: mockGraphics,
		} as unknown as {
			add: { graphics: ReturnType<typeof vi.fn> };
			cameras: { main: { width: number; height: number } };
			_mockGraphics: typeof mockGraphics;
		};
	}

	it("should start at DAWN phase", () => {
		const system = new DayNightSystem(null);
		expect(system.currentPhase).toBe(TimeOfDay.DAWN);
		system.destroy();
	});

	it("should update phase based on elapsed time", () => {
		const system = new DayNightSystem(null);

		// 50% of day -> DAY
		system.update(TEN_MINUTES_MS * 0.5);
		expect(system.currentPhase).toBe(TimeOfDay.DAY);

		// 80% of day -> NIGHT
		system.update(TEN_MINUTES_MS * 0.8);
		expect(system.currentPhase).toBe(TimeOfDay.NIGHT);

		system.destroy();
	});

	it("should expose vision multiplier for current phase", () => {
		const system = new DayNightSystem(null);

		system.update(TEN_MINUTES_MS * 0.5); // DAY
		expect(system.visionMultiplier).toBe(1.0);

		system.update(TEN_MINUTES_MS * 0.8); // NIGHT
		expect(system.visionMultiplier).toBe(0.6);

		system.destroy();
	});

	it("should allow forcing a phase with setPhase", () => {
		const system = new DayNightSystem(null);

		system.setPhase(TimeOfDay.NIGHT);
		expect(system.currentPhase).toBe(TimeOfDay.NIGHT);
		expect(system.visionMultiplier).toBe(0.6);

		system.destroy();
	});

	it("should not re-apply overlay when phase does not change", () => {
		const scene = createMockScene();
		const system = new DayNightSystem(scene);

		// Force to NIGHT
		system.setPhase(TimeOfDay.NIGHT);
		const callCountAfterSet = scene._mockGraphics.fillStyle.mock.calls.length;

		// setPhase to same phase should be a no-op
		system.setPhase(TimeOfDay.NIGHT);
		expect(scene._mockGraphics.fillStyle.mock.calls.length).toBe(callCountAfterSet);

		system.destroy();
	});

	it("should create Phaser overlay when scene is provided", () => {
		const scene = createMockScene();
		const system = new DayNightSystem(scene);

		expect(scene.add.graphics).toHaveBeenCalled();
		expect(scene._mockGraphics.setDepth).toHaveBeenCalledWith(980);
		expect(scene._mockGraphics.setScrollFactor).toHaveBeenCalledWith(0);
		expect(scene._mockGraphics.setVisible).toHaveBeenCalledWith(false);

		system.destroy();
	});

	it("should apply tint color to overlay when phase has alpha > 0", () => {
		const scene = createMockScene();
		const system = new DayNightSystem(scene);

		// Transition to NIGHT (alpha 0.25)
		system.update(TEN_MINUTES_MS * 0.8);

		expect(scene._mockGraphics.fillStyle).toHaveBeenCalledWith(0x001133, 0.25);
		expect(scene._mockGraphics.fillRect).toHaveBeenCalledWith(0, 0, 1280, 720);
		expect(scene._mockGraphics.setVisible).toHaveBeenCalledWith(true);

		system.destroy();
	});

	it("should hide overlay during DAY phase (alpha 0)", () => {
		const scene = createMockScene();
		const system = new DayNightSystem(scene);

		// First go to NIGHT
		system.update(TEN_MINUTES_MS * 0.8);
		// Then transition to DAY
		system.update(TEN_MINUTES_MS * 0.3);

		// Last setVisible call should be false (for DAY)
		const calls = scene._mockGraphics.setVisible.mock.calls;
		expect(calls[calls.length - 1][0]).toBe(false);

		system.destroy();
	});

	it("should clean up overlay on destroy", () => {
		const scene = createMockScene();
		const system = new DayNightSystem(scene);

		system.destroy();

		expect(scene._mockGraphics.destroy).toHaveBeenCalled();
	});

	it("should accept custom day duration config", () => {
		const system = new DayNightSystem(null, { dayDurationMs: 2000 });

		// 50% of 2s day = 1000ms -> DAY
		system.update(1000);
		expect(system.currentPhase).toBe(TimeOfDay.DAY);

		// 80% of 2s day = 1600ms -> NIGHT
		system.update(1600);
		expect(system.currentPhase).toBe(TimeOfDay.NIGHT);

		system.destroy();
	});

	it("should cycle back to DAWN after a full day", () => {
		const system = new DayNightSystem(null, { dayDurationMs: 1000 });

		system.update(950); // NIGHT (95%)
		expect(system.currentPhase).toBe(TimeOfDay.NIGHT);

		system.update(1050); // 5% into next day -> DAWN
		expect(system.currentPhase).toBe(TimeOfDay.DAWN);

		system.destroy();
	});
});
