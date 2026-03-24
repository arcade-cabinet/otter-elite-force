/**
 * Audio Engine — Tone.js-based procedural audio for OEF RTS
 *
 * Provides a unified interface for SFX and music playback.
 * All sounds are synthesized procedurally — no external audio files.
 *
 * Must call init() after a user gesture (click/touch) to unlock
 * the Web Audio context.
 */

import * as Tone from "tone";
import { createMusicPlayer, type MusicPlayer } from "./music";
import { createSFXPlayer, type SFXPlayer, type SFXType } from "./sfx";

export type MusicTrack = "menuTrack" | "combatTrack";

export class AudioEngine {
	private sfxPlayer: SFXPlayer | null = null;
	private musicPlayer: MusicPlayer | null = null;
	private _ready = false;
	private _masterVolume = 1.0;
	private _sfxVolume = 1.0;
	private _musicVolume = 0.6;

	/**
	 * Initialize the Tone.js audio context.
	 * MUST be called after a user gesture (click/touch).
	 */
	async init(): Promise<void> {
		if (this._ready) return;

		await Tone.start();

		this.sfxPlayer = createSFXPlayer();
		this.musicPlayer = createMusicPlayer();

		this._ready = true;
	}

	/**
	 * Play a sound effect.
	 */
	playSFX(type: SFXType): void {
		if (!this._ready || !this.sfxPlayer) return;
		this.sfxPlayer.play(type, this._sfxVolume * this._masterVolume);
	}

	/**
	 * Start playing a music track. Stops any currently playing track.
	 */
	playMusic(track: MusicTrack): void {
		if (!this._ready || !this.musicPlayer) return;
		this.musicPlayer.play(track, this._musicVolume * this._masterVolume);
	}

	/**
	 * Stop the currently playing music track.
	 */
	stopMusic(): void {
		if (!this.musicPlayer) return;
		this.musicPlayer.stop();
	}

	/**
	 * Stop all audio (SFX + music).
	 */
	stopAll(): void {
		this.stopMusic();
	}

	/**
	 * Set master volume (0.0 to 1.0).
	 */
	setMasterVolume(volume: number): void {
		this._masterVolume = Math.max(0, Math.min(1, volume));
	}

	/**
	 * Set SFX volume (0.0 to 1.0).
	 */
	setSFXVolume(volume: number): void {
		this._sfxVolume = Math.max(0, Math.min(1, volume));
	}

	/**
	 * Set music volume (0.0 to 1.0).
	 */
	setMusicVolume(volume: number): void {
		this._musicVolume = Math.max(0, Math.min(1, volume));
		if (this.musicPlayer) {
			this.musicPlayer.setVolume(this._musicVolume * this._masterVolume);
		}
	}

	get isReady(): boolean {
		return this._ready;
	}

	/**
	 * Dispose all audio resources.
	 */
	dispose(): void {
		this.stopAll();
		if (this.sfxPlayer) {
			this.sfxPlayer.dispose();
			this.sfxPlayer = null;
		}
		if (this.musicPlayer) {
			this.musicPlayer.dispose();
			this.musicPlayer = null;
		}
		this._ready = false;
	}
}

/** Singleton audio engine instance */
export const audioEngine = new AudioEngine();
