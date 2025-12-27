/**
 * Audio Engine
 * Handles all game audio synthesis using Tone.js
 */

import * as Tone from "tone";

type MusicType = "menu" | "combat";

export class AudioEngine {
	private initialized = false;
	private synths: Map<string, Tone.Synth> = new Map();
	private noiseSynth: Tone.NoiseSynth | null = null;
	private activePatterns: (Tone.Pattern<any> | Tone.PolySynth | Tone.MonoSynth)[] = [];
	private fadeTimeouts: Set<ReturnType<typeof setTimeout>> = new Set();

	// Cross-fade support
	private activeVolume: Tone.Volume | null = null;
	private crossfadeDuration = 2; // seconds

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
				// Tone.js scheduling for the second note to avoid hardcoded timeout
				synth?.triggerAttackRelease("C5", "8n", now);
				synth?.triggerAttackRelease("E5", "8n", now + 0.1);
				break;
			}
			case "explode": {
				if (this.noiseSynth) {
					this.noiseSynth.triggerAttackRelease("8n", now);
				}
				const hitSynth = this.synths.get("hit");
				hitSynth?.triggerAttackRelease("C1", "4n", now);
				break;
			}
		}
	}

	/**
	 * Play background music (procedural) with cross-fade
	 */
	playMusic(type: MusicType): void {
		if (!this.initialized) return;

		const fadeTime = this.crossfadeDuration;
		const oldVolume = this.activeVolume;
		const oldPatterns = [...this.activePatterns];

		// Create new volume node for incoming music
		const newVolume = new Tone.Volume(-60).toDestination(); // Start silent
		this.activeVolume = newVolume;
		this.activePatterns = [];

		// Fade out old music
		if (oldVolume) {
			oldVolume.volume.rampTo(-60, fadeTime);
			const timeoutId = setTimeout(() => {
				this._disposeOldMusic(oldVolume, oldPatterns);
				this.fadeTimeouts.delete(timeoutId);
			}, fadeTime * 1000);
			this.fadeTimeouts.add(timeoutId);
		} else {
			Tone.getTransport().stop();
			Tone.getTransport().cancel();
		}

		if (type === "menu") {
			const synth = new Tone.PolySynth(Tone.Synth).connect(newVolume);
			synth.set({
				oscillator: { type: "sine" },
				envelope: { attack: 0.1, decay: 0.2, sustain: 0.3, release: 0.5 },
			});

			const pattern = new Tone.Pattern(
				(time, note) => {
					synth.triggerAttackRelease(note as string, "8n", time);
				},
				["C4", "E4", "G4", "B4", "A4", "G4", "E4", "D4"],
				"upDown",
			);
			pattern.interval = "4n";
			pattern.start(0);

			this.activePatterns.push(synth, pattern);
		} else {
			const bass = new Tone.MonoSynth({
				oscillator: { type: "sawtooth" },
				envelope: { attack: 0.1, decay: 0.3, sustain: 0.4, release: 0.1 },
				filter: { Q: 2, type: "lowpass", rolloff: -12 },
				filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.2, baseFrequency: 200, octaves: 2 },
			}).connect(newVolume);

			const pattern = new Tone.Pattern(
				(time, note) => {
					bass.triggerAttackRelease(note as string, "16n", time);
				},
				["C2", "C2", "G2", "C2", "F2", "C2", "G2", "B1"],
				"upDown",
			);
			pattern.interval = "8n";
			pattern.start(0);

			this.activePatterns.push(bass, pattern);
		}

		if (Tone.getTransport().state !== "started") {
			Tone.getTransport().start();
		}

		newVolume.volume.rampTo(0, fadeTime);
	}

	private _disposeOldMusic(
		oldVolume: Tone.Volume,
		oldPatterns: (Tone.Pattern<any> | Tone.PolySynth | Tone.MonoSynth)[],
	): void {
		for (const item of oldPatterns) {
			item.dispose();
		}
		oldVolume.dispose();
	}

	/**
	 * Stop background music with fade out
	 */
	stopMusic(fade = true): void {
		if (fade && this.activeVolume) {
			const oldVolume = this.activeVolume;
			const oldPatterns = [...this.activePatterns];
			this.activeVolume = null;
			this.activePatterns = [];

			oldVolume.volume.rampTo(-60, this.crossfadeDuration);
			const timeoutId = setTimeout(() => {
				Tone.getTransport().stop();
				Tone.getTransport().cancel();
				this._disposeOldMusic(oldVolume, oldPatterns);
				this.fadeTimeouts.delete(timeoutId);
			}, this.crossfadeDuration * 1000);
			this.fadeTimeouts.add(timeoutId);
		} else {
			Tone.getTransport().stop();
			Tone.getTransport().cancel();
			this._cleanupPatterns();
			this.activeVolume?.dispose();
			this.activeVolume = null;
		}
	}

	private _cleanupPatterns(): void {
		for (const item of this.activePatterns) {
			item.dispose();
		}
		this.activePatterns = [];
	}

	/**
	 * Stop all current sounds non-destructively
	 */
	silenceAll(): void {
		this.stopMusic(false);
		// We don't dispose the reusable synths here, just stop any active notes
		this.synths.forEach((synth) => {
			synth.triggerRelease();
		});
		this.noiseSynth?.triggerRelease();
	}

	/**
	 * Stop all sounds and dispose synths (destructive)
	 */
	stopAll(): void {
		this.stopMusic(false);
		this.fadeTimeouts.forEach(clearTimeout);
		this.fadeTimeouts.clear();
		this.synths.forEach((synth) => {
			synth.dispose();
		});
		this.synths.clear();
		this.noiseSynth?.dispose();
		this.noiseSynth = null;
		this.initialized = false; // Reset initialized so it can be re-init
	}

	/**
	 * Check if audio is ready
	 */
	isReady(): boolean {
		return this.initialized;
	}

	/**
	 * Full cleanup
	 */
	dispose(): void {
		this.stopAll();
		this.noiseSynth?.dispose();
		this.noiseSynth = null;
	}
}

// Singleton instance
export const audioEngine = new AudioEngine();
