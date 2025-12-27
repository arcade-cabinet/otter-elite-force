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
	private activePatterns: (Tone.Pattern<any> | Tone.PolySynth | Tone.MonoSynth)[] = [];

	/**
	 * Initialize Tone.js
	 * MUST be called after user gesture (click/touch)
	 */
	async init(): Promise<void> {
		if (this.initialized) return;

		await Tone.start();
		console.log("Audio engine initialized");

		// Create reusable synths for SFX
		this.synths.set(
			"shoot",
			new Tone.Synth({
				oscillator: { type: "sawtooth" },
				envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
			}).toDestination(),
		);

		this.synths.set(
			"hit",
			new Tone.Synth({
				oscillator: { type: "square" },
				envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 },
			}).toDestination(),
		);

		this.synths.set(
			"pickup",
			new Tone.Synth({
				oscillator: { type: "sine" },
				envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 },
			}).toDestination(),
		);

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
				const synth = this.synths.get("shoot");
				synth?.triggerAttackRelease("A2", "16n", now);
				break;
			}
			case "hit": {
				const synth = this.synths.get("hit");
				synth?.triggerAttackRelease("G2", "32n", now);
				break;
			}
			case "pickup": {
				const synth = this.synths.get("pickup");
				synth?.triggerAttackRelease("C5", "8n", now);
				synth?.triggerAttackRelease("E5", "8n", now + 0.1);
				break;
			}
			case "explode": {
				if (this.noiseSynth) {
					this.noiseSynth.triggerAttackRelease("8n", now);
				}
				// Use the "hit" synth for a low thud instead of creating a new one
				const hitSynth = this.synths.get("hit");
				hitSynth?.triggerAttackRelease("C1", "4n", now);
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
			const synth = new Tone.PolySynth(Tone.Synth).toDestination();
			synth.set({
				oscillator: { type: "sine" },
				envelope: { attack: 0.1, decay: 0.2, sustain: 0.3, release: 0.5 },
			});

			const pattern = new Tone.Pattern(
				(time, note) => {
					synth.triggerAttackRelease(note, "8n", time);
				},
				["C4", "E4", "G4", "B4", "A4", "G4", "E4", "D4"],
				"upDown",
			);
			pattern.interval = "4n";
			pattern.start(0);

			this.activePatterns.push(synth, pattern);
			Tone.getTransport().start();
		} else {
			const bass = new Tone.MonoSynth({
				oscillator: { type: "sawtooth" },
				envelope: { attack: 0.1, decay: 0.3, sustain: 0.4, release: 0.1 },
				filter: { Q: 2, type: "lowpass", rolloff: -12 },
				filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.2, baseFrequency: 200, octaves: 2 },
			}).toDestination();

			const pattern = new Tone.Pattern(
				(time, note) => {
					bass.triggerAttackRelease(note, "16n", time);
				},
				["C2", "C2", "G2", "C2", "F2", "C2", "G2", "B1"],
				"upDown",
			);
			pattern.interval = "8n";
			pattern.start(0);

			this.activePatterns.push(bass, pattern);
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
		for (const item of this.activePatterns) {
			item.dispose();
		}
		this.activePatterns = [];
	}

	/**
	 * Stop all sounds
	 */
	stopAll(): void {
		this.stopMusic();
		this.synths.forEach((synth) => {
			synth.dispose();
		});
		this.synths.clear();
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
