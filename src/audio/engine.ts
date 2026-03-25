/**
 * Audio Engine — Tone.js-based procedural audio for OEF RTS
 *
 * Provides a unified interface for SFX and music playback.
 * All sounds are synthesized procedurally — no external audio files.
 *
 * Must call init() after a user gesture (click/touch) to unlock
 * the Web Audio context.
 *
 * US-032: Audio polish — concurrent SFX limit (max 4 voices),
 * identical SFX debounce (100ms), mute toggle, volume sliders.
 */

import * as Tone from "tone";
import { createMusicPlayer, type MusicPlayer } from "./music";
import { createSFXPlayer, type SFXPlayer, type SFXType } from "./sfx";

export type MusicTrack = "menuTrack" | "ambientTrack" | "combatTrack" | "briefingTrack";

/** Maximum number of concurrent SFX voices. */
const MAX_SFX_VOICES = 4;

/** Debounce window for identical SFX (ms). */
const SFX_DEBOUNCE_MS = 100;

export class AudioEngine {
	private sfxPlayer: SFXPlayer | null = null;
	private musicPlayer: MusicPlayer | null = null;
	private _ready = false;
	private _masterVolume = 1.0;
	private _sfxVolume = 1.0;
	private _musicVolume = 0.6;
	private _muted = false;

	/** Tracks active SFX voice timestamps for concurrent limiting. */
	private _activeSFXCount = 0;
	private _sfxDecayTimers: ReturnType<typeof setTimeout>[] = [];

	/** Last play timestamp per SFX type for debouncing. */
	private _lastSFXTime = new Map<SFXType, number>();

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
	 * Respects max concurrent voices (4) and identical SFX debounce (100ms).
	 */
	playSFX(type: SFXType): void {
		if (!this._ready || !this.sfxPlayer || this._muted) return;

		const effectiveVolume = this._sfxVolume * this._masterVolume;
		if (effectiveVolume <= 0) return;

		// Debounce: skip if same SFX played within 100ms
		const now = Date.now();
		const lastTime = this._lastSFXTime.get(type) ?? 0;
		if (now - lastTime < SFX_DEBOUNCE_MS) return;
		this._lastSFXTime.set(type, now);

		// Voice limit: skip if too many concurrent voices
		if (this._activeSFXCount >= MAX_SFX_VOICES) return;

		this._activeSFXCount++;
		this.sfxPlayer.play(type, effectiveVolume);

		// Approximate SFX duration — release voice after 300ms
		const timer = setTimeout(() => {
			this._activeSFXCount = Math.max(0, this._activeSFXCount - 1);
			const idx = this._sfxDecayTimers.indexOf(timer);
			if (idx >= 0) this._sfxDecayTimers.splice(idx, 1);
		}, 300);
		this._sfxDecayTimers.push(timer);
	}

	/**
	 * Start playing a music track. Stops any currently playing track.
	 */
	playMusic(track: MusicTrack): void {
		if (!this._ready || !this.musicPlayer || this._muted) return;
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

	/**
	 * Toggle mute on/off.
	 */
	setMuted(muted: boolean): void {
		this._muted = muted;
		if (muted) {
			this.stopMusic();
		}
	}

	get isMuted(): boolean {
		return this._muted;
	}

	get isReady(): boolean {
		return this._ready;
	}

	/**
	 * Dispose all audio resources.
	 */
	dispose(): void {
		this.stopAll();
		for (const timer of this._sfxDecayTimers) {
			clearTimeout(timer);
		}
		this._sfxDecayTimers = [];
		this._activeSFXCount = 0;
		this._lastSFXTime.clear();
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
