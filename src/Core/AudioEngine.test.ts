import { beforeEach, describe, expect, it, vi } from "vitest";
import { AudioEngine } from "./AudioEngine";

// Mock the strata audio-synth module
vi.mock("@strata-game-library/audio-synth", () => {
	const mockManager = {
		init: vi.fn().mockResolvedValue(undefined),
		isReady: vi.fn().mockReturnValue(false),
		playSFX: vi.fn(),
		playMusic: vi.fn(),
		stopMusic: vi.fn(),
		stopAll: vi.fn(),
		setMasterVolume: vi.fn(),
		dispose: vi.fn(),
	};

	// Track initialization state
	let initialized = false;
	mockManager.init.mockImplementation(async () => {
		initialized = true;
	});
	mockManager.isReady.mockImplementation(() => initialized);
	mockManager.dispose.mockImplementation(() => {
		initialized = false;
	});
	mockManager.stopAll.mockImplementation(() => {
		// Just reset state, don't throw
	});

	return {
		createSynthManager: vi.fn(() => mockManager),
		AudioSynthProvider: vi.fn(),
		useAudioSynth: vi.fn(),
		usePlaySFX: vi.fn(),
		usePlayMusic: vi.fn(),
	};
});

describe("AudioEngine", () => {
	let audioEngine: AudioEngine;

	beforeEach(() => {
		vi.clearAllMocks();
		audioEngine = new AudioEngine();
	});

	it("should initialize correctly", async () => {
		expect(audioEngine.isReady()).toBe(false);
		await audioEngine.init();
		expect(audioEngine.isReady()).toBe(true);
	});

	it("should not throw when playing sounds before initialization", () => {
		// Strata manager handles uninitialized state gracefully
		expect(() => audioEngine.playSFX("shoot")).not.toThrow();
	});

	it("should cleanup on dispose", async () => {
		await audioEngine.init();
		audioEngine.dispose();
		expect(audioEngine.isReady()).toBe(false);
	});

	it("should play shoot SFX after initialization", async () => {
		await audioEngine.init();
		expect(() => audioEngine.playSFX("shoot")).not.toThrow();
	});

	it("should play hit SFX after initialization", async () => {
		await audioEngine.init();
		expect(() => audioEngine.playSFX("hit")).not.toThrow();
	});

	it("should play pickup SFX after initialization", async () => {
		await audioEngine.init();
		expect(() => audioEngine.playSFX("pickup")).not.toThrow();
	});

	it("should play explode SFX after initialization", async () => {
		await audioEngine.init();
		expect(() => audioEngine.playSFX("explode")).not.toThrow();
	});

	it("should handle multiple init calls gracefully", async () => {
		await audioEngine.init();
		await audioEngine.init();
		await audioEngine.init();
		expect(audioEngine.isReady()).toBe(true);
	});

	it("should handle dispose when not initialized", () => {
		expect(() => audioEngine.dispose()).not.toThrow();
	});

	it("should handle stopAll when not initialized", () => {
		expect(() => audioEngine.stopAll()).not.toThrow();
	});

	it("should play music", async () => {
		await audioEngine.init();
		expect(() => audioEngine.playMusic("menu")).not.toThrow();
		expect(() => audioEngine.playMusic("combat")).not.toThrow();
	});

	it("should stop music", async () => {
		await audioEngine.init();
		audioEngine.playMusic("menu");
		expect(() => audioEngine.stopMusic()).not.toThrow();
	});
});
