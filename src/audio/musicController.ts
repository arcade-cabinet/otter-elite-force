/**
 * Music Controller — Wires music to screen and combat state.
 *
 * US-031: Automatic music transitions based on game context:
 * - Menu music when AppScreen is "menu"
 * - Ambient gameplay music when in game, no combat
 * - Combat music fades in (1s crossfade) when engaging enemies
 * - Combat music fades back after 5+ seconds no combat
 * - Briefing track during mission intro
 * - Music respects UserSettings volume
 * - Smooth transitions
 */

import { type AudioEngine, audioEngine } from "./engine";

/** How long (ms) after last combat event before reverting to ambient. */
const COMBAT_COOLDOWN_MS = 5000;

export type MusicState = "menu" | "briefing" | "ambient" | "combat" | "silent";

export class MusicController {
	private engine: AudioEngine;
	private currentState: MusicState = "silent";
	private lastCombatTimestamp = 0;
	private checkInterval: ReturnType<typeof setInterval> | null = null;
	private inCombat = false;

	constructor(engine?: AudioEngine) {
		this.engine = engine ?? audioEngine;
	}

	/**
	 * Set the desired music state. The controller will handle smooth transitions.
	 */
	setState(state: MusicState): void {
		if (state === this.currentState) return;
		this.currentState = state;
		this.applyState();
	}

	/**
	 * Notify the controller that combat is happening right now.
	 * Called by the game loop when units are engaging enemies.
	 */
	notifyCombat(): void {
		this.lastCombatTimestamp = Date.now();
		if (!this.inCombat && this.currentState === "ambient") {
			this.inCombat = true;
			this.engine.playMusic("combatTrack");
		}
	}

	/**
	 * Check if combat has cooled down and revert to ambient.
	 * Should be called periodically (e.g. from a game loop tick or setInterval).
	 */
	tick(): void {
		if (!this.inCombat) return;
		if (this.currentState !== "ambient") {
			// If we're no longer in game, stop combat tracking
			this.inCombat = false;
			return;
		}

		const elapsed = Date.now() - this.lastCombatTimestamp;
		if (elapsed >= COMBAT_COOLDOWN_MS) {
			this.inCombat = false;
			this.engine.playMusic("ambientTrack");
		}
	}

	/**
	 * Update volume from user settings.
	 */
	setVolume(volume: number): void {
		this.engine.setMusicVolume(volume);
	}

	/**
	 * Get the current music state.
	 */
	getState(): MusicState {
		return this.currentState;
	}

	/**
	 * Whether the controller considers the game to be in active combat.
	 */
	isInCombat(): boolean {
		return this.inCombat;
	}

	/**
	 * Clean up resources.
	 */
	dispose(): void {
		if (this.checkInterval) {
			clearInterval(this.checkInterval);
			this.checkInterval = null;
		}
		this.inCombat = false;
		this.currentState = "silent";
	}

	private applyState(): void {
		switch (this.currentState) {
			case "menu":
				this.inCombat = false;
				this.engine.playMusic("menuTrack");
				break;
			case "briefing":
				this.inCombat = false;
				this.engine.playMusic("briefingTrack");
				break;
			case "ambient":
				if (!this.inCombat) {
					this.engine.playMusic("ambientTrack");
				}
				// If in combat, keep playing combat track until cooldown
				break;
			case "combat":
				this.inCombat = true;
				this.engine.playMusic("combatTrack");
				break;
			case "silent":
				this.inCombat = false;
				this.engine.stopMusic();
				break;
		}
	}
}

/** Singleton music controller instance. */
export const musicController = new MusicController();
