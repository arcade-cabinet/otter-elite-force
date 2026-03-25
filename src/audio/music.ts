/**
 * Music Player — Procedural background music using Tone.js
 *
 * Generates looping musical patterns for menu and combat contexts.
 * Bleached, analog military aesthetic — no sci-fi synths.
 */

import * as Tone from "tone";

export type MusicTrackId = "menuTrack" | "ambientTrack" | "combatTrack" | "briefingTrack";

export interface MusicPlayer {
	play(track: MusicTrackId, volume: number): void;
	stop(): void;
	setVolume(volume: number): void;
	dispose(): void;
}

export function createMusicPlayer(): MusicPlayer {
	let currentTrack: MusicTrackId | null = null;
	let activeParts: Tone.Sequence[] = [];
	let synths: Tone.PolySynth[] = [];

	function stopCurrent(): void {
		const transport = Tone.getTransport();
		for (const part of activeParts) {
			part.stop();
			part.dispose();
		}
		activeParts = [];
		for (const synth of synths) {
			synth.dispose();
		}
		synths = [];
		transport.stop();
		transport.cancel();
		currentTrack = null;
	}

	function applyVolume(volume: number): void {
		const db = Tone.gainToDb(Math.max(0.001, volume));
		for (const synth of synths) {
			synth.volume.value = db;
		}
	}

	function startMenuTrack(volume: number): void {
		const transport = Tone.getTransport();
		transport.bpm.value = 72;

		// Ambient pad — sparse, melancholic minor chords
		const padSynth = new Tone.PolySynth(Tone.Synth, {
			oscillator: { type: "triangle" },
			envelope: { attack: 0.8, decay: 1.5, sustain: 0.4, release: 2.0 },
		}).toDestination();
		padSynth.volume.value = Tone.gainToDb(Math.max(0.001, volume));
		synths.push(padSynth);

		const chords = [
			["D3", "F3", "A3"],
			["C3", "E3", "G3"],
			["Bb2", "D3", "F3"],
			["A2", "C3", "E3"],
		];

		const padSequence = new Tone.Sequence(
			(time, chord) => {
				if (chord) {
					padSynth.triggerAttackRelease(chord, "2n", time);
				}
			},
			chords,
			"1n",
		);
		padSequence.loop = true;
		activeParts.push(padSequence);
		padSequence.start(0);
		transport.start();
	}

	function startCombatTrack(volume: number): void {
		const transport = Tone.getTransport();
		transport.bpm.value = 120;

		// Driving bass pattern
		const bassSynth = new Tone.PolySynth(Tone.Synth, {
			oscillator: { type: "sawtooth" },
			envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.1 },
		}).toDestination();
		bassSynth.volume.value = Tone.gainToDb(Math.max(0.001, volume));
		synths.push(bassSynth);

		const bassNotes = ["D2", "D2", "F2", "D2", "G2", "D2", "A2", "G2"];

		const bassSequence = new Tone.Sequence(
			(time, note) => {
				if (note) {
					bassSynth.triggerAttackRelease(note, "8n", time);
				}
			},
			bassNotes,
			"8n",
		);
		bassSequence.loop = true;
		activeParts.push(bassSequence);

		// Staccato tension layer
		const tensionSynth = new Tone.PolySynth(Tone.Synth, {
			oscillator: { type: "square" },
			envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.05 },
		}).toDestination();
		tensionSynth.volume.value = Tone.gainToDb(Math.max(0.001, volume * 0.5));
		synths.push(tensionSynth);

		const tensionPattern = [
			["D4", "F4"],
			null,
			null,
			["D4", "F4"],
			null,
			["G4", "Bb4"],
			null,
			null,
		];

		const tensionSequence = new Tone.Sequence(
			(time, notes) => {
				if (notes) {
					tensionSynth.triggerAttackRelease(notes, "16n", time);
				}
			},
			tensionPattern,
			"8n",
		);
		tensionSequence.loop = true;
		activeParts.push(tensionSequence);

		bassSequence.start(0);
		tensionSequence.start(0);
		transport.start();
	}

	function startAmbientTrack(volume: number): void {
		const transport = Tone.getTransport();
		transport.bpm.value = 60;

		// Sparse ambient pads — calm riverine atmosphere
		const padSynth = new Tone.PolySynth(Tone.Synth, {
			oscillator: { type: "sine" },
			envelope: { attack: 1.2, decay: 2.0, sustain: 0.3, release: 3.0 },
		}).toDestination();
		padSynth.volume.value = Tone.gainToDb(Math.max(0.001, volume * 0.7));
		synths.push(padSynth);

		const chords = [
			["G3", "B3", "D4"],
			["F3", "A3", "C4"],
			["E3", "G3", "B3"],
			["D3", "F3", "A3"],
		];

		const padSequence = new Tone.Sequence(
			(time, chord) => {
				if (chord) {
					padSynth.triggerAttackRelease(chord, "1n", time);
				}
			},
			chords,
			"1n",
		);
		padSequence.loop = true;
		activeParts.push(padSequence);
		padSequence.start(0);
		transport.start();
	}

	function startBriefingTrack(volume: number): void {
		const transport = Tone.getTransport();
		transport.bpm.value = 80;

		// Military snare march feel with muted brass-like synth
		const brassSynth = new Tone.PolySynth(Tone.Synth, {
			oscillator: { type: "sawtooth" },
			envelope: { attack: 0.3, decay: 0.8, sustain: 0.2, release: 1.0 },
		}).toDestination();
		brassSynth.volume.value = Tone.gainToDb(Math.max(0.001, volume * 0.5));
		synths.push(brassSynth);

		const notes = [["D3", "F3"], null, ["C3", "E3"], null, ["Bb2", "D3"], null, ["A2", "C3"], null];

		const brassSequence = new Tone.Sequence(
			(time, chord) => {
				if (chord) {
					brassSynth.triggerAttackRelease(chord, "4n", time);
				}
			},
			notes,
			"4n",
		);
		brassSequence.loop = true;
		activeParts.push(brassSequence);
		brassSequence.start(0);
		transport.start();
	}

	return {
		play(track: MusicTrackId, volume: number): void {
			if (currentTrack === track) return;
			stopCurrent();
			currentTrack = track;

			if (track === "menuTrack") {
				startMenuTrack(volume);
			} else if (track === "ambientTrack") {
				startAmbientTrack(volume);
			} else if (track === "combatTrack") {
				startCombatTrack(volume);
			} else if (track === "briefingTrack") {
				startBriefingTrack(volume);
			}
		},

		stop(): void {
			stopCurrent();
		},

		setVolume(volume: number): void {
			applyVolume(volume);
		},

		dispose(): void {
			stopCurrent();
		},
	};
}
