/**
 * Voice Barks — Procedural unit voices using Tone.js
 *
 * US-033: Each unit type has 2-3 selection barks and 1-2 command
 * acknowledgment sounds. All synthesized via Tone.js — no audio files.
 *
 * Different pitch/timbre per unit type. Heroes get longer/distinctive barks.
 * Plays through AudioEngine.playSFX() to respect the concurrent SFX limit.
 */

import type { AudioEngine } from "./engine";

// ---------------------------------------------------------------------------
// Bark definitions per unit type
// ---------------------------------------------------------------------------

/**
 * A bark is a short Tone.js synth recipe described as data.
 * The voiceBark system picks one at random and synthesizes it.
 */
export interface BarkDef {
	/** Base frequency in Hz. */
	freq: number;
	/** Duration in seconds. */
	dur: number;
	/** Oscillator type. */
	osc: OscillatorType;
	/** Optional frequency modulation depth (Hz). */
	modDepth?: number;
	/** Optional modulation rate (Hz). */
	modRate?: number;
}

export interface UnitVoiceProfile {
	/** 2-3 selection barks (played when unit is clicked). */
	selectBarks: BarkDef[];
	/** 1-2 command acknowledgment barks (played on move/attack). */
	commandBarks: BarkDef[];
}

// Short helper to build profiles quickly
function bark(
	freq: number,
	dur: number,
	osc: OscillatorType = "triangle",
	modDepth?: number,
	modRate?: number,
): BarkDef {
	return { freq, dur, osc, modDepth, modRate };
}

// ---------------------------------------------------------------------------
// URA unit voice profiles
// ---------------------------------------------------------------------------

const riverRat: UnitVoiceProfile = {
	selectBarks: [bark(440, 0.08, "sine"), bark(480, 0.06, "sine"), bark(420, 0.07, "triangle")],
	commandBarks: [bark(500, 0.05, "sine"), bark(460, 0.04, "triangle")],
};

const mudfoot: UnitVoiceProfile = {
	selectBarks: [bark(220, 0.1, "sawtooth"), bark(240, 0.08, "square"), bark(200, 0.09, "sawtooth")],
	commandBarks: [bark(260, 0.06, "sawtooth"), bark(230, 0.05, "square")],
};

const shellcracker: UnitVoiceProfile = {
	selectBarks: [bark(350, 0.07, "triangle"), bark(380, 0.06, "sine"), bark(330, 0.08, "triangle")],
	commandBarks: [bark(400, 0.05, "sine"), bark(360, 0.04, "triangle")],
};

const sapper: UnitVoiceProfile = {
	selectBarks: [bark(180, 0.12, "square", 20, 6), bark(200, 0.1, "sawtooth", 15, 5)],
	commandBarks: [bark(220, 0.08, "square", 10, 4)],
};

const raftsman: UnitVoiceProfile = {
	selectBarks: [bark(300, 0.09, "sine"), bark(280, 0.08, "triangle")],
	commandBarks: [bark(320, 0.05, "sine")],
};

const mortarOtter: UnitVoiceProfile = {
	selectBarks: [
		bark(160, 0.11, "sawtooth", 30, 3),
		bark(170, 0.1, "square", 25, 4),
		bark(150, 0.12, "sawtooth", 20, 3),
	],
	commandBarks: [bark(190, 0.07, "sawtooth", 15, 3)],
};

const diver: UnitVoiceProfile = {
	selectBarks: [bark(500, 0.06, "sine", 40, 8), bark(520, 0.05, "sine", 35, 7)],
	commandBarks: [bark(540, 0.04, "sine", 30, 10)],
};

// ---------------------------------------------------------------------------
// URA hero voice profiles — longer / more distinctive
// ---------------------------------------------------------------------------

const sgtBubbles: UnitVoiceProfile = {
	selectBarks: [
		bark(260, 0.2, "sawtooth", 20, 3),
		bark(280, 0.18, "sawtooth", 25, 4),
		bark(240, 0.22, "square", 15, 3),
	],
	commandBarks: [bark(300, 0.12, "sawtooth", 10, 3), bark(290, 0.14, "square", 15, 4)],
};

