/**
 * SFX Player — Procedural sound effects using Tone.js
 *
 * Each SFX is a short synthesized sound designed to match
 * the gritty, analog military aesthetic.
 */

import * as Tone from "tone";

export type SFXType =
	| "click"
	| "unitSelect"
	| "unitMove"
	| "unitAttack"
	| "unitDeath"
	| "buildStart"
	| "buildComplete"
	| "resourceGather"
	| "resourceDeposit";

export interface SFXPlayer {
	play(type: SFXType, volume: number): void;
	dispose(): void;
}

/**
 * SFX definitions — each is a function that triggers
 * a short synthesized sound at the given volume.
 */
type SFXFactory = (volume: number) => void;

export function createSFXPlayer(): SFXPlayer {
	// Shared synths — reuse across SFX calls to avoid GC churn
	const clickSynth = new Tone.MembraneSynth({
		pitchDecay: 0.008,
		octaves: 2,
		envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 },
	}).toDestination();

	const selectSynth = new Tone.Synth({
		oscillator: { type: "triangle" },
		envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.05 },
	}).toDestination();

	const moveSynth = new Tone.Synth({
		oscillator: { type: "sine" },
		envelope: { attack: 0.01, decay: 0.08, sustain: 0, release: 0.05 },
	}).toDestination();

	const attackSynth = new Tone.NoiseSynth({
		noise: { type: "white" },
		envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.02 },
	}).toDestination();

	const deathSynth = new Tone.FMSynth({
		harmonicity: 0.5,
		modulationIndex: 8,
		envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.2 },
		modulation: { type: "square" },
	}).toDestination();

	const buildSynth = new Tone.MetalSynth({
		frequency: 300,
		envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 },
		harmonicity: 5.1,
		modulationIndex: 16,
		resonance: 4000,
		octaves: 1.5,
	}).toDestination();

	const gatherSynth = new Tone.PluckSynth({
		attackNoise: 1,
		dampening: 4000,
		resonance: 0.9,
	}).toDestination();

	const synths = [
		clickSynth,
		selectSynth,
		moveSynth,
		attackSynth,
		deathSynth,
		buildSynth,
		gatherSynth,
	];

	function setVolume(synth: { volume: { value: number } }, volume: number): void {
		synth.volume.value = Tone.gainToDb(Math.max(0.001, volume));
	}

	const sfxMap: Record<SFXType, SFXFactory> = {
		click: (vol) => {
			setVolume(clickSynth, vol);
			clickSynth.triggerAttackRelease("C2", 0.05);
		},
		unitSelect: (vol) => {
			setVolume(selectSynth, vol);
			selectSynth.triggerAttackRelease("E5", 0.08);
		},
		unitMove: (vol) => {
			setVolume(moveSynth, vol);
			moveSynth.triggerAttackRelease("G4", 0.06);
		},
		unitAttack: (vol) => {
			setVolume(attackSynth, vol);
			attackSynth.triggerAttackRelease(0.08);
		},
		unitDeath: (vol) => {
			setVolume(deathSynth, vol);
			deathSynth.triggerAttackRelease("C2", 0.3);
		},
		buildStart: (vol) => {
			setVolume(buildSynth, vol);
			buildSynth.triggerAttackRelease("C4", 0.1);
		},
		buildComplete: (vol) => {
			setVolume(buildSynth, vol * 0.8);
			buildSynth.triggerAttackRelease("G4", 0.15);
		},
		resourceGather: (vol) => {
			setVolume(gatherSynth, vol);
			gatherSynth.triggerAttack("A3");
		},
		resourceDeposit: (vol) => {
			setVolume(gatherSynth, vol);
			gatherSynth.triggerAttack("E4");
		},
	};

	return {
		play(type: SFXType, volume: number): void {
			const factory = sfxMap[type];
			if (factory) {
				factory(volume);
			}
		},
		dispose(): void {
			for (const synth of synths) {
				synth.dispose();
			}
		},
	};
}
