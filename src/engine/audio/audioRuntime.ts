/**
 * Audio Runtime — Non-React wrapper around the AudioEngine.
 *
 * US-F08: Migrates audio initialization and control out of React hooks
 * so it can be driven by the pure engine runtime.
 *
 * - initAudioRuntime() sets up audio context on first user interaction
 * - syncAudioFromWorld() reads world settings and applies volume levels
 * - playBattleMusic(), playMenuMusic(), stopMusic() delegate to AudioEngine
 * - playSfx() delegates to AudioEngine
 */

import type { AudioEngine } from "@/audio/engine";
import type { GameWorld } from "../world/gameWorld";

let engineRef: AudioEngine | null = null;
let engineLoading = false;
let unlockListenerAttached = false;

/**
 * Lazily loads the audio engine module.
 * Returns null if already loading or load fails.
 */
async function loadEngine(): Promise<AudioEngine | null> {
	if (engineRef) return engineRef;
	if (engineLoading) return null;
	engineLoading = true;
	try {
		const mod = await import("@/audio/engine");
		engineRef = mod.audioEngine;
		return engineRef;
	} catch {
		engineLoading = false;
		return null;
	}
}

/**
 * Initialize the audio runtime. Attaches a one-shot user gesture listener
 * that unlocks the Web Audio context on first interaction.
 *
 * Safe to call multiple times; listeners are only attached once.
 */
export function initAudioRuntime(): void {
	if (unlockListenerAttached) return;
	unlockListenerAttached = true;

	let initializing = false;

	const handleGesture = async (): Promise<void> => {
		if (initializing) return;
		if (engineRef?.isReady) {
			removeListeners();
			return;
		}
		initializing = true;

		try {
			const engine = await loadEngine();
			if (engine) {
				await engine.init();
			}
		} catch {
			initializing = false;
		}

		if (engineRef?.isReady) {
			removeListeners();
		} else {
			initializing = false;
		}
	};

	const events = ["pointerdown", "keydown"] as const;

	const removeListeners = (): void => {
		for (const event of events) {
			document.removeEventListener(event, handleGesture, true);
		}
	};

	for (const event of events) {
		document.addEventListener(event, handleGesture, { capture: true });
	}
}

/**
 * Returns whether the audio engine is initialized and ready.
 */
export function isAudioReady(): boolean {
	return engineRef?.isReady ?? false;
}

/**
 * Sync audio volume levels from the game world settings.
 * Call once per frame or when settings change.
 */
export function syncAudioFromWorld(world: GameWorld): void {
	if (!engineRef?.isReady) return;
	engineRef.setMasterVolume(world.settings.masterVolume);
	engineRef.setMusicVolume(world.settings.musicVolume);
	engineRef.setSFXVolume(world.settings.sfxVolume);
}

/**
 * Play the battle/combat music track.
 */
export function playBattleMusic(): void {
	if (!engineRef?.isReady) return;
	engineRef.playMusic("combatTrack");
}

/**
 * Play the menu music track.
 */
export function playMenuMusic(): void {
	if (!engineRef?.isReady) return;
	engineRef.playMusic("menuTrack");
}

/**
 * Play the ambient (in-game non-combat) music track.
 */
export function playAmbientMusic(): void {
	if (!engineRef?.isReady) return;
	engineRef.playMusic("ambientTrack");
}

/**
 * Play the briefing music track.
 */
export function playBriefingMusic(): void {
	if (!engineRef?.isReady) return;
	engineRef.playMusic("briefingTrack");
}

/**
 * Stop all currently playing music.
 */
export function stopMusic(): void {
	if (!engineRef) return;
	engineRef.stopMusic();
}

/**
 * Play a sound effect by name. Delegates to AudioEngine.playSFX.
 */
export function playSfx(name: string): void {
	if (!engineRef?.isReady) return;
	// The AudioEngine uses SFXType which is a string union.
	// We pass the name through — if it doesn't match a known type,
	// the underlying Tone.js player will simply no-op.
	engineRef.playSFX(name as Parameters<AudioEngine["playSFX"]>[0]);
}

/**
 * Dispose all audio resources and reset state.
 * Call on app shutdown or test teardown.
 */
export function disposeAudioRuntime(): void {
	if (engineRef) {
		engineRef.dispose();
	}
	engineRef = null;
	engineLoading = false;
	unlockListenerAttached = false;
}

/**
 * Expose the internal engine ref for testing.
 * Returns null if not loaded.
 */
export function getAudioEngine(): AudioEngine | null {
	return engineRef;
}
