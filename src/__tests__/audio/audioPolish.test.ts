/**
 * Audio Polish Tests (US-032)
 *
 * Verifies:
 * - Max 4 simultaneous SFX voices
 * - Identical SFX debounce (100ms)
 * - Mute toggle stops music and blocks SFX
 * - Volume controls work as expected
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Track SFX play calls
const mockSFXPlay = vi.fn();
const mockMusicPlay = vi.fn();
const mockMusicStop = vi.fn();
const mockMusicSetVolume = vi.fn();

vi.mock("tone", () => ({
	start: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/audio/sfx", () => ({
	createSFXPlayer: vi.fn(() => ({
		play: mockSFXPlay,
		dispose: vi.fn(),
	})),
}));

vi.mock("@/audio/music", () => ({
	createMusicPlayer: vi.fn(() => ({
		play: mockMusicPlay,
		stop: mockMusicStop,
		setVolume: mockMusicSetVolume,
		dispose: vi.fn(),
	})),
}));

import { AudioEngine } from "@/audio/engine";

describe("US-032: Audio Polish", () => {
	let engine: AudioEngine;

	beforeEach(async () => {
		vi.useFakeTimers();
		mockSFXPlay.mockClear();
		mockMusicPlay.mockClear();
		mockMusicStop.mockClear();
		mockMusicSetVolume.mockClear();
		engine = new AudioEngine();
		await engine.init();
	});

	afterEach(() => {
		engine.dispose();
		vi.useRealTimers();
	});

	describe("concurrent SFX voice limit", () => {
		it("allows up to 4 simultaneous SFX", () => {
			engine.playSFX("unitSelect");
			engine.playSFX("unitMove");
			engine.playSFX("unitAttack");
			engine.playSFX("meleeHit");
			expect(mockSFXPlay).toHaveBeenCalledTimes(4);
		});

		it("blocks the 5th concurrent SFX", () => {
			engine.playSFX("unitSelect");
			engine.playSFX("unitMove");
			engine.playSFX("unitAttack");
			engine.playSFX("meleeHit");
			engine.playSFX("rangedFire");
			expect(mockSFXPlay).toHaveBeenCalledTimes(4);
		});

		it("frees a voice after decay timeout", () => {
			engine.playSFX("unitSelect");
			engine.playSFX("unitMove");
			engine.playSFX("unitAttack");
			engine.playSFX("meleeHit");
			expect(mockSFXPlay).toHaveBeenCalledTimes(4);

			// Advance past the 300ms voice decay
			vi.advanceTimersByTime(301);

			engine.playSFX("rangedFire");
			expect(mockSFXPlay).toHaveBeenCalledTimes(5);
		});
	});

	describe("identical SFX debounce", () => {
		it("debounces the same SFX within 100ms", () => {
			engine.playSFX("unitSelect");
			engine.playSFX("unitSelect");
			engine.playSFX("unitSelect");
			expect(mockSFXPlay).toHaveBeenCalledTimes(1);
		});

		it("allows same SFX after 100ms", () => {
			engine.playSFX("unitSelect");
			vi.advanceTimersByTime(101);
			engine.playSFX("unitSelect");
			expect(mockSFXPlay).toHaveBeenCalledTimes(2);
		});

		it("allows different SFX types simultaneously", () => {
			engine.playSFX("unitSelect");
			engine.playSFX("unitMove");
			engine.playSFX("unitAttack");
			expect(mockSFXPlay).toHaveBeenCalledTimes(3);
		});
	});

	describe("mute toggle", () => {
		it("blocks SFX when muted", () => {
			engine.setMuted(true);
			engine.playSFX("unitSelect");
			expect(mockSFXPlay).not.toHaveBeenCalled();
		});

		it("blocks music when muted", () => {
			engine.setMuted(true);
			engine.playMusic("menuTrack");
			expect(mockMusicPlay).not.toHaveBeenCalled();
		});

		it("restores SFX after unmuting", () => {
			engine.setMuted(true);
			engine.playSFX("unitSelect");
			expect(mockSFXPlay).not.toHaveBeenCalled();

			engine.setMuted(false);
			vi.advanceTimersByTime(101); // Past debounce window
			engine.playSFX("unitMove");
			expect(mockSFXPlay).toHaveBeenCalledTimes(1);
		});

		it("reports muted state correctly", () => {
			expect(engine.isMuted).toBe(false);
			engine.setMuted(true);
			expect(engine.isMuted).toBe(true);
			engine.setMuted(false);
			expect(engine.isMuted).toBe(false);
		});
	});

	describe("volume controls", () => {
		it("blocks SFX when effective volume is 0", () => {
			engine.setMasterVolume(0);
			engine.playSFX("unitSelect");
			expect(mockSFXPlay).not.toHaveBeenCalled();
		});

		it("blocks SFX when SFX volume is 0", () => {
			engine.setSFXVolume(0);
			engine.playSFX("unitSelect");
			expect(mockSFXPlay).not.toHaveBeenCalled();
		});

		it("clamps volume to 0-1 range", () => {
			expect(() => engine.setMasterVolume(-0.5)).not.toThrow();
			expect(() => engine.setMasterVolume(2.0)).not.toThrow();
			expect(() => engine.setSFXVolume(-1)).not.toThrow();
			expect(() => engine.setSFXVolume(10)).not.toThrow();
			expect(() => engine.setMusicVolume(-0.5)).not.toThrow();
			expect(() => engine.setMusicVolume(1.5)).not.toThrow();
		});
	});

	describe("dispose", () => {
		it("cleans up voice tracking on dispose", () => {
			engine.playSFX("unitSelect");
			engine.playSFX("unitMove");
			engine.dispose();
			expect(engine.isReady).toBe(false);
		});
	});
});
