/**
 * Audio Engine
 * Handles all game audio synthesis using @strata-game-library/audio-synth
 */

import { createSynthManager, type ISynthManager } from "@strata-game-library/audio-synth";

export class AudioEngine {
	private manager: ISynthManager;

	constructor() {
		this.manager = createSynthManager({ debug: false });
	}

	/**
	 * Initialize Tone.js via strata SynthManager.
	 * MUST be called after user gesture (click/touch)
	 */
	async init(): Promise<void> {
		await this.manager.init();
		console.log("Audio engine initialized (via strata audio-synth)");
	}

	/**
	 * Play a sound effect using strata presets
	 */
	playSFX(type: "shoot" | "hit" | "pickup" | "explode"): void {
		// Map legacy types to strata preset IDs
		const presetMap: Record<string, string> = {
			shoot: "gunshot",
			hit: "impact",
			pickup: "pickup",
			explode: "explosion",
		};

		this.manager.playSFX(presetMap[type] || type);
	}

	/**
	 * Play background music using strata patterns
	 */
	playMusic(type: "menu" | "combat"): void {
		this.manager.playMusic(type);
	}

	/**
	 * Stop background music
	 */
	stopMusic(): void {
		this.manager.stopMusic();
	}

	/**
	 * Stop all sounds and reset state
	 */
	stopAll(): void {
		this.manager.stopAll();
	}

	/**
	 * Check if audio is ready
	 */
	isReady(): boolean {
		return this.manager.isReady();
	}

	/**
	 * Cleanup
	 */
	dispose(): void {
		this.manager.dispose();
	}
}

// Singleton instance
export const audioEngine = new AudioEngine();
