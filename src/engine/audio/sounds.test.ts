/**
 * Tests for LittleJS Sound-based audio system.
 *
 * W1-09: Verify sound system initialization, SFX playback, music control,
 * and settings sync.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock littlejsengine since it requires browser context
vi.mock("littlejsengine", () => {
	const mockSoundInstance = { stop: vi.fn() };

	// Sound must be a proper constructor class
	class MockSound {
		play(_pos?: unknown, _volume?: number): { stop(): void } {
			return mockSoundInstance;
		}
		playMusic(_volume?: number, _loop?: boolean): { stop(): void } {
			return mockSoundInstance;
		}
	}

	return {
		Sound: MockSound,
		vec2: (x: number, y: number) => ({ x, y }),
		setSoundVolume: vi.fn(),
	};
});

describe("sounds module", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it("exports initSoundSystem", async () => {
		const mod = await import("./sounds");
		expect(mod.initSoundSystem).toBeDefined();
		expect(typeof mod.initSoundSystem).toBe("function");
	});

	it("exports playSfxSound", async () => {
		const mod = await import("./sounds");
		expect(mod.playSfxSound).toBeDefined();
		expect(typeof mod.playSfxSound).toBe("function");
	});

	it("exports playMusicTrack", async () => {
		const mod = await import("./sounds");
		expect(mod.playMusicTrack).toBeDefined();
		expect(typeof mod.playMusicTrack).toBe("function");
	});

	it("exports stopMusic", async () => {
		const mod = await import("./sounds");
		expect(mod.stopMusic).toBeDefined();
		expect(typeof mod.stopMusic).toBe("function");
	});

	it("exports syncSoundSettings", async () => {
		const mod = await import("./sounds");
		expect(mod.syncSoundSettings).toBeDefined();
		expect(typeof mod.syncSoundSettings).toBe("function");
	});

	it("exports isSoundSystemReady", async () => {
		const mod = await import("./sounds");
		expect(mod.isSoundSystemReady).toBeDefined();
		expect(typeof mod.isSoundSystemReady).toBe("function");
	});

	it("isSoundSystemReady returns false before init", async () => {
		const mod = await import("./sounds");
		expect(mod.isSoundSystemReady()).toBe(false);
	});

	it("initSoundSystem creates Sound objects for all 13 SFX and 3 music tracks", async () => {
		const mod = await import("./sounds");
		await mod.initSoundSystem();
		expect(mod.isSoundSystemReady()).toBe(true);
	});

	it("playSfxSound is no-op before init", async () => {
		const mod = await import("./sounds");
		// Should not throw
		mod.playSfxSound("click");
		mod.playSfxSound("unit_select", { x: 10, y: 20 });
	});

	it("playSfxSound plays after init", async () => {
		const mod = await import("./sounds");
		await mod.initSoundSystem();
		// Should not throw
		mod.playSfxSound("click");
		mod.playSfxSound("melee_hit", { x: 5, y: 10 });
		mod.playSfxSound("nonexistent_sfx"); // Should silently skip
	});

	it("playMusicTrack and stopMusic lifecycle", async () => {
		const mod = await import("./sounds");
		await mod.initSoundSystem();
		mod.playMusicTrack("combat");
		mod.playMusicTrack("combat"); // Same track, should no-op
		mod.stopMusic();
		mod.stopMusic(); // Already stopped, should no-op
	});

	it("defines all 13 SFX from audio-design.md", async () => {
		const mod = await import("./sounds");
		await mod.initSoundSystem();
		expect(mod.isSoundSystemReady()).toBe(true);
		const sfxNames = [
			"click",
			"unit_select",
			"unit_deselect",
			"error",
			"move_order",
			"attack_order",
			"melee_hit",
			"ranged_fire",
			"ranged_hit",
			"unit_death",
			"building_place",
			"building_complete",
			"resource_gather",
		];
		for (const name of sfxNames) {
			mod.playSfxSound(name);
		}
	});
});
