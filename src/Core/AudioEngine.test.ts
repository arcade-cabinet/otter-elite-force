import * as Tone from "tone";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AudioEngine } from "./AudioEngine";

vi.mock("tone", () => {
	const mockSynth = {
		toDestination: vi.fn().mockReturnThis(),
		connect: vi.fn().mockReturnThis(),
		triggerAttackRelease: vi.fn(),
		triggerRelease: vi.fn(),
		dispose: vi.fn(),
		set: vi.fn(),
	};
	class MockSynth {
		toDestination = mockSynth.toDestination;
		connect = mockSynth.connect;
		triggerAttackRelease = mockSynth.triggerAttackRelease;
		triggerRelease = mockSynth.triggerRelease;
		dispose = mockSynth.dispose;
		set = mockSynth.set;
	}
	return {
		start: vi.fn().mockResolvedValue(undefined),
		now: vi.fn().mockReturnValue(0),
		Synth: MockSynth,
		PolySynth: vi.fn(() => mockSynth),
		MonoSynth: MockSynth,
		NoiseSynth: MockSynth,
		Volume: vi.fn(() => ({
			toDestination: vi.fn().mockReturnThis(),
			volume: { rampTo: vi.fn() },
			dispose: vi.fn(),
		})),
		Pattern: vi.fn(() => ({
			start: vi.fn(),
			dispose: vi.fn(),
		})),
		getTransport: vi.fn(() => ({
			start: vi.fn(),
			stop: vi.fn(),
			cancel: vi.fn(),
			state: "stopped",
		})),
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
		expect(Tone.start).toHaveBeenCalled();
	});

	it("should not play sounds before initialization", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		audioEngine.playSFX("shoot");
		expect(warnSpy).toHaveBeenCalledWith("Audio not initialized");
	});

	it("should cleanup on dispose", async () => {
		await audioEngine.init();
		audioEngine.dispose();
		expect(audioEngine.isReady()).toBe(false);
	});

	it("should be re-initializable after stopAll", async () => {
		await audioEngine.init();
		audioEngine.stopAll();
		expect(audioEngine.isReady()).toBe(false);
		await audioEngine.init();
		expect(audioEngine.isReady()).toBe(true);
	});

	it("should play shoot SFX after initialization", async () => {
		await audioEngine.init();
		// Should not throw
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
		expect(Tone.start).toHaveBeenCalledTimes(1);
	});

	it("should handle dispose when not initialized", () => {
		expect(() => audioEngine.dispose()).not.toThrow();
	});

	it("should handle stopAll when not initialized", () => {
		expect(() => audioEngine.stopAll()).not.toThrow();
	});
});
