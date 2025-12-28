/**
 * Audio Engine
 * Handles all game audio synthesis using Tone.js
 */

import * as Tone from "tone";

export class AudioEngine {
	private initialized = false;
	private synths: Map<string, Tone.Synth> = new Map();
	private noiseSynth: Tone.NoiseSynth | null = null;
	private loop: Tone.Loop | null = null;
	private activeSynths: Set<Tone.Synth | Tone.MonoSynth> = new Set();
	private musicSynth: Tone.PolySynth | Tone.MonoSynth | null = null;
	private musicPattern: Tone.Pattern<string> | null = null;

	/**
	 * Initialize Tone.js
	 * MUST be called after user gesture (click/touch)
	 */
	async init(): Promise<void> {
		if (this.initialized) return;

		await Tone.start();
		console.log("Audio engine initialized");

		// Create reusable synths
		this.noiseSynth = new Tone.NoiseSynth({
			noise: { type: "white" },
			envelope: { attack: 0.005, decay: 0.1, sustain: 0 },
		}).toDestination();

		this.initialized = true;
	}

	/**
	 * Play a sound effect
	 */
	playSFX(type: "shoot" | "hit" | "pickup" | "explode"): void {
		if (!this.initialized) {
			console.warn("Audio not initialized");
			return;
		}

		const now = Tone.now();

		switch (type) {
			case "shoot": {
				// Gunshot: quick sawtooth sweep
				const synth = new Tone.Synth({
					oscillator: { type: "sawtooth" },
					envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
				}).toDestination();

				this.activeSynths.add(synth);
				synth.triggerAttackRelease("A2", "16n", now);
				setTimeout(() => {
					synth.dispose();
					this.activeSynths.delete(synth);
				}, 200);
				break;
			}

			case "hit": {
				// Impact: square wave thump
				const synth = new Tone.Synth({
					oscillator: { type: "square" },
					envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 },
				}).toDestination();

				this.activeSynths.add(synth);
				synth.triggerAttackRelease("G2", "32n", now);
				setTimeout(() => {
					synth.dispose();
					this.activeSynths.delete(synth);
				}, 200);
				break;
			}

			case "pickup": {
				// Pickup: ascending sine
				const synth = new Tone.Synth({
					oscillator: { type: "sine" },
					envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 },
				}).toDestination();

				this.activeSynths.add(synth);
				synth.triggerAttackRelease("C5", "8n", now);
				synth.triggerAttackRelease("E5", "8n", now + 0.1);
				setTimeout(() => {
					synth.dispose();
					this.activeSynths.delete(synth);
				}, 400);
				break;
			}

			case "explode": {
				// Explosion: filtered noise burst
				if (this.noiseSynth) {
					this.noiseSynth.triggerAttackRelease("8n", now);
				}

				// Low rumble
				const bass = new Tone.Synth({
					oscillator: { type: "sine" },
					envelope: { attack: 0.01, decay: 0.4, sustain: 0, release: 0.2 },
				}).toDestination();

				this.activeSynths.add(bass);
				bass.triggerAttackRelease("C1", "4n", now);
				setTimeout(() => {
					bass.dispose();
					this.activeSynths.delete(bass);
				}, 800);
				break;
			}
		}
	}

	/**
	 * Play background music (procedural)
	 */
	playMusic(type: "menu" | "combat"): void {
		if (!this.initialized) return;

		this.stopMusic();

		if (type === "menu") {
			// Melodic menu theme
			this.musicSynth = new Tone.PolySynth(Tone.Synth).toDestination();
			this.musicSynth.set({
				oscillator: { type: "sine" },
				envelope: { attack: 0.1, decay: 0.2, sustain: 0.3, release: 0.5 },
			});

			this.musicPattern = new Tone.Pattern(
				(time, note) => {
					(this.musicSynth as Tone.PolySynth)?.triggerAttackRelease(note, "8n", time);
				},
				["C4", "E4", "G4", "B4", "A4", "G4", "E4", "D4"],
				"upDown",
			);
			this.musicPattern.interval = "4n";
			this.musicPattern.start(0);

			this.loop = new Tone.Loop(() => {}, "1m"); // Dummy loop to track
			Tone.getTransport().start();
		} else {
			// Driving combat theme
			this.musicSynth = new Tone.MonoSynth({
				oscillator: { type: "sawtooth" },
				envelope: { attack: 0.1, decay: 0.3, sustain: 0.4, release: 0.1 },
				filter: { Q: 2, type: "lowpass", rolloff: -12 },
				filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.2, baseFrequency: 200, octaves: 2 },
			}).toDestination();

			this.musicPattern = new Tone.Pattern(
				(time, note) => {
					(this.musicSynth as Tone.MonoSynth)?.triggerAttackRelease(note, "16n", time);
				},
				["C2", "C2", "G2", "C2", "F2", "C2", "G2", "B1"],
				"upDown",
			);
			this.musicPattern.interval = "8n";
			this.musicPattern.start(0);

			Tone.getTransport().start();
		}
	}

	/**
	 * Stop background music
	 */
	stopMusic(): void {
		Tone.getTransport().stop();
		Tone.getTransport().cancel();
		if (this.loop) {
			this.loop.dispose();
			this.loop = null;
		}
		if (this.musicPattern) {
			this.musicPattern.dispose();
			this.musicPattern = null;
		}
		if (this.musicSynth) {
			this.musicSynth.dispose();
			this.musicSynth = null;
		}
	}

	/**
	 * Stop all sounds and reset state for re-initialization
	 */
	stopAll(): void {
		this.stopMusic();
		// Dispose all synths
		this.synths.forEach((synth) => {
			synth.dispose();
		});
		this.synths.clear();
		// Dispose active SFX synths
		this.activeSynths.forEach((synth) => {
			synth.dispose();
		});
		this.activeSynths.clear();
		this.initialized = false;
	}

	/**
	 * Check if audio is ready
	 */
	isReady(): boolean {
		return this.initialized;
	}

	/**
	 * Cleanup
	 */
	dispose(): void {
		this.stopAll();
		this.noiseSynth?.dispose();
		this.noiseSynth = null;
		this.initialized = false;
	}
}

// Singleton instance
export const audioEngine = new AudioEngine();
