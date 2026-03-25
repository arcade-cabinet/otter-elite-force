/**
 * useAudioSettings — Syncs UserSettings volumes to the AudioEngine.
 *
 * US-032: Reads sfxVolume and musicVolume from Koota UserSettings
 * and applies them to the lazy-loaded AudioEngine whenever they change.
 *
 * Place in the root AppRouter component, after useAudioUnlock.
 */

import { useTrait, useWorld } from "koota/react";
import { useEffect } from "react";
import { UserSettings } from "@/ecs/traits/state";

/**
 * Hook that syncs volume settings from Koota to the AudioEngine.
 * Pass the `audioReady` boolean from useAudioUnlock().
 */
export function useAudioSettings(audioReady: boolean): void {
	const world = useWorld();
	const settings = useTrait(world, UserSettings);
	const sfxVolume = settings?.sfxVolume ?? 1.0;
	const musicVolume = settings?.musicVolume ?? 0.7;

	useEffect(() => {
		if (!audioReady) return;
		(async () => {
			try {
				const { audioEngine } = await import("@/audio/engine");
				audioEngine.setSFXVolume(sfxVolume);
			} catch {
				// Audio not available
			}
		})();
	}, [audioReady, sfxVolume]);

	useEffect(() => {
		if (!audioReady) return;
		(async () => {
			try {
				const { audioEngine } = await import("@/audio/engine");
				audioEngine.setMusicVolume(musicVolume);
			} catch {
				// Audio not available
			}
		})();
	}, [audioReady, musicVolume]);
}
