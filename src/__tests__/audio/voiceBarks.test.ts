/**
 * Voice Barks Tests (US-033)
 *
 * Verifies:
 * - Each URA unit type has a voice profile
 * - Selection barks: 2-3 per unit type
 * - Command barks: 1-2 per unit type
 * - Heroes have longer barks (dur >= 0.12)
 * - Bark playback delegates to AudioEngine (voice limit respected)
 * - Unknown unit types return null profile
 */

import { describe, expect, it, vi } from "vitest";
import type { AudioEngine } from "@/audio/engine";
import {
	getVoiceProfile,
	playCommandBark,
	playSelectBark,
	VOICE_PROFILES,
} from "@/audio/voiceBarks";
import { URA_HEROES, URA_UNITS } from "@/data/units";

function createMockEngine(): AudioEngine {
	return {
		playSFX: vi.fn(),
		playMusic: vi.fn(),
		stopMusic: vi.fn(),
		stopAll: vi.fn(),
		setMasterVolume: vi.fn(),
		setSFXVolume: vi.fn(),
		setMusicVolume: vi.fn(),
		setMuted: vi.fn(),
		init: vi.fn(),
		dispose: vi.fn(),
		isReady: true,
		isMuted: false,
	} as unknown as AudioEngine;
}

describe("US-033: Unit Voice Barks", () => {
	describe("URA trainable units have voice profiles", () => {
		for (const unitId of Object.keys(URA_UNITS)) {
			it(`${unitId} has a voice profile`, () => {
				const profile = getVoiceProfile(unitId);
				expect(profile).not.toBeNull();
			});
		}
	});

	describe("URA heroes have voice profiles", () => {
		for (const heroId of Object.keys(URA_HEROES)) {
			it(`${heroId} has a voice profile`, () => {
				const profile = getVoiceProfile(heroId);
				expect(profile).not.toBeNull();
			});
		}
	});

	describe("bark counts", () => {
		for (const [unitId, profile] of Object.entries(VOICE_PROFILES)) {
			it(`${unitId} has 2-3 select barks`, () => {
				expect(profile.selectBarks.length).toBeGreaterThanOrEqual(2);
				expect(profile.selectBarks.length).toBeLessThanOrEqual(3);
			});

			it(`${unitId} has 1-2 command barks`, () => {
				expect(profile.commandBarks.length).toBeGreaterThanOrEqual(1);
				expect(profile.commandBarks.length).toBeLessThanOrEqual(2);
			});
		}
	});

	describe("hero barks are longer", () => {
		const heroIds = Object.keys(URA_HEROES);

		for (const heroId of heroIds) {
			it(`${heroId} select barks have dur >= 0.12`, () => {
				const profile = getVoiceProfile(heroId);
				if (!profile) return; // Skip if profile doesn't exist
				for (const bark of profile.selectBarks) {
					expect(bark.dur).toBeGreaterThanOrEqual(0.12);
				}
			});
		}
	});

	describe("different pitch per unit type", () => {
		it("unit types have distinct base frequencies", () => {
			const freqs = new Set<number>();
			for (const profile of Object.values(VOICE_PROFILES)) {
				const baseFreq = profile.selectBarks[0].freq;
				freqs.add(baseFreq);
			}
			// At least 5 distinct frequencies across all profiles
			expect(freqs.size).toBeGreaterThanOrEqual(5);
		});
	});

	describe("bark playback", () => {
		it("playSelectBark calls engine.playSFX", () => {
			const engine = createMockEngine();
			playSelectBark("mudfoot", engine);
			expect(engine.playSFX).toHaveBeenCalled();
		});

		it("playCommandBark calls engine.playSFX", () => {
			const engine = createMockEngine();
			playCommandBark("mudfoot", engine);
			expect(engine.playSFX).toHaveBeenCalled();
		});

		it("does nothing for unknown unit type", () => {
			const engine = createMockEngine();
			playSelectBark("unknown_unit", engine);
			expect(engine.playSFX).not.toHaveBeenCalled();
		});

		it("getVoiceProfile returns null for unknown type", () => {
			expect(getVoiceProfile("nonexistent")).toBeNull();
		});
	});
});
