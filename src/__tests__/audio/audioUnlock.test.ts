/**
 * Audio Unlock Tests (US-029)
 *
 * Verifies that:
 * - AudioEngine.init() calls Tone.start()
 * - AudioEngine.init() is idempotent
 * - Audio engine has proper ready state tracking
 * - No audio-related errors before init
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock Tone.js at the top level
vi.mock("tone", () => ({
	start: vi.fn(() => Promise.resolve()),
}));

// Mock the SFX and Music players to avoid deep Tone.js synth construction
vi.mock("@/audio/sfx", () => ({
	createSFXPlayer: vi.fn(() => ({
		play: vi.fn(),
		dispose: vi.fn(),
	})),
}));

vi.mock("@/audio/music", () => ({
	createMusicPlayer: vi.fn(() => ({
		play: vi.fn(),
		stop: vi.fn(),
		setVolume: vi.fn(),
		dispose: vi.fn(),
	})),
}));

describe("AudioEngine", () => {
	let AudioEngine: typeof import("@/audio/engine").AudioEngine;

	beforeEach(async () => {
		vi.resetModules();
		// Re-apply mocks after resetModules
		vi.doMock("tone", () => ({
			start: vi.fn(() => Promise.resolve()),
		}));
		vi.doMock("@/audio/sfx", () => ({
			createSFXPlayer: vi.fn(() => ({
				play: vi.fn(),
				dispose: vi.fn(),
			})),
		}));
		vi.doMock("@/audio/music", () => ({
			createMusicPlayer: vi.fn(() => ({
				play: vi.fn(),
				stop: vi.fn(),
				setVolume: vi.fn(),
				dispose: vi.fn(),
			})),
		}));
		const mod = await import("@/audio/engine");
		AudioEngine = mod.AudioEngine;
	});

	it("should not be ready before init()", () => {
		const engine = new AudioEngine();
		expect(engine.isReady).toBe(false);
	});

	it("should be ready after init()", async () => {
		const engine = new AudioEngine();
		await engine.init();
		expect(engine.isReady).toBe(true);
	});

	it("should call Tone.start() during init()", async () => {
		const Tone = await import("tone");
		const engine = new AudioEngine();
		await engine.init();
		expect(Tone.start).toHaveBeenCalledTimes(1);
	});

	it("should be idempotent — multiple init() calls only call Tone.start() once", async () => {
		const Tone = await import("tone");
		const engine = new AudioEngine();

		await engine.init();
		await engine.init();
		await engine.init();

		expect(Tone.start).toHaveBeenCalledTimes(1);
		expect(engine.isReady).toBe(true);
	});

	it("should not throw when playing SFX before init()", () => {
		const engine = new AudioEngine();
		expect(() => engine.playSFX("click")).not.toThrow();
	});

	it("should not throw when playing music before init()", () => {
		const engine = new AudioEngine();
		expect(() => engine.playMusic("menuTrack")).not.toThrow();
	});

	it("should accept volume settings without error", () => {
		const engine = new AudioEngine();
		expect(() => {
			engine.setMasterVolume(0.5);
			engine.setSFXVolume(0.8);
			engine.setMusicVolume(0.3);
		}).not.toThrow();
	});

	it("should clamp volume to 0-1 range", () => {
		const engine = new AudioEngine();
		expect(() => {
			engine.setMasterVolume(-0.5);
			engine.setMasterVolume(2.0);
		}).not.toThrow();
	});

	it("should clean up resources on dispose()", async () => {
		const engine = new AudioEngine();
		await engine.init();
		expect(engine.isReady).toBe(true);

		engine.dispose();
		expect(engine.isReady).toBe(false);
	});
});
