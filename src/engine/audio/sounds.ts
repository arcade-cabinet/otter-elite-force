/**
 * LittleJS Sound-based audio system.
 *
 * W1-09: All audio uses LittleJS Sound class with zzfx arrays instead of Tone.js.
 * Provides positional audio via Sound.play(pos) — sounds near camera are louder.
 *
 * SFX are generated zzfx arrays. Music uses Sound.playMusic() for seamless looping.
 * Volume tied to settings via LittleJS soundVolume.
 *
 * References:
 *   - https://killedbyapixel.github.io/ZzFX/ for zzfx sound design
 *   - LittleJS Sound class: play(pos, volume, pitch, randomness, loop, paused)
 */

import type { GameWorld } from "../world/gameWorld";

/** Lazy-loaded LittleJS module reference. */
let ljs: typeof import("littlejsengine") | null = null;

const sounds = new Map<
	string,
	{
		play(
			pos?: unknown,
			volume?: number,
			pitch?: number,
			randomnessScale?: number,
			loop?: boolean,
			paused?: boolean,
		): { stop(): void };
		playMusic(volume?: number, loop?: boolean, paused?: boolean): { stop(): void };
	}
>();

/** Current music instance for stopping. */
let currentMusicInstance: { stop(): void } | null = null;
let currentMusicTrack = "";

const _ = undefined;

/**
 * zzfx parameter arrays for all 13 SFX from audio-design.md.
 * Undefined entries use zzfx defaults.
 */
const SFX_DEFS: Record<string, (number | undefined)[]> = {
	// UI/selection
	click: [_, _, 1e3, 0.01, 0.01, 0.03, _, 1.5, _, _, _, _, _, _, _, _, _, 0.5, 0.01],
	unit_select: [_, _, 800, 0.02, 0.05, 0.1, _, 0.8, _, _, 200, 0.05, _, _, _, _, _, 0.6, 0.03],
	unit_deselect: [_, _, 500, 0.01, 0.03, 0.08, _, 1.2, _, _, _, _, _, _, _, _, _, 0.4, 0.02],
	error: [_, _, 200, 0.03, 0.1, 0.15, 4, 2, _, _, _, _, _, _, _, _, _, 0.5, 0.05],

	// Orders
	move_order: [_, _, 600, 0.01, 0.02, 0.06, _, 1, _, _, _, _, _, _, _, _, _, 0.6, 0.02],
	attack_order: [_, _, 400, 0.02, 0.03, 0.08, _, 1.5, _, _, _, _, _, _, _, _, _, 0.7, 0.03],

	// Combat
	melee_hit: [_, _, 300, 0.02, 0.04, 0.1, 4, 2.5, _, _, _, _, _, _, _, _, _, 0.6, 0.02],
	ranged_fire: [_, _, 900, 0.01, 0.02, 0.05, _, 0.5, _, _, _, _, _, _, _, _, _, 0.7, 0.01],
	ranged_hit: [_, _, 500, 0.02, 0.03, 0.08, 4, 1.5, _, _, _, _, _, _, _, _, _, 0.5, 0.02],
	unit_death: [_, _, 150, 0.05, 0.2, 0.3, 4, 3, _, _, _, _, _, _, _, _, _, 0.6, 0.1],

	// Economy/Building
	building_place: [_, _, 200, 0.02, 0.1, 0.2, _, 1, _, _, _, _, _, _, _, _, _, 0.5, 0.05],
	building_complete: [
		_,
		_,
		700,
		0.02,
		0.08,
		0.15,
		_,
		0.8,
		_,
		_,
		300,
		0.1,
		_,
		_,
		_,
		_,
		_,
		0.6,
		0.08,
	],
	resource_gather: [_, _, 400, 0.01, 0.03, 0.06, _, 1.2, _, _, _, _, _, _, _, _, _, 0.4, 0.02],
};

/** Music zzfx arrays (simple melodic loops). */
const MUSIC_DEFS: Record<string, (number | undefined)[]> = {
	menu: [_, _, 300, 0.5, 0.8, 1.5, _, 0.3, _, _, _, _, 0.15, _, _, _, _, 0.3, 1.5],
	combat: [_, _, 200, 0.3, 0.5, 1.0, 2, 0.5, _, _, _, _, 0.1, _, _, _, _, 0.4, 1.0],
	briefing: [_, _, 350, 0.4, 0.7, 1.2, _, 0.4, _, _, _, _, 0.12, _, _, _, _, 0.35, 1.2],
};

/**
 * Initialize the LittleJS Sound system.
 * Must be called after LittleJS module is loaded.
 */
export async function initSoundSystem(): Promise<void> {
	ljs = await import("littlejsengine");

	// Create Sound objects from zzfx arrays
	for (const [name, zzfxArray] of Object.entries(SFX_DEFS)) {
		sounds.set(name, new ljs.Sound(zzfxArray, 0.1));
	}

	// Create music Sound objects
	for (const [name, zzfxArray] of Object.entries(MUSIC_DEFS)) {
		sounds.set(`music_${name}`, new ljs.Sound(zzfxArray));
	}
}

/**
 * Play a sound effect with optional positional audio.
 * @param name - SFX name from SFX_DEFS
 * @param pos - Optional world position for spatial audio (louder when near camera)
 */
export function playSfxSound(name: string, pos?: { x: number; y: number }): void {
	if (!ljs) return;
	const sound = sounds.get(name);
	if (!sound) return;

	if (pos) {
		sound.play(ljs.vec2(pos.x, pos.y));
	} else {
		sound.play();
	}
}

/**
 * Start playing a music track.
 * @param track - "menu", "combat", or "briefing"
 */
export function playMusicTrack(track: string): void {
	if (!ljs) return;
	if (currentMusicTrack === track) return;

	// Stop current music
	stopMusic();

	const sound = sounds.get(`music_${track}`);
	if (!sound) return;

	const instance = sound.playMusic(0.3, true);
	currentMusicInstance = instance;
	currentMusicTrack = track;
}

/** Stop currently playing music. */
export function stopMusic(): void {
	if (currentMusicInstance) {
		currentMusicInstance.stop();
		currentMusicInstance = null;
		currentMusicTrack = "";
	}
}

/**
 * Sync audio volumes from world settings.
 * Called each frame in gameUpdatePost.
 */
export function syncSoundSettings(world: GameWorld): void {
	if (!ljs) return;
	ljs.setSoundVolume(world.settings.masterVolume);
}

/** Check if the sound system is initialized. */
export function isSoundSystemReady(): boolean {
	return ljs !== null && sounds.size > 0;
}
