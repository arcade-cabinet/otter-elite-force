/**
 * Audio Runtime — Non-React wrapper around the AudioEngine.
 *
 * US-F08: Migrates audio initialization and control out of React hooks
 * so it can be driven by the pure engine runtime.
 *
 * Wires the REAL audio subsystems from src/audio/:
 * - AudioEngine (Tone.js procedural SFX + music)
 * - SFX Bridge (EventBus gameplay events -> SFX calls)
 * - MusicController (menu/combat/briefing music transitions)
 * - Voice Barks (unit selection + command acknowledgment)
 *
 * - initAudioRuntime() sets up audio context on first user interaction
 * - syncAudioFromWorld() reads world settings and applies volume levels
 * - tickMusicController() drives combat music transitions each frame
 * - playBattleMusic(), playMenuMusic(), stopMusic() delegate to AudioEngine
 * - playSfx() delegates to AudioEngine
 */

import type { AudioEngine } from "@/audio/engine";
import type { MusicController, MusicState } from "@/audio/musicController";
import type { GameWorld } from "../world/gameWorld";

let engineRef: AudioEngine | null = null;
let engineLoading = false;
let unlockListenerAttached = false;

/** SFX bridge teardown function (returned by installSFXBridge). */
let sfxBridgeTeardown: (() => void) | null = null;

/** Music controller instance. */
let musicControllerRef: MusicController | null = null;

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
 * Install the SFX bridge and music controller after engine is ready.
 * These wire EventBus gameplay events to SFX calls and manage music state.
 */
async function installAudioBridge(): Promise<void> {
	if (!engineRef) return;

	// Install SFX bridge (EventBus -> AudioEngine.playSFX)
	// This connects unit-selected, move-command, melee-hit, building-complete, etc.
	// to the Tone.js SFX player, including voice barks for unit selection/commands.
	try {
		const { installSFXBridge } = await import("@/audio/sfxBridge");
		if (sfxBridgeTeardown) sfxBridgeTeardown();
		sfxBridgeTeardown = installSFXBridge(engineRef);
	} catch {
		// sfxBridge not available (e.g., in test environment)
	}

	// Initialize music controller for state-driven transitions
	try {
		const { MusicController } = await import("@/audio/musicController");
		musicControllerRef = new MusicController(engineRef);
	} catch {
		// musicController not available
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
				// Engine is ready -- wire up SFX bridge and music controller
				await installAudioBridge();
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
 * Tick the music controller for combat/ambient transitions.
 * Call once per frame from the game loop.
 */
export function tickMusicController(): void {
	if (musicControllerRef) {
		musicControllerRef.tick();
	}
}

/**
 * Set the music controller's state for screen-based transitions.
 * Maps game phases to music states.
 */
export function setMusicState(state: MusicState): void {
	if (musicControllerRef) {
		musicControllerRef.setState(state);
	}
}

/**
 * Notify the music controller that combat is happening.
 * Triggers combat music crossfade from ambient.
 */
export function notifyCombat(): void {
	if (musicControllerRef) {
		musicControllerRef.notifyCombat();
	}
}

/**
 * Play the battle/combat music track.
 */
export function playBattleMusic(): void {
	if (musicControllerRef) {
		musicControllerRef.setState("combat");
		return;
	}
	if (!engineRef?.isReady) return;
	engineRef.playMusic("combatTrack");
}

/**
 * Play the menu music track.
 */
export function playMenuMusic(): void {
	if (musicControllerRef) {
		musicControllerRef.setState("menu");
		return;
	}
	if (!engineRef?.isReady) return;
	engineRef.playMusic("menuTrack");
}

/**
 * Play the ambient (in-game non-combat) music track.
 */
export function playAmbientMusic(): void {
	if (musicControllerRef) {
		musicControllerRef.setState("ambient");
		return;
	}
	if (!engineRef?.isReady) return;
	engineRef.playMusic("ambientTrack");
}

/**
 * Play the briefing music track.
 */
export function playBriefingMusic(): void {
	if (musicControllerRef) {
		musicControllerRef.setState("briefing");
		return;
	}
	if (!engineRef?.isReady) return;
	engineRef.playMusic("briefingTrack");
}

/**
 * Stop all currently playing music.
 */
export function stopMusic(): void {
	if (musicControllerRef) {
		musicControllerRef.setState("silent");
		return;
	}
	if (!engineRef) return;
	engineRef.stopMusic();
}

/**
 * Play a sound effect by name. Delegates to AudioEngine.playSFX.
 */
export function playSfx(name: string): void {
	if (!engineRef?.isReady) return;
	// The AudioEngine uses SFXType which is a string union.
	// We pass the name through -- if it doesn't match a known type,
	// the underlying Tone.js player will simply no-op.
	engineRef.playSFX(name as Parameters<AudioEngine["playSFX"]>[0]);
}

/**
 * Dispose all audio resources and reset state.
 * Call on app shutdown or test teardown.
 */
export function disposeAudioRuntime(): void {
	if (sfxBridgeTeardown) {
		sfxBridgeTeardown();
		sfxBridgeTeardown = null;
	}
	if (musicControllerRef) {
		musicControllerRef.dispose();
		musicControllerRef = null;
	}
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