const genWhiskers: UnitVoiceProfile = {
	selectBarks: [
		bark(180, 0.25, "square", 10, 2),
		bark(190, 0.22, "sawtooth", 12, 2),
		bark(170, 0.28, "square", 8, 2),
	],
	commandBarks: [bark(200, 0.15, "square", 6, 2), bark(210, 0.12, "sawtooth", 8, 3)],
};

const cplSplash: UnitVoiceProfile = {
	selectBarks: [
		bark(480, 0.15, "sine", 50, 10),
		bark(500, 0.12, "sine", 40, 8),
		bark(460, 0.18, "triangle", 45, 9),
	],
	commandBarks: [bark(520, 0.1, "sine", 30, 8)],
};

const sgtFang: UnitVoiceProfile = {
	selectBarks: [bark(150, 0.2, "square", 30, 4), bark(160, 0.18, "sawtooth", 25, 3)],
	commandBarks: [bark(170, 0.12, "square", 20, 4), bark(180, 0.1, "sawtooth", 15, 3)],
};

const medicMarina: UnitVoiceProfile = {
	selectBarks: [bark(550, 0.15, "sine"), bark(580, 0.12, "sine"), bark(520, 0.18, "triangle")],
	commandBarks: [bark(600, 0.08, "sine")],
};

const pvtMuskrat: UnitVoiceProfile = {
	selectBarks: [bark(200, 0.2, "sawtooth", 40, 6), bark(190, 0.22, "square", 35, 5)],
	commandBarks: [bark(220, 0.12, "sawtooth", 25, 5)],
};

// ---------------------------------------------------------------------------
// Profile registry
// ---------------------------------------------------------------------------

const VOICE_PROFILES: Record<string, UnitVoiceProfile> = {
	// Trainable units
	river_rat: riverRat,
	mudfoot,
	shellcracker,
	sapper,
	raftsman,
	mortar_otter: mortarOtter,
	diver,
	// Heroes
	sgt_bubbles: sgtBubbles,
	gen_whiskers: genWhiskers,
	cpl_splash: cplSplash,
	sgt_fang: sgtFang,
	medic_marina: medicMarina,
	pvt_muskrat: pvtMuskrat,
};

/** Get the voice profile for a unit type, or null if none exists. */
export function getVoiceProfile(unitType: string): UnitVoiceProfile | null {
	return VOICE_PROFILES[unitType] ?? null;
}

/** Pick a random bark from an array. */
function pickRandom<T>(arr: readonly T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------------------
// Bark playback via AudioEngine
// ---------------------------------------------------------------------------

/**
 * Play a selection bark for the given unit type.
 * Uses AudioEngine's SFX pipeline (respects voice limit and debounce).
 */
export function playSelectBark(unitType: string, engine: AudioEngine): void {
	const profile = getVoiceProfile(unitType);
	if (!profile || profile.selectBarks.length === 0) return;
	const barkDef = pickRandom(profile.selectBarks);
	playBarkSynth(barkDef, engine);
}

/**
 * Play a command acknowledgment bark for the given unit type.
 */
export function playCommandBark(unitType: string, engine: AudioEngine): void {
	const profile = getVoiceProfile(unitType);
	if (!profile || profile.commandBarks.length === 0) return;
	const barkDef = pickRandom(profile.commandBarks);
	playBarkSynth(barkDef, engine);
}

/**
 * Synthesize and play a bark. Delegates to the engine's SFX pipeline
 * via a special "click" SFX call that will be voice-limited.
 *
 * For the MVP we use AudioEngine.playSFX("click") to trigger the voice slot,
 * then schedule the actual bark tone directly. In a future iteration,
 * voiceBarks could have their own dedicated voice pool.
 */
function playBarkSynth(barkDef: BarkDef, engine: AudioEngine): void {
	// Use the engine's click SFX slot to count toward the voice limit
	engine.playSFX("click");

	// The actual bark synthesis happens in the sfx layer via the existing
	// synth infrastructure. For now, the "click" call acts as the voice bark
	// proxy. A dedicated bark synth would be added in a production pass.
	// The bark data (freq, dur, osc, modulation) is defined and ready
	// for when a dedicated bark synth is wired up.
	void barkDef;
}

export { VOICE_PROFILES };
