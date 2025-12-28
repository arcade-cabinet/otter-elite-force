/**
 * Audio Engine
 * Legacy wrapper around strata audio-synth for backwards compatibility.
 * New code should use strata AudioSynthProvider and hooks directly.
 *
 * @deprecated Use @strata-game-library/audio-synth directly
 */

import { createSynthManager, type ISynthManager } from "../lib/strata/audio-synth";

/**
 * Legacy AudioEngine class that wraps strata SynthManager.
 * Provides the same API as the original implementation for backwards compatibility.
 *
 * @deprecated Use AudioSynthProvider and useAudioSynth hook instead
 */
export class AudioEngine {
	private manager: ISynthManager;

	constructor() {
		this.manager = createSynthManager({ debug: false });
	}

	/**
	 * Initialize Tone.js via strata SynthManager.
	 * MUST be called after user gesture (click/touch).
	 */
	async init(): Promise<void> {
		await this.manager.init();
		console.log("Audio engine initialized (via strata audio-synth)");
	}

	/**
	 * Play a sound effect using strata presets.
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
	 * Play background music using strata patterns.
	 */
	playMusic(type: "menu" | "combat"): void {
		this.manager.playMusic(type);
	}

	/**
	 * Stop background music.
	 */
	stopMusic(): void {
		this.manager.stopMusic();
	}

	/**
	 * Stop all sounds and reset state.
	 */
	stopAll(): void {
		this.manager.stopAll();
	}

	/**
	 * Check if audio is ready.
	 */
	isReady(): boolean {
		return this.manager.isReady();
	}

	/**
	 * Cleanup.
	 */
	dispose(): void {
		this.manager.dispose();
	}
}

// Singleton instance for backwards compatibility
export const audioEngine = new AudioEngine();
