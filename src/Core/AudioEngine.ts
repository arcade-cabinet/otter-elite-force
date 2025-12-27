/**
 * Audio Engine
 * Handles all game audio synthesis using Tone.js
 *
 * Uses synth pooling for better performance - synths are created once
 * and reused rather than being created/destroyed per sound effect.
 */

import * as Tone from "tone";

// Pool size for each synth type
const POOL_SIZE = 4;

interface SynthPool {
	synths: Tone.Synth[];
	index: number;
}

export class AudioEngine {
	private initialized = false;
	private noiseSynth: Tone.NoiseSynth | null = null;
	private bassSynth: Tone.Synth | null = null;
	private loop: Tone.Loop | null = null;
	private musicSynth: Tone.PolySynth | Tone.MonoSynth | null = null;
	private musicPattern: Tone.Pattern<string> | null = null;

	// Synth pools for different sound effects
	private shootPool: SynthPool = { synths: [], index: 0 };
	private hitPool: SynthPool = { synths: [], index: 0 };
	private pickupPool: SynthPool = { synths: [], index: 0 };

	/**
	 * Initialize Tone.js
	 * MUST be called after user gesture (click/touch)
	 */
	async init(): Promise<void> {
		if (this.initialized) return;

		await Tone.start();
		console.log("Audio engine initialized");

		// Create reusable noise synth for explosions
		this.noiseSynth = new Tone.NoiseSynth({
			noise: { type: "white" },
			envelope: { attack: 0.005, decay: 0.1, sustain: 0 },
		}).toDestination();

		// Create reusable bass synth for explosions
		this.bassSynth = new Tone.Synth({
			oscillator: { type: "sine" },
			envelope: { attack: 0.01, decay: 0.4, sustain: 0, release: 0.2 },
		}).toDestination();

		// Initialize synth pools
		this.initShootPool();
		this.initHitPool();
		this.initPickupPool();

		this.initialized = true;
	}

	/**
	 * Initialize pool of synths for shooting sounds
	 */
	private initShootPool(): void {
		for (let i = 0; i < POOL_SIZE; i++) {
			const synth = new Tone.Synth({
				oscillator: { type: "sawtooth" },
				envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
			}).toDestination();
			this.shootPool.synths.push(synth);
		}
	}

	/**
	 * Initialize pool of synths for hit sounds
	 */
	private initHitPool(): void {
		for (let i = 0; i < POOL_SIZE; i++) {
			const synth = new Tone.Synth({
				oscillator: { type: "square" },
				envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 },
			}).toDestination();
			this.hitPool.synths.push(synth);
		}
	}

	/**
	 * Initialize pool of synths for pickup sounds
	 */
	private initPickupPool(): void {
		for (let i = 0; i < POOL_SIZE; i++) {
			const synth = new Tone.Synth({
				oscillator: { type: "sine" },
				envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 },
			}).toDestination();
			this.pickupPool.synths.push(synth);
		}
	}

	/**
	 * Get next synth from pool (round-robin)
	 */
	private getFromPool(pool: SynthPool): Tone.Synth {
		const synth = pool.synths[pool.index];
		pool.index = (pool.index + 1) % pool.synths.length;
		return synth;
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
				// Gunshot: quick sawtooth sweep (using pooled synth)
				const synth = this.getFromPool(this.shootPool);
				synth.triggerAttackRelease("A2", "16n", now);
				break;
			}

			case "hit": {
				// Impact: square wave thump (using pooled synth)
				const synth = this.getFromPool(this.hitPool);
				synth.triggerAttackRelease("G2", "32n", now);
				break;
			}

			case "pickup": {
				// Pickup: ascending sine (using pooled synth)
				const synth = this.getFromPool(this.pickupPool);
				synth.triggerAttackRelease("C5", "8n", now);
				// Get another synth for the second note
				const synth2 = this.getFromPool(this.pickupPool);
				synth2.triggerAttackRelease("E5", "8n", now + 0.1);
				break;
			}

			case "explode": {
				// Explosion: filtered noise burst + low rumble
				if (this.noiseSynth) {
					this.noiseSynth.triggerAttackRelease("8n", now);
				}
				if (this.bassSynth) {
					this.bassSynth.triggerAttackRelease("C1", "4n", now);
				}
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
		// Dispose all pooled synths
		this.shootPool.synths.forEach((synth) => synth.dispose());
		this.shootPool.synths = [];
		this.shootPool.index = 0;

		this.hitPool.synths.forEach((synth) => synth.dispose());
		this.hitPool.synths = [];
		this.hitPool.index = 0;

		this.pickupPool.synths.forEach((synth) => synth.dispose());
		this.pickupPool.synths = [];
		this.pickupPool.index = 0;

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
		this.bassSynth?.dispose();
		this.bassSynth = null;
		this.initialized = false;
	}
}

// Singleton instance
export const audioEngine = new AudioEngine();
