import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the sfx and music modules to avoid Tone.js AudioParam issues in test env
vi.mock("../../audio/sfx", () => ({
	createSFXPlayer: vi.fn(() => ({
		play: vi.fn(),
		dispose: vi.fn(),
	})),
}));

vi.mock("../../audio/music", () => ({
	createMusicPlayer: vi.fn(() => ({
		play: vi.fn(),
		stop: vi.fn(),
		setVolume: vi.fn(),
		dispose: vi.fn(),
	})),
}));

import { AudioEngine } from "../../audio/engine";
import { MusicController } from "../../audio/musicController";

describe("MusicController", () => {
	let engine: AudioEngine;
	let controller: MusicController;
	let playMusicSpy: ReturnType<typeof vi.fn>;
	let stopMusicSpy: ReturnType<typeof vi.fn>;
	let setMusicVolumeSpy: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		engine = new AudioEngine();
		await engine.init();
		playMusicSpy = vi.spyOn(engine, "playMusic");
		stopMusicSpy = vi.spyOn(engine, "stopMusic");
		setMusicVolumeSpy = vi.spyOn(engine, "setMusicVolume");
		controller = new MusicController(engine);
	});

	afterEach(() => {
		controller.dispose();
		engine.dispose();
		vi.restoreAllMocks();
	});

	describe("setState", () => {
		it("plays menu track when state is menu", () => {
			controller.setState("menu");
			expect(playMusicSpy).toHaveBeenCalledWith("menuTrack");
			expect(controller.getState()).toBe("menu");
		});

		it("plays ambient track when state is ambient", () => {
			controller.setState("ambient");
			expect(playMusicSpy).toHaveBeenCalledWith("ambientTrack");
		});

		it("plays combat track when state is combat", () => {
			controller.setState("combat");
			expect(playMusicSpy).toHaveBeenCalledWith("combatTrack");
		});

		it("plays briefing track when state is briefing", () => {
			controller.setState("briefing");
			expect(playMusicSpy).toHaveBeenCalledWith("briefingTrack");
		});

		it("stops music when state is silent", () => {
			controller.setState("menu");
			playMusicSpy.mockClear();
			controller.setState("silent");
			expect(stopMusicSpy).toHaveBeenCalled();
		});

		it("does not re-play the same state", () => {
			controller.setState("menu");
			playMusicSpy.mockClear();
			controller.setState("menu");
			expect(playMusicSpy).not.toHaveBeenCalled();
		});
	});

	describe("combat transitions", () => {
		it("switches to combat music when notifyCombat is called during ambient", () => {
			controller.setState("ambient");
			playMusicSpy.mockClear();
			controller.notifyCombat();
			expect(playMusicSpy).toHaveBeenCalledWith("combatTrack");
			expect(controller.isInCombat()).toBe(true);
		});

		it("does not switch to combat music when in menu state", () => {
			controller.setState("menu");
			playMusicSpy.mockClear();
			controller.notifyCombat();
			expect(playMusicSpy).not.toHaveBeenCalledWith("combatTrack");
		});

		it("reverts to ambient after combat cooldown", () => {
			controller.setState("ambient");
			controller.notifyCombat();
			playMusicSpy.mockClear();

			// Advance past the 5s cooldown by manipulating the timestamp
			const now = Date.now();
			vi.spyOn(Date, "now").mockReturnValue(now + 6000);

			controller.tick();
			expect(playMusicSpy).toHaveBeenCalledWith("ambientTrack");
			expect(controller.isInCombat()).toBe(false);
		});

		it("stays in combat if notifyCombat is called within cooldown", () => {
			controller.setState("ambient");
			controller.notifyCombat();
			playMusicSpy.mockClear();

			// Advance 2s (within cooldown)
			const now = Date.now();
			vi.spyOn(Date, "now").mockReturnValue(now + 2000);

			controller.tick();
			expect(controller.isInCombat()).toBe(true);
			expect(playMusicSpy).not.toHaveBeenCalledWith("ambientTrack");
		});

		it("refreshes combat cooldown when notifyCombat is called again", () => {
			controller.setState("ambient");
			controller.notifyCombat();

			// Advance 4s
			const now1 = Date.now();
			vi.spyOn(Date, "now").mockReturnValue(now1 + 4000);
			controller.tick();
			expect(controller.isInCombat()).toBe(true);

			// Notify again (refreshes timestamp)
			vi.spyOn(Date, "now").mockReturnValue(now1 + 4000);
			controller.notifyCombat();

			// Advance 3s from refresh (total 7s from start, but only 3s from last combat)
			vi.spyOn(Date, "now").mockReturnValue(now1 + 7000);
			controller.tick();
			expect(controller.isInCombat()).toBe(true);
		});
	});

	describe("volume", () => {
		it("forwards volume to engine", () => {
			controller.setVolume(0.5);
			expect(setMusicVolumeSpy).toHaveBeenCalledWith(0.5);
		});
	});

	describe("dispose", () => {
		it("resets state on dispose", () => {
			controller.setState("combat");
			controller.dispose();
			expect(controller.getState()).toBe("silent");
			expect(controller.isInCombat()).toBe(false);
		});
	});
});
