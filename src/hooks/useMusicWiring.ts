/**
 * useMusicWiring — Wires music to AppScreen and combat state.
 *
 * US-031: Automatically transitions music based on game context.
 * Uses the MusicController to manage smooth transitions.
 *
 * Place in the root AppRouter component, after useAudioUnlock.
 */

import { useTrait, useWorld } from "koota/react";
import { useEffect, useRef } from "react";
import { type MusicState, musicController } from "@/audio/musicController";
import { Targeting } from "@/ecs/relations";
import { Attack } from "@/ecs/traits/combat";
import { Faction } from "@/ecs/traits/identity";
import { AppScreen, GamePhase, UserSettings } from "@/ecs/traits/state";

/**
 * Map screen + phase state to a music state.
 */
function resolveDesiredMusicState(
	screen: string,
	phase: string,
): MusicState {
	if (screen === "menu" || screen === "settings") return "menu";
	if (screen === "victory") return "menu";
	if (screen === "game") {
		if (phase === "loading") return "briefing";
		return "ambient"; // Combat is handled dynamically via notifyCombat
	}
	return "silent";
}

export function useMusicWiring(): void {
	const world = useWorld();
	const appScreen = useTrait(world, AppScreen);
	const gamePhase = useTrait(world, GamePhase);
	const settings = useTrait(world, UserSettings);
	const screen = appScreen?.screen ?? "menu";
	const phase = gamePhase?.phase ?? "loading";
	const musicVolume = settings?.musicVolume ?? 0.7;
	const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// Update volume when settings change
	useEffect(() => {
		musicController.setVolume(musicVolume);
	}, [musicVolume]);

	// Set desired music state based on screen/phase
	useEffect(() => {
		const desired = resolveDesiredMusicState(screen, phase);
		musicController.setState(desired);
	}, [screen, phase]);

	// Poll for combat state and tick the controller
	useEffect(() => {
		if (screen !== "game") {
			// Not in game, no need to poll combat
			if (tickRef.current) {
				clearInterval(tickRef.current);
				tickRef.current = null;
			}
			return;
		}

		tickRef.current = setInterval(() => {
			// Check if any URA units are targeting enemies (combat is active)
			let hasCombat = false;
			try {
				const combatants = world.query(Attack, Faction, Targeting("*"));
				for (const entity of combatants) {
					const faction = entity.get(Faction);
					if (faction?.id === "ura") {
						hasCombat = true;
						break;
					}
				}
			} catch {
				// World may not be ready — ignore
			}

			if (hasCombat) {
				musicController.notifyCombat();
			}

			musicController.tick();
		}, 500);

		return () => {
			if (tickRef.current) {
				clearInterval(tickRef.current);
				tickRef.current = null;
			}
		};
	}, [screen, world]);

	// Clean up on unmount
	useEffect(() => {
		return () => {
			musicController.dispose();
		};
	}, []);
}
