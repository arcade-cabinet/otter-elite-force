/**
 * US-F08 — Audio Runtime Tests
 *
 * Tests the non-React audio runtime wrapper.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGameWorld } from "../world/gameWorld";

// We need to mock the audio engine since Tone.js requires a browser audio context
vi.mock("@/audio/engine", () => {
	let _ready = false;
	let _masterVolume = 1;
	let _sfxVolume = 1;
	let _musicVolume = 0.6;
	let _muted = false;
	let _lastMusic: string | null = null;
	let _lastSfx: string | null = null;
	let _musicStopped = false;

	const mockEngine = {
		get isReady() {
			return _ready;
		},
		async init() {
			_ready = true;
		},
		setMasterVolume(v: number) {
			_masterVolume = v;
		},
		setSFXVolume(v: number) {
			_sfxVolume = v;
		},
		setMusicVolume(v: number) {
			_musicVolume = v;
		},
		setMuted(m: boolean) {
			_muted = m;
		},
		get isMuted() {
			return _muted;
		},
		playMusic(track: string) {
			_lastMusic = track;
			_musicStopped = false;
		},
		stopMusic() {
			_musicStopped = true;
			_lastMusic = null;
		},
		stopAll() {
			_musicStopped = true;
		},
		playSFX(type: string) {
			_lastSfx = type;
		},
		dispose() {
			_ready = false;
			_lastMusic = null;
			_lastSfx = null;
		},
		// Test helpers
		_getState() {
			return {
				ready: _ready,
				masterVolume: _masterVolume,
				sfxVolume: _sfxVolume,
				musicVolume: _musicVolume,
				muted: _muted,
				lastMusic: _lastMusic,
				lastSfx: _lastSfx,
				musicStopped: _musicStopped,
			};
		},
		_reset() {
			_ready = false;
			_masterVolume = 1;
			_sfxVolume = 1;
			_musicVolume = 0.6;
			_muted = false;
			_lastMusic = null;
			_lastSfx = null;
			_musicStopped = false;
		},
	};

	return { audioEngine: mockEngine, AudioEngine: class {} };
});

describe("US-F08: Audio Runtime", () => {
	beforeEach(async () => {
		// Reset module state between tests by re-importing
		const audioEngine = (await import("@/audio/engine")).audioEngine as unknown as {
			_reset: () => void;
		};
		audioEngine._reset();
	});

	it("initAudioRuntime attaches gesture listener that initializes audio on interaction", async () => {
		// Fresh import to get clean module state
		const { initAudioRuntime, isAudioReady, disposeAudioRuntime } = await import("./audioRuntime");
		disposeAudioRuntime();

		expect(isAudioReady()).toBe(false);

		initAudioRuntime();

		// Simulate user gesture
		document.dispatchEvent(new Event("pointerdown", { bubbles: true }));

		// Wait for async initialization
		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(isAudioReady()).toBe(true);

		disposeAudioRuntime();
	});

	it("initAudioRuntime is idempotent — multiple calls do not create duplicate listeners", async () => {
		const { initAudioRuntime, disposeAudioRuntime } = await import("./audioRuntime");
		disposeAudioRuntime();

		// Should not throw
		initAudioRuntime();
		initAudioRuntime();
		initAudioRuntime();

		disposeAudioRuntime();
	});

	it("syncAudioFromWorld applies world settings to the engine", async () => {
		const { initAudioRuntime, syncAudioFromWorld, disposeAudioRuntime } = await import(
			"./audioRuntime"
		);
		disposeAudioRuntime();

		initAudioRuntime();
		document.dispatchEvent(new Event("pointerdown", { bubbles: true }));
		await new Promise((resolve) => setTimeout(resolve, 50));

		const world = createGameWorld();
		world.settings.masterVolume = 0.5;
		world.settings.musicVolume = 0.3;
		world.settings.sfxVolume = 0.7;

		syncAudioFromWorld(world);

		const engine = (await import("@/audio/engine")).audioEngine as unknown as {
			_getState: () => { masterVolume: number; musicVolume: number; sfxVolume: number };
		};
		const state = engine._getState();
		expect(state.masterVolume).toBe(0.5);
		expect(state.musicVolume).toBe(0.3);
		expect(state.sfxVolume).toBe(0.7);

		disposeAudioRuntime();
	});

	it("playBattleMusic delegates to engine with combatTrack", async () => {
		const { initAudioRuntime, playBattleMusic, disposeAudioRuntime } = await import(
			"./audioRuntime"
		);
		disposeAudioRuntime();

		initAudioRuntime();
		document.dispatchEvent(new Event("pointerdown", { bubbles: true }));
		await new Promise((resolve) => setTimeout(resolve, 50));

		playBattleMusic();

		const engine = (await import("@/audio/engine")).audioEngine as unknown as {
			_getState: () => { lastMusic: string | null };
		};
		expect(engine._getState().lastMusic).toBe("combatTrack");

		disposeAudioRuntime();
	});

	it("playMenuMusic delegates to engine with menuTrack", async () => {
		const { initAudioRuntime, playMenuMusic, disposeAudioRuntime } = await import("./audioRuntime");
		disposeAudioRuntime();

		initAudioRuntime();
		document.dispatchEvent(new Event("pointerdown", { bubbles: true }));
		await new Promise((resolve) => setTimeout(resolve, 50));

		playMenuMusic();

		const engine = (await import("@/audio/engine")).audioEngine as unknown as {
			_getState: () => { lastMusic: string | null };
		};
		expect(engine._getState().lastMusic).toBe("menuTrack");

		disposeAudioRuntime();
	});

	it("stopMusic delegates to engine stopMusic", async () => {
		const { initAudioRuntime, playBattleMusic, stopMusic, disposeAudioRuntime } = await import(
			"./audioRuntime"
		);
		disposeAudioRuntime();

		initAudioRuntime();
		document.dispatchEvent(new Event("pointerdown", { bubbles: true }));
		await new Promise((resolve) => setTimeout(resolve, 50));

		playBattleMusic();
		stopMusic();

		const engine = (await import("@/audio/engine")).audioEngine as unknown as {
			_getState: () => { musicStopped: boolean };
		};
		expect(engine._getState().musicStopped).toBe(true);

		disposeAudioRuntime();
	});

	it("playSfx delegates to engine playSFX", async () => {
		const { initAudioRuntime, playSfx, disposeAudioRuntime } = await import("./audioRuntime");
		disposeAudioRuntime();

		initAudioRuntime();
		document.dispatchEvent(new Event("pointerdown", { bubbles: true }));
		await new Promise((resolve) => setTimeout(resolve, 50));

		playSfx("unitSelect");

		const engine = (await import("@/audio/engine")).audioEngine as unknown as {
			_getState: () => { lastSfx: string | null };
		};
		expect(engine._getState().lastSfx).toBe("unitSelect");

		disposeAudioRuntime();
	});

	it("does not crash if audio engine is not ready when calling playback functions", async () => {
		const {
			playBattleMusic,
			playMenuMusic,
			stopMusic,
			playSfx,
			syncAudioFromWorld,
			disposeAudioRuntime,
		} = await import("./audioRuntime");
		disposeAudioRuntime();

		const world = createGameWorld();

		// None of these should throw when engine is not initialized
		expect(() => playBattleMusic()).not.toThrow();
		expect(() => playMenuMusic()).not.toThrow();
		expect(() => stopMusic()).not.toThrow();
		expect(() => playSfx("unitSelect")).not.toThrow();
		expect(() => syncAudioFromWorld(world)).not.toThrow();
	});

	it("disposeAudioRuntime resets all state", async () => {
		const { initAudioRuntime, isAudioReady, disposeAudioRuntime } = await import("./audioRuntime");
		disposeAudioRuntime();

		initAudioRuntime();
		document.dispatchEvent(new Event("pointerdown", { bubbles: true }));
		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(isAudioReady()).toBe(true);

		disposeAudioRuntime();

		expect(isAudioReady()).toBe(false);
	});
});
